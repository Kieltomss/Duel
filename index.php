<?php
// START SESSION AT THE VERY TOP!
session_start([
    // Secure session settings (recommended)
    'cookie_lifetime' => 86400, // 1 day
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']), // Set to true if using HTTPS
    'cookie_samesite' => 'Lax', // Protects against CSRF
    'use_strict_mode' => true,
]);

// Set headers for JSON response and error reporting (development)
header('Content-Type: application/json');
error_reporting(E_ALL); // Report all errors during development
ini_set('display_errors', 0); // Turn off error display in production
ini_set('log_errors', 1); // Log errors instead

// --- Database Configuration ---
define('DB_HOST', 'localhost'); // Or '127.0.0.1'
define('DB_USER', 'root');      // Your MySQL username
define('DB_PASS', '');          // Your MySQL password (often empty for local XAMPP/MAMP)
define('DB_NAME', 'duel_db');     // Your database name

// --- Establish Database Connection ---
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500); // Internal Server Error
    error_log("DB Connect Error: " . $conn->connect_error); // Log the error
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}
$conn->set_charset("utf8mb4");

// --- Determine Action ---
// Actions modifying data should use POST. Getting data can use GET.
$action = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
}

// --- Action Handler ---
try {
    switch ($action) {
        // --- Authentication Actions ---
        case 'register':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') { invalid_request(); }
            handle_register($conn);
            break;
        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') { invalid_request(); }
            handle_login($conn);
            break;
        case 'logout':
             if ($_SERVER['REQUEST_METHOD'] !== 'POST') { invalid_request(); } // Use POST for logout too
            handle_logout();
            break;
        case 'check_auth': // Action for JS to check if user is logged in
            handle_check_auth();
            break;

        // --- Task Actions (Protected) ---
        case 'get_tasks_by_date':
            require_auth(); // Check authentication first
            handle_get_tasks_by_date($conn);
            break;
        case 'add_task':
            require_auth();
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') { invalid_request(); }
            handle_add_task($conn);
            break;
        case 'update_task': // Handles completion toggle
            require_auth();
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') { invalid_request(); }
            handle_update_task($conn);
            break;
        case 'delete_task':
            require_auth();
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') { invalid_request(); }
            handle_delete_task($conn);
            break;

        default:
            http_response_code(400); // Bad Request
            echo json_encode(['success' => false, 'error' => 'Invalid or missing action']);
            break;
    }
} catch (Exception $e) {
    // Generic exception handler
    http_response_code(500);
    // Log the detailed error in production instead of echoing it
    error_log("Unhandled exception in index.php: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    echo json_encode(['success' => false, 'error' => 'An unexpected server error occurred.']);
} finally {
    // Ensure connection is always closed if it was opened
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
exit(); // Ensure script stops cleanly

// --- Authentication Helper ---
function is_logged_in() {
    // Basic check, consider more robust checks (e.g., session timeout) in production
    return isset($_SESSION['user_id']);
}

function require_auth() {
    if (!is_logged_in()) {
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'error' => 'Authentication required.']);
        exit();
    }
    // Optional: Could add session timeout check here
}

// --- Authentication Action Functions ---
function handle_register($conn) {
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : ''; // Plain text from form

    // Input Validation
    if (empty($username) || empty($password)) bad_request('Username e password sono obbligatori.');
    if (strlen($password) < 6) bad_request('La password deve essere lunga almeno 6 caratteri.');
    if (strlen($username) > 50) bad_request('Username troppo lungo (max 50 caratteri).');
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) bad_request('Username può contenere solo lettere, numeri e underscore (_).');

    // Check if username already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    if (!$stmt) { prepare_error($conn, "Checking username"); return; }
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) { conflict('Username già esistente.'); $stmt->close(); return; }
    $stmt->close();

    // Hash the password securely
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    if ($password_hash === false) server_error('Errore durante la creazione dell\'hash della password.');

    // Insert the new user
    $stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
     if (!$stmt) { prepare_error($conn, "Inserting user"); return; }
    $stmt->bind_param("ss", $username, $password_hash);
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(['success' => true, 'message' => 'Registrazione completata con successo.']);
    } else { server_error('Errore durante la registrazione: ' . $stmt->error); }
    $stmt->close();
}

function handle_login($conn) {
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    if (empty($username) || empty($password)) bad_request('Username e password sono obbligatori.');

    // Find user by username
    $stmt = $conn->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
    if (!$stmt) { prepare_error($conn, "Finding user for login"); return; }
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        // Verify password against the stored hash
        if (password_verify($password, $user['password_hash'])) {
            // Regenerate session ID upon login for security
            session_regenerate_id(true);
            // Store user info in session
            $_SESSION['user_id'] = $user['id']; $_SESSION['username'] = $user['username'];
            echo json_encode(['success' => true, 'message' => 'Login successful.', 'user' => ['id' => $user['id'], 'username' => $user['username']]]);
        } else { unauthorized('Username o password non validi.'); } // Invalid password
    } else { unauthorized('Username o password non validi.'); } // User not found
    $stmt->close();
}

function handle_logout() {
    // Unset all session variables
    $_SESSION = array();
    // Delete the session cookie if it exists
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
    }
    // Destroy the session data on the server
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logout successful.']);
}

function handle_check_auth() {
    if (is_logged_in()) {
        echo json_encode(['success' => true, 'user' => ['id' => $_SESSION['user_id'], 'username' => $_SESSION['username'] ?? 'Utente']]);
    } else { echo json_encode(['success' => false]); } // No error, just not logged in
}

