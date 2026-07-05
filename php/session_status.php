<?php
/**
 * @file session_status.php
 * @brief Checks whether an active user session exists and returns a boolean status flag in JSON format.
 */
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
echo json_encode(["return" => (isset($_SESSION["username"]) && isset($_SESSION["score"]))]);
?>
