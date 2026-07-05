<?php
/**
 * @file signup_session.php
 * @brief Registers a new user with a transaction-backed insertion into users and score tables, initializing the session.
 */
    header('Content-Type: application/json; charset=utf-8');
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    define('DBHOST', 'localhost');
    define('DBUSER', 'root');
    define('DBPASS', null);
    define('DBNAME', 'logindata');

    $connection = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);
    if (!$connection) {
        echo json_encode(['return' => false, 'message' => 'Database connection failed']);
        exit;
    }

    $email = trim($_POST["email"] ?? ''); 
    $username = trim($_POST["username"] ?? '');
    $password = $_POST["password"] ?? '';

    if (empty($email) || empty($username) || empty($password)) {
        echo json_encode(['return' => false, 'message' => 'Please fill in all fields']);
        exit;
    }

    $password_h = password_hash($password, PASSWORD_BCRYPT);

    $stmt_check = mysqli_prepare($connection, "SELECT username FROM users WHERE email = ? OR username = ? LIMIT 1");
    if ($stmt_check) {
        mysqli_stmt_bind_param($stmt_check, "ss", $email, $username);
        mysqli_stmt_execute($stmt_check);
        mysqli_stmt_store_result($stmt_check);
        if (mysqli_stmt_num_rows($stmt_check) > 0) {
            mysqli_stmt_close($stmt_check);
            echo json_encode(['return' => false, 'message' => 'Email or username already exists']);
            exit;
        }
        mysqli_stmt_close($stmt_check);
    } else {
        echo json_encode(['return' => false, 'message' => 'Error checking user']);
        exit;
    }

    $stmt_user = mysqli_prepare($connection, "INSERT INTO users (username, pass, email) VALUES (?, ?, ?)");
    $stmt_score = mysqli_prepare($connection, "INSERT INTO score (score, username) VALUES (0, ?)");

    if ($stmt_user && $stmt_score) {
        mysqli_stmt_bind_param($stmt_user, "sss", $username, $password_h, $email);
        mysqli_stmt_bind_param($stmt_score, "s", $username);

        mysqli_begin_transaction($connection);
        $res1 = mysqli_stmt_execute($stmt_user);
        $res2 = mysqli_stmt_execute($stmt_score);

        if ($res1 && $res2) {
            mysqli_commit($connection);
            $_SESSION["username"] = $username;
            $_SESSION["score"] = 0;
            echo json_encode(['return' => true, 'message' => 'User registered successfully']);
        } else {
            mysqli_rollback($connection);
            echo json_encode(['return' => false, 'message' => 'Error inserting into database']);
        }
        mysqli_stmt_close($stmt_user);
        mysqli_stmt_close($stmt_score);
    } else {
        echo json_encode(['return' => false, 'message' => 'Error preparing query']);
    }

    mysqli_close($connection);
?>
