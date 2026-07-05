<?php
/**
 * @file player_session.php
 * @brief Retrieves the current user's session data (username and score) as a JSON object.
 */
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
echo json_encode($_SESSION ?? []);
?>