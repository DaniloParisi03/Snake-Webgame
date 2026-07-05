/**
 * @file timer_code.js
 * @brief Manages the game stopwatch interval and time formatting.
 */

export var timeInt = null;

/**
 * @brief Starts or resumes the game stopwatch on the canvas UI.
 * @param {number} sec - Initial seconds.
 * @param {number} min - Initial minutes.
 * @param {number} hours - Initial hours.
 */
export function Stopwatch(sec = 0, min = 0, hours = 0){
    const timer = document.getElementById('cronometro');

    timeInt = setInterval(() => {
        sec++;

        if(sec >= 60){
            min += Math.floor(sec / 60);
            sec = sec % 60;
        }
        if(min >= 60){
            hours += Math.floor(min / 60);
            min = min % 60;
        }

        if(timer) {
            timer.innerText = (hours < 10 ? ('0' + hours) : hours) + ':' + (min < 10 ? ('0' + min) : min) + ':' + (sec < 10 ? ('0' + sec) : sec);
        }
    }, 1000);
}

