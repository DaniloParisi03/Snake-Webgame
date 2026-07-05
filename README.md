# Snake Game Web Application

**Course Project for Web Programming (Programmazione Web)**  
**University of Pisa — Academic Years 2023-2024**  
**Author:** Danilo Parisi

---

A full-stack, web-based implementation of the classic **Snake Game**, featuring user authentication, session management, real-time gameplay rendering on HTML5 Canvas, and persistent personal high-score tracking via PHP and MySQL. This project was developed as part of the curriculum for the Web Programming course at the University of Pisa (2023-2024).

---

## Overview

This project is a modular web application developed using **HTML5**, **CSS3**, **JavaScript (ES6 Modules & jQuery)**, and **PHP/MySQL**. Players can create an account, log in securely, play the classic arcade game Snake, track their elapsed game time with a built-in stopwatch, and compete against their own personal high scores stored in a MySQL database.

---

## Key Features

- **User Authentication & Security:**
  - **Registration (`signup.html`):** Client-side regular expression validation for secure passwords (minimum 8 characters, including uppercase, lowercase, numbers, and symbols) and valid email formats.
  - **Login (`login.html`):** Verified against MySQL database credentials with real-time error feedback and password visibility toggle.
  - **Session Protection:** PHP sessions (`$_SESSION`) prevent unauthorized access to gameplay and score posting endpoints.

- **Classic & Responsive Gameplay:**
  - **HTML5 Canvas Rendering:** Smooth grid-based movement (15x15 cell matrix on a 600x600px canvas) with sprite-based graphics for snake head, body segments, turns, tail, and apples.
  - **Dynamic Difficulty:** Snake movement speed increases progressively as apples are consumed.
  - **Anti-Self-Collision Logic:** Prevents accidental 180-degree immediate direction reversals.
  - **Stopwatch & Controls:** Real-time elapsed timer (`00:00:00`), Pause/Resume functionality, and instant game restart.

- **Real-Time High Score Tracking:**
  - Checks current score against the player's stored best score in real-time.
  - Highlights new records visually with custom animations and persists them asynchronously via jQuery AJAX to MySQL.

- **Integrated Documentation:**
  - Built-in documentation and rules page accessible directly from the application (`html/index.html`).

---

## Project Structure & Architecture

```text
├── database/
│   └── logindata.sql       # MySQL schema and initial setup for 'logindata' DB & 'users' table
├── php/
│   ├── login_session.php   # Authenticates user credentials and initializes PHP session
│   ├── signup_session.php  # Registers new users and starts session
│   ├── player_session.php  # Returns current session user data (username & best score)
│   ├── session_status.php  # Checks if a session is currently active
│   ├── update_score.php    # Updates player's high score in the database if exceeded
│   └── close_session.php   # Destroys active session and logs user out
├── js/
│   ├── game_code.js        # Main game loop, rendering, keyboard controls, and state management
│   ├── player.js           # OOP classes: SnakeNode, Snake (body matrix), and Apple
│   ├── timer_code.js       # Stopwatch logic (hours, minutes, seconds formatting & rollover)
│   ├── get_score.js        # AJAX communication for session verification and score updates
│   ├── login_code.js       # Login form validation, password toggle, and AJAX submission
│   ├── signup_code.js      # Registration form validation and AJAX submission
│   └── home_code.js        # Home page event listeners and logout handling
├── html/
│   ├── home.html           # Main dashboard after login
│   ├── game.html           # Game canvas, score display, stopwatch, and control buttons
│   ├── login.html          # User login portal
│   ├── signup.html         # New user registration portal
│   └── index.html          # Game rules and project documentation
├── css/
│   ├── game_style.css      # Grid layout and styling for game interface and canvas overlays
│   ├── home_style.css      # Styling for dashboard and navigation buttons
│   ├── login_style.css     # Glassmorphism styling for login portal
│   ├── signup_style.css    # Styling for registration portal
│   └── index_style.css     # Responsive documentation styling
├── images/                 # Game sprites (snake parts, apples, background textures)
│   └── background.png      # Background image used across all pages
└── fonts/
    └── gameFont.ttf        # Custom retro arcade typography used across the interface
```

