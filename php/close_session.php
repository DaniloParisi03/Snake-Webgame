<?php
/**
 * @file close_session.php
 * @brief Terminates the active user session and returns a JSON status response.
 */
header('Content-Type: application/json; charset=utf-8');
session_start();
session_unset();
session_destroy();

echo json_encode(['return' => true, 'message' => 'Session closed successfully']);
?>