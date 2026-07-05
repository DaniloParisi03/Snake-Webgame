/**
 * @file game_code.js
 * @brief Core game loop, event handlers, and rendering logic for the Snake game.
 */
import { Snake, Apple } from "./player.js";
import { timeInt, Stopwatch } from "./timer_code.js";
import { compareScore } from "./get_score.js";

window.addEventListener('DOMContentLoaded',
    function () {
        const canvas = document.getElementById('screen');
        const reButton = document.getElementById("restartButton");
        const pausButton = document.getElementById("pauseButton");
        const logoutButton = document.getElementById("logout");

        var timer, game = null;

        canvas.width = 600;
        canvas.height = 600;

        const ctx = canvas.getContext('2d');
        canvas.style.backgroundImage = 'url(../images/grass.png)';

        /**
         * @class Game
         * @brief Encapsulates overall game state, score, entities, and movement speed.
         */
        class Game {

            constructor() {
                this.width = canvas.width;
                this.height = canvas.height;
                // Number of apples eaten
                this.score = 0;

                // Update position only when step occurs
                this.stop = false;
                // Snake body
                this.player = new Snake(this);

                this.context = ctx;
                // Increasing movement of the snake
                this.dx = 0;
                this.dy = 0;
                this.direction = 0;

                // Fruit appearing on screen
                this.apple = new Apple(this);
                
                // Snake movement speed in milliseconds
                this.velocity = 550;
                // Condition of game over
                this.gameOver = false;
            }
            /**
             * @brief Renders the snake and apple onto the canvas context.
             * @param {CanvasRenderingContext2D} context - The 2D rendering context.
             */
            draw(context) {
                this.player.draw(context);
                this.apple.draw(context);
            }
            /**
             * @brief Updates snake movement coordinates.
             */
            update() {
                this.player.update(this.dx, this.dy, this.direction);
            }

            /**
             * @brief Checks if the snake's head collided with the apple; if so, increments score, increases speed, respawns apple, and grows snake body.
             */
            touchApple() {
                let head = this.player.snake[0];
                if (head.x == this.apple.x && head.y == this.apple.y) {
                    clearInterval(timer);

                    this.score++;
                    updateScore(this.score);
                    this.apple.checkAppleCoordinates();
                    this.player.addBodyElement(this);

                    this.velocity = Math.max(75, this.velocity - 25);
                    timer = setInterval(updateMovement, this.velocity);
                }
            }
        }
        /**
         * @brief Updates the displayed score on the webpage; displays green text when a new record is achieved.
         * @param {number} newscore - The new score value.
         */
        function updateScore(newscore) {
            let point = document.getElementById('score');

            point.innerText = "Score: " + newscore;
            let colortext = "white";

            if(point.style.color == "rgb(0, 245, 12)")
                colortext = "rgb(0, 245, 12)";

            else
                point.style.color = "yellow";

            setTimeout(() => point.style.color = colortext, 200);
            compareScore(newscore);

        }

        /**
         * @brief Manages stopwatch formatting and state during pause and restart events.
         * @param {boolean} zero - If true, resets stopwatch to 00:00:00.
         */
        function setStopwatch(zero){

            const cronoTime= document.getElementById("cronometro");
            let [hours,min,sec] = [0,0,0];
            
            if(zero){
                cronoTime.innerText = "00:00:00";
            }
            else{
                const cronoContent = cronoTime.innerText;
                [hours,min,sec] = [
                parseInt(cronoContent.substring(0,2)), 
                parseInt(cronoContent.substring(3,5)), 
                parseInt(cronoContent.substring(6,8))];
            }
            Stopwatch(sec,min,hours);
        }
        
        // Defines delta movement based on piece direction
        function mov(inputdirection)
        {
            switch(inputdirection){
                case ("Left"):
                   game.dx = -40;
               break;

               case ("Down"):
                   game.dy = +40;
               break;

               case ("Right"):
                   game.dx = +40;
               break;

               case ("Up"):
                   game.dy = -40;
                   break;
            }
            game.direction = inputdirection;
            game.stop = true;
        }
        
        function updateMovement()
        {
            if (game && !game.gameOver) {
                const snakeHead = game.direction || game.player.snake[0].direction;
                mov(snakeHead);
                game.inputLocked = false;
            }
        }

        /**
         * @brief Changes movement direction when an arrow key is pressed, preventing 180-degree self-collision.
         * @param {KeyboardEvent} ev - The keyboard event.
         */
        function movement(ev) {
            if (!game || game.gameOver || canvas.classList.contains("pause") || game.inputLocked)
                return;

            if(!["ArrowDown","ArrowUp","ArrowLeft","ArrowRight"].includes(ev.key))
                return;

            const directionWithout = ev.key.substring(5);
            const headDir = game.player.snake[0].direction;

            if(headDir === directionWithout)
                return;

            if((directionWithout == "Left" && headDir == "Right") ||
               (directionWithout == "Right" && headDir == "Left") ||
               (directionWithout == "Up" && headDir == "Down") ||
               (directionWithout == "Down" && headDir == "Up")) {
                return;
            }

            game.direction = directionWithout;
            game.inputLocked = true;
        }
              
        var animId = null;

        /**
         * @brief Restarts the game by creating a new Game instance, resetting timer, and clearing intervals.
         */
        function startGame(){
            clearInterval(timer);
            if(animId) cancelAnimationFrame(animId);

            if(game){
                canvas.className = "";
                game.context.clearRect(0, 0, canvas.width, canvas.height);
                clearInterval(timeInt);
            }
            const iconPause = document.getElementById("pauseButton").querySelector("i");
            iconPause.innerText = "pause_circle_outline";

            game = new Game();
            game.direction = "Right";
            game.inputLocked = false;
            timer = setInterval(updateMovement, game.velocity);

            document.getElementById("score").innerText = "Score: 0";
            document.getElementById("messaggioRecord").style.display = "none";

            setStopwatch(true);
            animId = requestAnimationFrame(animate);
        }

        /**
         * @brief Renders overlay text (e.g., Pause or Game Over) onto the center of the canvas.
         * @param {string} text - Text string to display.
         */
        function insertTextCanvas(text){
            ctx.font = '60px gameFont';
            ctx.textAlign = "center"; 
            ctx.textBaseline = "middle";
            ctx.fillStyle = "white";
            ctx.fillText(text, 300, 300);
        }

        /**
         * @brief Pauses or resumes game loop and stopwatch.
         */
        function pauseGame(){
            const iconPause = document.getElementById("pauseButton").querySelector("i");
            if(!game || game.gameOver)
                return;

            if(canvas.classList.contains("pause")) {
                timer = setInterval(updateMovement, game.velocity);
                canvas.classList.remove("pause");
                ctx.clearRect(0, 0, 600, 600);
                iconPause.innerText = "pause_circle_outline";
                setStopwatch(false);
            } else {
                iconPause.innerText = "play_circle_outline";
                insertTextCanvas("Pause");
                clearInterval(timer);
                clearInterval(timeInt);
                canvas.classList.add("pause");
            }
        }

        /**
         * @brief Main game animation loop running until game.gameOver is true.
         */
        function animate() {
            game.draw(ctx);
            game.touchApple();

            if (game.stop) {
                game.update();
                game.dx = 0;
                game.dy = 0;
                game.stop = false;
            }

            if(!game.gameOver) {
                animId = requestAnimationFrame(animate);
            } else { 
                clearInterval(timeInt);
                clearInterval(timer);
                insertTextCanvas("Game Over");
            }
        } 

        // Initial code execution
        startGame();        
        window.addEventListener('keydown', movement, false);

        pausButton.addEventListener('click', pauseGame);
        reButton.addEventListener('click', startGame);
    });
