<?php
/**
 * @file login_session.php
 * @brief Authenticates a user using email/username and password, retrieves their high score, and initializes the session.
 */
header('Content-Type: application/json; charset=utf-8');
define('DBHOST', 'localhost');
define('DBUSER', 'root');
define('DBPASS', null);
define('DBNAME', 'logindata');

$connection = mysqli_connect(DBHOST, DBUSER, DBPASS, DBNAME);
if (!$connection) {
    echo json_encode(['return' => false, 'message' => 'Database connection failed']);
    exit;
}

$login_input = trim($_POST["email"] ?? ''); 
$password = $_POST["password"] ?? '';

if (empty($login_input) || empty($password)) {
    echo json_encode(['return' => false, 'message' => 'Please fill in all fields']);
    exit;
}

$stmt = mysqli_prepare($connection, "SELECT us.pass, us.username FROM users us WHERE us.email = ? OR us.username = ? LIMIT 1");
if ($stmt) {
    mysqli_stmt_bind_param($stmt, "ss", $login_input, $login_input);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($user && password_verify($password, $user["pass"])) {
        $username = $user["username"];
        
        // Update user's last activity timestamp
        $stmt_active = mysqli_prepare($connection, "UPDATE users SET last_active = NOW() WHERE username = ?");
        if ($stmt_active) {
            mysqli_stmt_bind_param($stmt_active, "s", $username);
            mysqli_stmt_execute($stmt_active);
            mysqli_stmt_close($stmt_active);
        }

        $stmt_score = mysqli_prepare($connection, "SELECT score FROM score WHERE username = ? LIMIT 1");
        $maxScore = 0;
        if ($stmt_score) {
            mysqli_stmt_bind_param($stmt_score, "s", $username);
            mysqli_stmt_execute($stmt_score);
            $res_score = mysqli_stmt_get_result($stmt_score);
            if ($row_score = mysqli_fetch_assoc($res_score)) {
                $maxScore = (int)$row_score["score"];
            }
            mysqli_stmt_close($stmt_score);
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION["username"] = $username;
        $_SESSION["score"] = $maxScore;

        echo json_encode(['return' => true, 'message' => 'Login successful']);
    } else {
        echo json_encode(['return' => false, 'message' => 'Invalid credentials or user not found']);
    }
} else {
    echo json_encode(['return' => false, 'message' => 'Error executing query']);
}

mysqli_close($connection);
?>