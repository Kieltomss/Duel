
# 📅 Duel - Calendario Attività Personale

Duel è un'applicazione web progettata per aiutare gli utenti a organizzare le proprie attività quotidiane attraverso un'interfaccia intuitiva basata su calendario. Permette la registrazione e il login degli utenti, la gestione di task giornalieri personali e offre un'esperienza visiva arricchita da effetti grafici animati.

## ✨ Funzionalità Principali

*   **Pagina di Benvenuto Pubblica:** Una landing page accattivante che introduce l'applicazione e i creatori.
*   **Autenticazione Utente:**
    *   Registrazione sicura di nuovi utenti (con hashing delle password).
    *   Login per utenti esistenti.
    *   Gestione delle sessioni PHP per proteggere l'accesso all'applicazione principale.
    *   Pulsante di Logout.
*   **Applicazione Calendario Protetta (`app.html`):**
    *   Accessibile solo dopo il login.
    *   Visualizzazione del calendario mensile navigabile (mese precedente/successivo).
    *   Evidenziazione del giorno corrente.
    *   Selezione di una data specifica per visualizzare/aggiungere task.
*   **Gestione Attività Giornaliere (per utente):**
    *   Aggiunta di nuove attività per la data selezionata.
    *   Visualizzazione delle attività per la data selezionata.
    *   Contrassegno delle attività come completate/da completare (toggle).
    *   Eliminazione di attività.
*   **Obiettivi Predefiniti:** Una sezione statica che mostra esempi di obiettivi giornalieri.
*   **Grafica Dinamica:** Utilizzo della libreria `tsParticles` per creare sfondi animati interattivi su tutte le pagine (welcome, auth, app).
*   **Design Responsive:** Interfaccia adattabile a diverse dimensioni di schermo grazie a Bootstrap 5.

## 🚀 Tecnologie Utilizzate

*   **Frontend:**
    *   HTML5
    *   CSS3 (con [Bootstrap 5](https://getbootstrap.com/) per layout e componenti)
    *   JavaScript (Vanilla JS per logica UI, Fetch API per chiamate backend)
    *   [tsParticles](https://particles.js.org/) (per sfondi animati)
    *   [Anime.js](https://animejs.com/) (Opzionale, per animazioni UI aggiuntive - inclusa ma usata minimamente nell'ultima versione)
*   **Backend:**
    *   PHP (>= 7.4 raccomandato, con gestione sessioni)
*   **Database:**
    *   MySQL / MariaDB
*   **Server:**
    *   Server web con supporto PHP e MySQL (es. Apache, Nginx)
    *   Tipicamente fornito da stack come XAMPP, MAMP, WAMP, LAMP, LEMP.

## ⚙️ Prerequisiti

Prima di iniziare, assicurati di avere installato:

1.  Un **server web locale** che supporti PHP e MySQL (es. [XAMPP](https://www.apachefriends.org/), [MAMP](https://www.mamp.info/), WAMP, Docker con stack LAMP/LEMP).
2.  Un **database server MySQL/MariaDB** in esecuzione.
3.  Un client per database come [phpMyAdmin](https://www.phpmyadmin.net/) (spesso incluso con XAMPP/MAMP) o un altro strumento (DBeaver, MySQL Workbench) per importare lo schema SQL.
4.  Un **browser web** moderno (Chrome, Firefox, Edge, Safari).
5.  [Git](https://git-scm.com/) (Opzionale, per clonare il repository).

## 🛠️ Installazione e Configurazione

1.  **Clona o Scarica il Repository:**
    ```bash
    git clone <url_del_tuo_repository> duel-app
    # Oppure scarica lo ZIP ed estrailo in una cartella chiamata 'duel-app'
    cd duel-app
    ```

2.  **Posiziona la Cartella del Progetto:**
    Sposta l'intera cartella `duel-app` nella directory radice del tuo server web locale (es. `htdocs` per XAMPP/MAMP, `www` per WAMP).

3.  **Configura il Database:**
    *   Avvia il tuo server MySQL.
    *   Accedi al tuo client di database (es. phpMyAdmin all'indirizzo `http://localhost/phpmyadmin`).
    *   Crea un nuovo database chiamato `duel_db` (o un nome a tua scelta, ma dovrai aggiornare `index.php`). Assicurati che la codifica sia `utf8mb4_unicode_ci`.
    *   Seleziona il database `duel_db` appena creato.
    *   Importa lo schema SQL contenuto nel file `duel_db.sql` fornito nel progetto. Questo creerà le tabelle `users` e `tasks`.

4.  **Configura la Connessione PHP:**
    *   Apri il file `index.php` nella cartella principale del progetto (`duel-app/index.php`).
    *   Trova le costanti di configurazione del database vicino all'inizio del file:
      ```php
      define('DB_HOST', 'localhost');
      define('DB_USER', 'root');      // Modifica se il tuo username è diverso
      define('DB_PASS', '');          // Modifica se hai impostato una password
      define('DB_NAME', 'duel_db');     // Modifica se hai usato un nome diverso
      ```
    *   Aggiorna `DB_USER` e `DB_PASS` (e `DB_NAME` se necessario) per corrispondere alle credenziali del tuo database MySQL locale.

## ▶️ Esecuzione dell'Applicazione

1.  **Avvia il Server Web:** Assicurati che i moduli Apache e MySQL siano avviati dal pannello di controllo del tuo server locale (XAMPP Control Panel, MAMP, ecc.).
2.  **Accedi nel Browser:** Apri il tuo browser web e naviga all'URL corrispondente alla cartella del progetto sul tuo server locale. Tipicamente sarà:
    *   `http://localhost/duel-app/`
    *   Oppure `http://127.0.0.1/duel-app/`

    Questo ti porterà alla pagina di benvenuto (`index.html`, ex `welcome.html`). Da lì potrai navigare verso le pagine di login o registrazione. Dopo un login/registrazione corretta, verrai reindirizzato alla pagina principale dell'applicazione (`app.html`).

## 📁 Struttura del Progetto
duel-app/
├── welcome.html # DEPRECATED - Sostituito da index.html
├── login.html # Pagina di Login
├── register.html # Pagina di Registrazione
├── index.html # NUOVA Pagina di Benvenuto/Landing (ex welcome.html)
├── app.html # NUOVA Pagina Principale Calendario (ex index.html, protetta)
├── index.php # Backend unificato (API, Auth, DB Logic)
├── duel_db.sql # Schema del Database (per setup)
├── css/
│ └── style.css # Stili CSS comuni e specifici
└── js/
└── script.js # Logica JavaScript per app.html (Auth Check, Calendar, Tasks)
*(Nota: Lo script JS in `login.html` e `register.html` è inline per semplicità, ma potrebbe essere spostato in un file `auth.js` separato).*

## 👥 Team / Creatori

*   Kieltom David Marasigan (Project Manager)
*   Halim Daniel (System Analyst)
*   Gabriele Alessandra (Software Architect)
*   Idris Ouadah (Quality Assurance)

## 🔮 Possibili Miglioramenti Futuri

*   Modifica del testo delle attività esistenti.
*   Implementazione Drag & Drop per spostare attività tra giorni.
*   Notifiche reali (via browser o email) per le scadenze.
*   Filtri avanzati per le attività (es. per stato, priorità).
*   Statistiche sulla produttività o sul completamento degli obiettivi.
*   Implementazione di API backend più robuste (es. stile RESTful).
*   Aggiunta di test unitari e di integrazione.
*   Miglioramento della gestione degli errori e feedback all'utente.
*   Internazionalizzazione (supporto multilingua).

---