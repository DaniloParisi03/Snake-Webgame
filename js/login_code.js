/**
 * @file login_code.js
 * @brief Handles login form validation, password visibility toggling, and AJAX authentication submission.
 */

/**
 * @brief Validates form inputs against regular expressions for email and password security.
 * @param {Event} e - The form submit event.
 * @return {boolean} True if inputs are valid, false otherwise.
 */
function checkForm(e){
    function checkElemRE(elem, regExp){
        if(!regExp.test(elem.value)) {
            elem.className = "error-value";
            alert(elem.id == "email" ? "Invalid email" : "Password must be at least 8 characters long, including uppercase, lowercase, numbers, and symbols");
            return false;
        } else {
            elem.className = "";  
        }
        return true;
    }

    const mailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,30}$/;
   
    var passVal = document.getElementById("myPass");
    var mailVal = document.getElementById("email");

    return checkElemRE(passVal, passRegExp) && checkElemRE(mailVal, mailRegExp);
}

/**
 * @brief Toggles password input visibility when the show password checkbox is clicked.
 */
function ShowPass(){
    var pass = document.getElementById("myPass");
    if(pass.type == "password")
    {
        pass.type = "text";
    }
    else 
    {
        pass.type = "password";
    }
}

/**
 * @brief Submits login form data via AJAX to verify user credentials against the database.
 * @param {Event} e - The form submit event.
 */
function sendForm(e){
    e.preventDefault();
    if(!checkForm(e)){
        return;
    }

    var form = $(e.target);

    $.ajax({
        type: "POST",
        url: "../php/login_session.php",
        data: form.serialize(), 
        dataType: "json",
        success: function (response) {
            if (response.return === true) {
                window.location.href = "../html/home.html"; 
            } 
            else {
                alert(`Login failed: ${response.message}`);
            }
        },
        error: function (data) {
            console.log('Error type:', data);
            console.log('Response:', data.responseText);
        },
    });
}

document.addEventListener("DOMContentLoaded", () => { 
    document.getElementById("formLogin").addEventListener("submit", sendForm);
});

/**
 * @brief Redirects to home page immediately if an active user session is already present.
 */
function beforeDocReady(){
    $.ajaxSetup({cache: false});
    $.get('../php/session_status.php', function (data) {
        let SessionFlag = JSON.parse(data);
        if(SessionFlag.return)
            window.location.href = "../html/home.html"; 
    });
}

beforeDocReady();
