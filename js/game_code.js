/**
 * @file game_code.js
 * @brief Core game loop, event handlers, and rendering logic for the Snake game.
 */
import { Snake, Apple } from "./player.js";
import { timeInt, Stopwatch } from "./timer_code.js";
import { compareScore } from "./get_score.js";

const CELL = 40; // must match player.js

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
                this.width  = canvas.width;
                this.height = canvas.height;
                // Number of apples eaten
                this.score    = 0;
                // Active direction (string): 'Right'|'Left'|'Up'|'Down'
                this.direction = 'Right';
                // True while waiting for a buffered direction to be applied
                this.inputLocked = false;
                // Snake and apple entities
                this.player = new Snake(this);
                this.apple  = new Apple(this);
                this.context = ctx;
                // Step speed in ms – decreases as score increases
                this.velocity = 220;
                // Marks whether this step has already been executed
                this.stepDone = false;
                // Timestamp of the last step commit (for interpolation)
                this.lastStepTime = performance.now();
                this.gameOver     = false;
                // Wall-bounce animation state
                this.bounceBack     = false;
                this.bounceStart    = 0;
                this.bounceDuration = 500;
            }
            /**
             * @brief Renders the snake and apple onto the canvas context with 60 FPS interpolation.
             * @param {CanvasRenderingContext2D} context - The 2D rendering context.
             * @param {number} progress - Interpolation progress ratio between 0.0 and 1.0.
             */
            draw(context, progress = 1) {
                context.clearRect(0, 0, this.width, this.height);
                this.player.draw(context, progress);
                this.apple.draw(context);
            }
            /**
             * @brief Updates snake movement coordinates.
             */
            update() {
                const DELTAS = {
                    Right: [  CELL,     0],
                    Left:  [ -CELL,     0],
                    Down:  [     0,  CELL],
                    Up:    [     0, -CELL],
                };
                const [dx, dy] = DELTAS[this.direction] ?? [0, 0];
                this.player.update(dx, dy, this.direction);
            }

            /**
             * @brief Checks if the snake's head collided with the apple; if so, increments score, increases speed, respawns apple, and grows snake body.
             * @param {number} progress - Interpolation progress ratio between 0.0 and 1.0.
             */
            touchApple(progress = 1) {
                if (progress < 0.5) return;
                let head = this.player.snake[0];
                if (head.x == this.apple.x && head.y == this.apple.y) {
                    clearInterval(timer);

                    this.score++;
                    updateScore(this.score);
                    this.apple.checkAppleCoordinates();
                    this.player.addBodyElement(this);

                    this.velocity = Math.max(50, this.velocity - 8);
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
        function updateMovement()
        {
            if (game && !game.gameOver) {
                game.stepDone = true;
                game.inputLocked = false;
            }
        }

        /**
         * @brief Changes movement direction when an arrow key is pressed, preventing 180-degree self-collision.
         * @param {KeyboardEvent} ev - The keyboard event.
         */
        function movement(ev) {
            if (!game || game.gameOver || canvas.classList.contains('pause') || game.inputLocked)
                return;

            if (!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(ev.key))
                return;

            const dir     = ev.key.substring(5);   // 'Down'|'Up'|'Left'|'Right'
            const headDir = game.player.snake[0].direction;

            // Ignore same direction or 180° reversal
            const opposites = { Left:'Right', Right:'Left', Up:'Down', Down:'Up' };
            if (dir === headDir || dir === opposites[headDir]) return;

            game.direction   = dir;
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
                game.lastStepTime = performance.now();
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
         * @brief Main game animation loop.
         *        Normal play: interpolates snake from old to new grid position.
         *        Wall bounce: dead head slides from wall edge back to safe cell
         *        with 𖦹 eyes, then shows "Game Over" text.
         */
        function animate() {
            const now = performance.now();

            // Execute the grid step only when the movement timer has fired
            if (game.stepDone && !game.gameOver) {
                game.update();
                game.stepDone     = false;
                game.lastStepTime = now;
            }

            if (game.bounceBack) {
                // ── Bounce-back animation (wall hit) ───────────────────────────────
                // progress 0 = at wall edge, progress 1 = back at safe cell
                const t    = Math.min(1, (now - game.bounceStart) / game.bounceDuration);
                const ease = 1 - Math.pow(1 - t, 3);   // ease-out cubic
                game.draw(ctx, ease);

                if (t < 1) {
                    animId = requestAnimationFrame(animate);
                } else {
                    game.bounceBack = false;
                    clearInterval(timeInt);
                    clearInterval(timer);
                    insertTextCanvas('Game Over');
                }
            } else {
                // ── Normal play or instant game-over (self-collision) ─────────────
                const progress = game.gameOver
                    ? 1
                    : Math.min(1, (now - game.lastStepTime) / game.velocity);

                game.draw(ctx, progress);
                game.touchApple(progress);

                if (!game.gameOver) {
                    animId = requestAnimationFrame(animate);
                } else {
                    clearInterval(timeInt);
                    clearInterval(timer);
                    insertTextCanvas('Game Over');
                }
            }
        }

        // Initial code execution
        startGame();        
        window.addEventListener('keydown', movement, false);

        pausButton.addEventListener('click', pauseGame);
        reButton.addEventListener('click', startGame);
    });
