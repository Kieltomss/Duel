document.addEventListener('DOMContentLoaded', function() {

    // --- Element Selectors (Common for app.html) ---
    const loadingStateDiv = document.getElementById('loading-state');
    const unauthDiv = document.getElementById('unauth-state');
    const mainContentDiv = document.getElementById('main-content');
    const welcomeMessageSpan = document.getElementById('welcome-message');
    const welcomeMessageSpanSm = document.getElementById('welcome-message-sm');
    const logoutButton = document.getElementById('logout-button');
    const API_ENDPOINT = 'index.php'; // PHP handler
    const animeAvailable = typeof anime === 'function'; // Check if Anime.js is loaded

    // --- Authentication Check ---
    // This is the main entry point for app.html's functionality
    async function checkAuthentication() {
        if (!loadingStateDiv || !mainContentDiv || !unauthDiv) { console.error("Auth display elements not found."); document.body.innerHTML = '<div class="alert alert-danger m-5">Errore UI.</div>'; return; }
        loadingStateDiv.style.display = 'block'; mainContentDiv.style.display = 'none'; unauthDiv.style.display = 'none';
        try {
            const response = await fetch(`${API_ENDPOINT}?action=check_auth`, { method: 'GET', headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }});
            const contentType = response.headers.get("content-type");
            if (!response.ok || !contentType || !contentType.includes("application/json")) { let errorDetail = `Status: ${response.status}`; try { const textResponse = await response.text(); console.error("Server response:", textResponse); errorDetail += `, Resp: ${textResponse.substring(0, 100)}`; } catch(e) {} throw new Error(`Risposta non valida (${errorDetail}).`); }
            const result = await response.json();
            if (result.success && result.user) {
                loadingStateDiv.style.display = 'none'; mainContentDiv.style.display = 'block';
                const welcomeText = `Benvenuto, ${escapeHTML(result.user.username)}!`;
                if (welcomeMessageSpan) welcomeMessageSpan.textContent = welcomeText;
                if (welcomeMessageSpanSm) welcomeMessageSpanSm.textContent = welcomeText;
                initializeApp(); // START MAIN APP logic
            } else { throw new Error(result.error || 'Not authenticated'); }
        } catch (error) { console.warn("Auth check failed:", error.message); loadingStateDiv.style.display = 'none'; unauthDiv.style.display = 'block'; }
    }

    // --- Logout ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
             logoutButton.disabled = true; logoutButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Uscita...`;
             try { const response = await fetch(API_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({ 'action': 'logout' }) }); const contentType = response.headers.get("content-type"); if (!response.ok || !contentType || !contentType.includes("application/json")) { let errorDetail = `Status: ${response.status}`; try{ const text = await response.text(); errorDetail += `, Resp: ${text.substring(0,100)}`; } catch(e){} throw new Error(`Risposta logout non valida (${errorDetail}).`); } const result = await response.json(); if (result.success) { window.location.href = 'login.html'; } else { throw new Error(result.error || 'Errore logout'); }
             } catch (error) { console.error('Logout error:', error); alert('Errore logout: ' + error.message); logoutButton.disabled = false; logoutButton.textContent = 'Logout'; }
        });
    } else { if (document.getElementById('main-content')) console.warn("Logout button not found."); }

    // --- Initialize the main application AFTER checking auth ---
    function initializeApp() {
        // --- Get Calendar and Task Elements ---
        const monthYearElement = document.getElementById('month-year'); const calendarGridElement = document.getElementById('calendar-grid'); const prevMonthButton = document.getElementById('prev-month'); const nextMonthButton = document.getElementById('next-month'); const selectedDateDisplay = document.getElementById('selected-date-display'); const taskForm = document.getElementById('add-task-form'); const taskInput = document.getElementById('task-input'); const taskDateInput = document.getElementById('task-date-input'); const taskListElement = document.getElementById('task-list'); const noTasksMessage = document.getElementById('no-tasks-message'); const addTaskBtn = document.getElementById('add-task-btn');
        if (!monthYearElement || !calendarGridElement || !taskListElement || !taskForm || !prevMonthButton || !nextMonthButton || !selectedDateDisplay || !taskInput || !taskDateInput || !noTasksMessage || !addTaskBtn) { console.error("Elementi UI calendario/task mancanti."); if(mainContentDiv) mainContentDiv.innerHTML = '<div class="alert alert-danger m-5">Errore UI Calendario.</div>'; return; }

        let currentDateState = new Date(); let selectedDateStr = null; let tasksForSelectedDateCache = [];

        // --- Calendar Functions ---
        function renderCalendar(year, month) { const headers = calendarGridElement.querySelectorAll('.calendar-header'); calendarGridElement.innerHTML = ''; headers.forEach(header => calendarGridElement.appendChild(header.cloneNode(true))); const firstDayOfMonth = new Date(year, month, 1); const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDayWeekday = firstDayOfMonth.getDay(); monthYearElement.textContent = firstDayOfMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); for (let i = 0; i < firstDayWeekday; i++) calendarGridElement.insertAdjacentHTML('beforeend', '<div class="calendar-day other-month"></div>'); const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; for (let day = 1; day <= daysInMonth; day++) { const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const dayCell = document.createElement('div'); dayCell.className = 'calendar-day'; dayCell.dataset.date = dayStr; dayCell.innerHTML = `<span class="day-number">${day}</span>`; if (dayStr === todayStr) dayCell.classList.add('today'); if (dayStr === selectedDateStr) dayCell.classList.add('selected'); dayCell.addEventListener('click', () => handleDayClick(dayStr, dayCell)); calendarGridElement.appendChild(dayCell); } const totalCells = firstDayWeekday + daysInMonth; const remainingCells = (7 - (totalCells % 7)) % 7; for (let i = 0; i < remainingCells; i++) calendarGridElement.insertAdjacentHTML('beforeend', '<div class="calendar-day other-month"></div>'); }
        function handleDayClick(dateStr, clickedCell) { selectedDateStr = dateStr; calendarGridElement.querySelectorAll('.calendar-day.selected').forEach(c => c.classList.remove('selected')); if (clickedCell) clickedCell.classList.add('selected'); else { const cellToSelect = calendarGridElement.querySelector(`.calendar-day[data-date="${dateStr}"]`); if (cellToSelect) cellToSelect.classList.add('selected'); } const dateObj = new Date(dateStr + 'T00:00:00'); selectedDateDisplay.textContent = `Attività: ${dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}`; taskDateInput.value = dateStr; addTaskBtn.disabled = false; taskInput.placeholder = `Nuova attività per oggi...`; taskForm.classList.remove('was-validated'); fetchTasksForDate(dateStr); }

        // --- Task Functions ---
        async function fetchTasksForDate(dateStr) { taskListElement.innerHTML = '<li class="list-group-item text-center text-muted small p-2">Caricamento...</li>'; noTasksMessage.style.display = 'none'; tasksForSelectedDateCache = []; if (!dateStr) { taskListElement.innerHTML = ''; return; } try { const response = await fetch(`${API_ENDPOINT}?action=get_tasks_by_date&date=${dateStr}`); if (!response.ok) { if (response.status === 401) { window.location.href = 'login.html'; return; } const errData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` })); throw new Error(errData.error || `HTTP error ${response.status}`); } const result = await response.json(); if (result.success) { tasksForSelectedDateCache = result.data || []; renderTasksForSelectedDate(); } else { throw new Error(result.error || 'Errore caricamento task'); } } catch (error) { console.error("Fetch tasks error:", error); taskListElement.innerHTML = `<li class="list-group-item text-danger text-center small p-2">Errore: ${error.message}.</li>`; noTasksMessage.style.display = 'none'; } }
        function renderTasksForSelectedDate() { taskListElement.innerHTML = ''; if (tasksForSelectedDateCache.length === 0) { noTasksMessage.textContent = "Nessuna attività per questa data."; noTasksMessage.style.display = 'block'; } else { noTasksMessage.style.display = 'none'; tasksForSelectedDateCache.sort((a, b) => a.completed - b.completed); tasksForSelectedDateCache.forEach(task => { const li = document.createElement('li'); li.className = `list-group-item d-flex justify-content-between align-items-center task-item p-2 ${task.completed ? 'completed' : ''}`; li.dataset.id = task.id; const checkboxId = `task-${task.id}`; li.innerHTML = `<div class="form-check flex-grow-1 me-2" style="min-width: 0;"><input class="form-check-input task-checkbox" type="checkbox" value="" id="${checkboxId}" ${task.completed ? 'checked' : ''} aria-labelledby="label-${checkboxId}"><label class="form-check-label task-label" id="label-${checkboxId}" for="${checkboxId}" title="${escapeHTML(task.text)}">${escapeHTML(task.text)}</label></div><button class="btn btn-sm delete-btn flex-shrink-0 p-0" aria-label="Elimina">×</button>`; taskListElement.appendChild(li); }); } }

         // --- Task Form and List Event Listeners ---
        taskForm.addEventListener('submit', async (e) => { e.preventDefault(); if (!taskForm.checkValidity() || !selectedDateStr) { e.stopPropagation(); taskForm.classList.add('was-validated'); if(!selectedDateStr) alert("Seleziona data."); return; } const taskText = taskInput.value.trim(); addTaskBtn.disabled = true; taskInput.disabled = true; addTaskBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`; try { const formData = new URLSearchParams({ action: 'add_task', task_text: taskText, task_date: selectedDateStr }); const response = await fetch(API_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData }); if (!response.ok) { const errData = await response.json().catch(()=>({})); if(response.status === 401) window.location.href='login.html'; throw new Error(errData.error || `HTTP ${response.status}`); } const result = await response.json(); if (result.success && result.data) { tasksForSelectedDateCache.push(result.data); taskInput.value = ''; renderTasksForSelectedDate(); taskForm.classList.remove('was-validated'); const newItem = taskListElement.querySelector(`li[data-id="${result.data.id}"]`); if (newItem && animeAvailable) anime({ targets: newItem, opacity: [0, 1], scale: [0.9, 1], duration: 300, easing: 'easeOutQuad' }); } else { throw new Error(result.error || 'Errore aggiunta'); } } catch (error) { console.error("Add task error:", error); alert("Errore: " + error.message); taskForm.classList.add('was-validated'); } finally { addTaskBtn.disabled = !selectedDateStr; taskInput.disabled = false; addTaskBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/></svg>`; } }); // Restored icon only
        taskListElement.addEventListener('click', async (e) => { const taskItem = e.target.closest('li.task-item'); if (!taskItem || !taskItem.dataset.id) return; const taskId = taskItem.dataset.id; const taskIndex = tasksForSelectedDateCache.findIndex(t => t.id.toString() === taskId); if (e.target.classList.contains('delete-btn')) { const deleteButton = e.target; deleteButton.disabled = true; const animationProps = { targets: taskItem, opacity: 0, scale: 0.8, duration: 250, easing: 'easeInQuad', complete: async () => { taskItem.remove(); try { const formData = new URLSearchParams({ action: 'delete_task', task_id: taskId }); const response = await fetch(API_ENDPOINT, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: formData }); if (!response.ok) { const errData = await response.json().catch(()=>({})); if(response.status === 401) window.location.href='login.html'; throw new Error(errData.error || `HTTP ${response.status}`); } const result = await response.json(); if (result.success) { tasksForSelectedDateCache = tasksForSelectedDateCache.filter(t => t.id.toString() !== taskId); renderTasksForSelectedDate(); } else { throw new Error(result.error || 'Errore eliminazione'); } } catch (error) { alert("Errore eliminazione: " + error.message); console.error("Delete fetch error:", error); if (selectedDateStr) fetchTasksForDate(selectedDateStr); } } }; if (animeAvailable) anime(animationProps); else animationProps.complete(); } else if (e.target.classList.contains('task-checkbox') || e.target.classList.contains('task-label')) { if (taskIndex === -1) return; const currentTask = tasksForSelectedDateCache[taskIndex]; const newCompletedStatus = !currentTask.completed; taskItem.classList.toggle('completed', newCompletedStatus); const checkbox = taskItem.querySelector('input.task-checkbox'); if (checkbox) checkbox.checked = newCompletedStatus; try { const formData = new URLSearchParams({ action: 'update_task', task_id: taskId, completed: newCompletedStatus ? 'true' : 'false' }); const response = await fetch(API_ENDPOINT, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: formData }); if (!response.ok) { const errData = await response.json().catch(()=>({})); if(response.status === 401) window.location.href='login.html'; throw new Error(errData.error || `HTTP ${response.status}`); } const result = await response.json(); if (result.success) tasksForSelectedDateCache[taskIndex].completed = newCompletedStatus; else { throw new Error(result.error || 'Errore aggiornamento'); } } catch(error) { alert("Errore aggiornamento: " + error.message); taskItem.classList.toggle('completed', currentTask.completed); if (checkbox) checkbox.checked = currentTask.completed; console.error("Update fetch error:", error); } } });

         // --- Calendar Navigation ---
        prevMonthButton.addEventListener('click', () => { currentDateState.setMonth(currentDateState.getMonth() - 1); renderCalendar(currentDateState.getFullYear(), currentDateState.getMonth()); selectedDateStr = null; tasksForSelectedDateCache = []; renderTasksForSelectedDate(); selectedDateDisplay.textContent = "Attività per: --"; addTaskBtn.disabled = true; });
        nextMonthButton.addEventListener('click', () => { currentDateState.setMonth(currentDateState.getMonth() + 1); renderCalendar(currentDateState.getFullYear(), currentDateState.getMonth()); selectedDateStr = null; tasksForSelectedDateCache = []; renderTasksForSelectedDate(); selectedDateDisplay.textContent = "Attività per: --"; addTaskBtn.disabled = true; });

        // --- Initial Load ---
        renderCalendar(currentDateState.getFullYear(), currentDateState.getMonth());
        const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
         setTimeout(() => { handleDayClick(todayStr, null); }, 50); // Select today

    } // End of initializeApp

    // --- Corrected Helper to escape HTML ---
    function escapeHTML(str) {
        if (str === null || typeof str === 'undefined') return '';
        const strVal = String(str);
        const map = { '&': '&', '<': '<', '>': '>', '"': '"', "'":  "'"};
        return strVal.replace(/[&<>"']/g, m => map[m]);
    }

    // --- START THE AUTH CHECK ---
    checkAuthentication(); // This determines if initializeApp runs

}); // End DOMContentLoaded