---

## Installation & Setup Guide

### Prerequisites
- **Web Server:** Apache (via XAMPP, WAMP, LAMP, or MAMP)
- **PHP:** Version 5.7 or higher (PHP 7.x / 8.x recommended)
- **Database:** MySQL / MariaDB

### Step 1: Clone or Place Project
Place the project folder (`parisi_665364`) inside your web server's document root directory:
- **XAMPP (Windows):** `C:\xampp\htdocs\parisi_665364\`
- **WAMP (Windows):** `C:\wamp64\www\parisi_665364\`
- **Linux/macOS:** `/var/www/html/parisi_665364/`

### Step 2: Database Configuration
1. Start your **Apache** and **MySQL** modules in your control panel (e.g., XAMPP Control Panel).
2. Open **phpMyAdmin** (`http://localhost/phpmyadmin/`) or your preferred MySQL client.
3. Import the SQL file located at `database/logindata.sql`:
   - This will automatically create the database named `logindata` and the `users` table with schema:
     ```sql
     CREATE TABLE `users` (
       `username` varchar(30) NOT NULL PRIMARY KEY,
       `email` varchar(30) NOT NULL,
       `password` varchar(30) NOT NULL,
       `score` int(11) NOT NULL DEFAULT '0'
     ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
     ```
4. **Note on Database Credentials:** By default, the PHP scripts connect using `host = "localhost"`, `user = "root"`, and `password = ""`. If your MySQL setup requires a password or different user, update the `mysqli_connect` parameters across the files in `php/`.

### Step 3: Launch Application
Open your web browser and navigate to:
```text
http://localhost/parisi_665364/html/home.html
```
*(If unauthenticated, you will be automatically redirected to `login.html`.)*

---

## How to Play

1. **Sign Up / Log In:** Create a new account or log in with existing credentials.
2. **Start Game:** Click **Start Game** from the dashboard to enter the arena.
3. **Controls:**
   - **Up Arrow:** Move Up
   - **Down Arrow:** Move Down
   - **Left Arrow:** Move Left
   - **Right Arrow:** Move Right
4. **Objectives:**
   - Eat apples to grow longer and increase your score.
   - Avoid colliding with the perimeter walls or biting your own tail!
   - Use the **Pause** button to temporarily halt the game and timer.
   - Click **Restart** to reset the arena and timer immediately.

---

## Refactoring, Translation & Quality Notes

As part of a comprehensive software engineering review and refactoring effort, this project underwent significant enhancements:
- **Full Translation (Italian to English):** All variable names, function names, classes, UI text, and internal comments were translated into clean English while preserving the original code architecture and naming conventions (e.g., translating `CalcolaValore` to `CalculateValue` or `processo_profiling` to `profiling_process`).
- **Doxygen Documentation:** Standardized Doxygen comment headers (`@file`, `@brief`, `@param`, `@return`, `@class`) were added across all PHP scripts and JavaScript modules to ensure clarity and maintainability.
- **Bug Fixes:**
  - Resolved a timer rollover bug in `js/timer_code.js` where seconds exceeding 59 caused incorrect minute/hour calculations due to unhandled modulo arithmetic.
  - Fixed a syntax comment block bug in `js/game_code.js` where core collision and scoring methods (`touchApple` and `updateScore`) were inadvertently commented out.
- **UI/CSS Standardization:** Created missing stylesheet links (`css/index_style.css`) and corrected HTML/CSS class selector typos (`registazione` -> `registration`).

---

## License
This project is developed by Danilo Parisi for the Web Programming course at the University of Pisa (Academic Years 2023-2024).
