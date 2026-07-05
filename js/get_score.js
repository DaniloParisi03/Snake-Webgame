
/**
 * @file get_score.js
 * @brief Manages score reporting, record checking, session verification, and logout on the game page.
 */

var [userName, maxScore] = [null, null];

/**
 * @brief Modifies the score display elements when a new record is achieved.
 * @param {number} actualScore - The current score achieved.
 */
function newRecord(actualScore){
    document.getElementById("messaggioRecord").style.display = "inline";
    document.getElementById("score").style.color = "rgb(0, 245, 12)";
    document.getElementById("userscoreP").innerText = "Best Score: " + actualScore;
}

/**
 * @brief Checks if the current score is a record for the user and submits it via AJAX if higher.
 * @param {number} actualScore - The current score achieved.
 */
export function compareScore(actualScore){
    if(actualScore > maxScore){
        maxScore = actualScore;
        newRecord(actualScore);
        $.ajax({
            type: "POST",
            url: "../php/update_score.php",
            data: { actualScore: actualScore }, 
            dataType: "json",
            success: function (response) {
                if (!response.return) 
                    console.error(`Update failed: ${response.message}`);
            },
            error: function (data) {
                console.error('Error type:', data);
            },
        });
    }
}

/**
 * @brief Logout handler that terminates the PHP session and redirects to home.
 * @param {Event} e - The click event.
 */
function exitSession(e){
    e.preventDefault();
    
    $.ajax({
            type: "GET",
            url: "../php/close_session.php",
            dataType: "json",
            success: function (response) {
                console.log(response);
                if (response.return === true) {
                    console.log(response.message);
                    window.location.href = "../html/home.html";
                } 
                else {
                    alert(`Logout failed: ${response.message}`);
                }
            },
            error: function (data) {
                console.log('Error type:', data);
                console.log('Response:', data.responseText);
        },
    });
}

/**
 * @brief Verifies active session on page load; redirects to home if unauthenticated or bootstraps user data.
 */
$(document).ready(
    function(){
        var session;
        // {cache: false} prevents browser caching of AJAX requests
        $.ajaxSetup({cache: false});
        $.get('../php/player_session.php', function (data) {
            session = JSON.parse(data);
            console.log(session);
            if(session.length == 0)
                window.location.href = "../html/home.html";
            else{
                [userName, maxScore] = [session.username, parseInt(session.score)];
                document.getElementById("usernameP").innerText += " " + userName;
                document.getElementById("userscoreP").innerText += " " + maxScore;
            }
        });
    }
);

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logout").addEventListener("click", exitSession);
});