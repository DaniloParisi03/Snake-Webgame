<?php
/**
 * @file update_score.php
 * @brief Updates the user's high score in the database if the new score strictly exceeds the stored record.
 */
    header('Content-Type: application/json; charset=utf-8');
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION["username"]) || !isset($_POST["actualScore"])) {
        echo json_encode(['return' => false, 'message' => 'Unauthorized or missing data']);
        exit;
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

    $usernameSession = $_SESSION["username"];
    $score = (int)$_POST["actualScore"];

    $stmt_check = mysqli_prepare($connection, "SELECT score FROM score WHERE username = ? LIMIT 1");
    if ($stmt_check) {
        mysqli_stmt_bind_param($stmt_check, "s", $usernameSession);
        mysqli_stmt_execute($stmt_check);
        $result_check = mysqli_stmt_get_result($stmt_check);
        $row = mysqli_fetch_assoc($result_check);
        mysqli_stmt_close($stmt_check);
    } else {
        $row = null;
    }

    if ($row !== null && $score > (int)$row['score']) {
        $stmt = mysqli_prepare($connection, "UPDATE score SET score = ? WHERE username = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "is", $score, $usernameSession);
            $success = mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);

            if ($success) {
                $_SESSION["score"] = $score;
                echo json_encode(['return' => true, 'message' => 'Score updated']);
            } else {
                echo json_encode(['return' => false, 'message' => 'Error during update']);
            }
        } else {
            echo json_encode(['return' => false, 'message' => 'Error preparing query']);
        }
    } else {
        echo json_encode(['return' => true, 'message' => 'Score recorded or lower than record']);
    }

    mysqli_close($connection);
?>