// --- Task Action Functions (User-Specific) ---
function handle_get_tasks_by_date($conn) {
    $user_id = $_SESSION['user_id']; // Assumes require_auth() was called
    $date_str = isset($_GET['date']) ? $_GET['date'] : '';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_str)) bad_request('Formato data non valido.');

    $sql = "SELECT id, text, completed, task_date FROM tasks WHERE user_id = ? AND task_date = ? ORDER BY created_at ASC";
    $stmt = $conn->prepare($sql);
    if (!$stmt) { prepare_error($conn, "Getting tasks"); return; }
    $stmt->bind_param("is", $user_id, $date_str);

    if ($stmt->execute()) {
        $result = $stmt->get_result(); $tasks = [];
        while ($row = $result->fetch_assoc()) { $row['completed'] = (bool)$row['completed']; $tasks[] = $row; }
        echo json_encode(['success' => true, 'data' => $tasks]);
    } else { server_error('Errore recupero task: ' . $stmt->error); }
    $stmt->close();
}

function handle_add_task($conn) {
    $user_id = $_SESSION['user_id'];
    $task_text = isset($_POST['task_text']) ? trim($_POST['task_text']) : '';
    $task_date_str = isset($_POST['task_date']) ? $_POST['task_date'] : '';
    if (empty($task_text) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $task_date_str)) bad_request('Testo e data validi richiesti.');

    $stmt = $conn->prepare("INSERT INTO tasks (user_id, text, task_date) VALUES (?, ?, ?)");
    if (!$stmt) { prepare_error($conn, "Adding task"); return; }
    $stmt->bind_param("iss", $user_id, $task_text, $task_date_str);

    if ($stmt->execute()) {
        $new_task_id = $stmt->insert_id;
        // Fetch the newly created task to send back to the client
        $fetchStmt = $conn->prepare("SELECT id, user_id, text, completed, task_date FROM tasks WHERE id = ? AND user_id = ?");
        if ($fetchStmt) {
             $fetchStmt->bind_param("ii", $new_task_id, $user_id); $fetchStmt->execute(); $result = $fetchStmt->get_result();
             if ($result->num_rows === 1) {
                 $newTask = $result->fetch_assoc(); $newTask['completed'] = (bool)$newTask['completed'];
                 http_response_code(201); echo json_encode(['success' => true, 'data' => $newTask]);
             } else { server_error('Impossibile recuperare nuova task dopo inserimento.'); }
             $fetchStmt->close();
        } else { http_response_code(201); echo json_encode(['success' => true, 'message' => 'Task aggiunto (dettagli non recuperati).']); } // Fallback
    } else { server_error('Errore aggiunta task: ' . $stmt->error); }
    $stmt->close();
}

function handle_update_task($conn) { // Toggle completion
    $user_id = $_SESSION['user_id'];
    $task_id = isset($_POST['task_id']) ? (int)$_POST['task_id'] : 0;
    $completed_str = isset($_POST['completed']) ? $_POST['completed'] : null;
    $completed = filter_var($completed_str, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE); // Strict boolean check
    if ($task_id <= 0 || $completed === null) bad_request('ID task o stato completato non valido.');
    $completed_int = (int)$completed; // Convert boolean to 0 or 1

    $stmt = $conn->prepare("UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?"); // Ensure user owns task
    if (!$stmt) { prepare_error($conn, "Updating task"); return; }
    $stmt->bind_param("iii", $completed_int, $task_id, $user_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) { echo json_encode(['success' => true]); } // Update successful
        else { // Check if task exists for user but status was already set, or task doesn't exist/belong to user
             $checkStmt = $conn->prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?");
             if ($checkStmt) { $checkStmt->bind_param("ii", $task_id, $user_id); $checkStmt->execute();
                 if ($checkStmt->get_result()->num_rows > 0) echo json_encode(['success' => true, 'message' => 'Stato invariato']); // Task exists, status was same
                 else not_found('Task non trovato o non appartiene all\'utente.'); $checkStmt->close();
             } else { not_found('Task non trovato o non appartiene all\'utente.'); } }
    } else { server_error('Errore aggiornamento task: ' . $stmt->error); }
    $stmt->close();
}

function handle_delete_task($conn) {
    $user_id = $_SESSION['user_id'];
    $task_id = isset($_POST['task_id']) ? (int)$_POST['task_id'] : 0;
    if ($task_id <= 0) bad_request('ID task non valido.');

    $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?"); // Ensure user owns task
    if (!$stmt) { prepare_error($conn, "Deleting task"); return; }
    $stmt->bind_param("ii", $task_id, $user_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) echo json_encode(['success' => true]); // Delete successful
        else not_found('Task non trovato o non appartiene all\'utente.'); // Task didn't exist or wasn't user's
    } else { server_error('Errore eliminazione task: ' . $stmt->error); }
    $stmt->close();
}

// --- Helper Functions for Responses ---
function invalid_request() { http_response_code(405); echo json_encode(['success' => false, 'error' => 'Metodo richiesta non valido']); exit(); }
function prepare_error($conn, $context = "Database prepare") { http_response_code(500); error_log("$context Error: " . $conn->error); echo json_encode(['success' => false, 'error' => 'Errore interno del server (DB Prepare).']); exit(); }
function bad_request($message) { http_response_code(400); echo json_encode(['success' => false, 'error' => $message]); exit(); }
function unauthorized($message) { http_response_code(401); echo json_encode(['success' => false, 'error' => $message]); exit(); }
function not_found($message) { http_response_code(404); echo json_encode(['success' => false, 'error' => $message]); exit(); }
function conflict($message) { http_response_code(409); echo json_encode(['success' => false, 'error' => $message]); exit(); }
function server_error($message) { http_response_code(500); error_log("Server Error: " . $message); echo json_encode(['success' => false, 'error' => 'Errore interno del server.']); exit(); }
?>