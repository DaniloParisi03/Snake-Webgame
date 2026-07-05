/**
 * @file home_code.js
 * @brief Handles user logout from the home page.
 */

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

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logout").addEventListener("click", exitSession);
});