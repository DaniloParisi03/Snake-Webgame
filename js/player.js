// Size in px of SnakeNode on canvas
const width = 40, height = 40;

/**
 * @class SnakeNode
 * @brief Represents a single segment (head, body, or tail) of the snake on the canvas grid.
 */
class SnakeNode{
    /**
     * @brief Constructs a new SnakeNode segment.
     * @param {Game} game - Reference to the main game object.
     * @param {string} image_id - DOM image ID representing this segment.
     * @param {number} x - Initial X coordinate in pixels.
     * @param {number} y - Initial Y coordinate in pixels.
     */
    constructor(game, image_id, x, y){
        this.game = game;
        // Current coordinates
        this.x = x;
        this.y = y;

        // Coordinates at the previous step
        this.oldx = x;
        this.oldy = y;

        this.direction = "Right";
        // Segment image element
        this.image = document.getElementById(image_id);
    }

    /**
     * @brief Clears previous position and draws the current segment onto the canvas context.
     * @param {CanvasRenderingContext2D} context - The 2D rendering context.
     */
    draw(context){
        context.beginPath();
        context.clearRect(this.oldx, this.oldy, width, height);
        context.drawImage(this.image, this.x, this.y, width, height);
    }
    
    /**
     * @brief Updates position and orientation of this node.
     * @param {number} dx - Change along X axis.
     * @param {number} dy - Change along Y axis.
     * @param {string} direction - Current movement direction.
     * @param {SnakeNode|null} prevNode - Preceding segment used to track trailing movement.
     */
    update(dx, dy, direction, prevNode)
    {   
        function updateDirection(node, prevNode){
            if(node.x == prevNode.x)
                node.direction = ((node.y > prevNode.y) ? "Up" : "Down");
            else 
                node.x = prevNode.oldx;
            
            if(node.y == prevNode.y){
                node.direction = ((node.x > prevNode.x) ? "Left" : "Right");
            } else 
                node.y = prevNode.oldy;
        }

        function updateTailDirection(tail, pdirection){
            switch(pdirection)
            {
                case ("Right"):
                    tail.image = document.getElementById("tail l");
                break;

                case ("Left"):
                    tail.image = document.getElementById("tail r");
                break;

                case ("Down"):
                    tail.image = document.getElementById("tail u");
                break;

                case ("Up"):
                    tail.image = document.getElementById("tail d");
                break;
            }
        }

        this.direction = direction;
        const headType = this.image.id.includes("head") ? "head" : (this.image.id.includes("dead") ? "dead" : null);
        if(headType)
        {
            this.image = document.getElementById(headType + " " + this.direction[0].toLowerCase());
            this.x += dx;
            this.y += dy;
        }
        else{
            updateDirection(this, prevNode);
            if(this.image.id.includes("tail"))
            {
                updateTailDirection(this, prevNode.direction);
            }
            else if(this.image.id.includes("body"))
            {
                if(direction === "Right" || direction === "Left")
                    this.image = document.getElementById("body h");
                else
                    this.image = document.getElementById("body v");
            }
            
            // Update direction of this segment based on the old position of its predecessor
            updateDirection(this, prevNode);
        }
    }
};


/**
 * @class Snake
 * @brief Manages the collection of SnakeNodes and grid representation for the player.
 */
export class Snake{
    /**
     * @brief Constructs the initial snake body and 15x15 grid matrix.
     * @param {Game} game - Reference to the main game object.
     */
    constructor(game)
    {
        const y0 = 240, x0 = 40;
        this.snake = [new SnakeNode(game, 'head r', 2 * x0, y0), new SnakeNode(game, 'body h', x0, y0), new SnakeNode(game, 'tail l', 0, y0)];
        // Grid describing the canvas space as a 15x15 matrix
        this.grid = Array.from({length: 15}, () => Array(15).fill(0));

        if(this.snake.length === 3)
            [this.grid[6][0], this.grid[6][1], this.grid[6][2]] = [this.snake[0], this.snake[1], this.snake[2]];  
        this.game = game;
        this.#updateGrid();
    }

    /**
     * @brief Renders all snake segments onto the canvas context.
     * @param {CanvasRenderingContext2D} context - The 2D rendering context.
     */
    draw(context)
    {
        for(let i = 0; i < this.snake.length; i++)
            this.snake[i].draw(context);
    }

    /**
     * @brief Updates position of each snake segment on the canvas and in the grid matrix.
     * @param {number} dx - Movement delta along X axis.
     * @param {number} dy - Movement delta along Y axis.
     * @param {string} direction - Movement direction of the head.
     */
    update(dx, dy, direction)
    {  
        for(let i = 0; i < this.snake.length; i++){
            let node = this.snake[i];
            [node.oldx, node.oldy] = [node.x, node.y];
            // Head has no previous node
            node.update(dx, dy, direction, (i == 0) ? null : this.snake[i-1]);
        }

        this.#alignBody();
        this.#updateGrid();
    }

    /**
     * @brief Appends a new segment to the snake body when an apple is consumed.
     * @param {Game} game - Reference to the main game object.
     */
    addBodyElement(game)
    {
        var previousLast = this.snake[this.snake.length-1];
        var pdx, pdy = 0;

        switch(previousLast.direction){
            case ("Left"):
                [pdx, pdy] = [previousLast.x + 40, previousLast.y];
            break;

           case ("Right"):
                [pdx, pdy] = [previousLast.x - 40, previousLast.y];
            break;

           case ("Down"):
                [pdx, pdy] = [previousLast.x, previousLast.y - 40];
            break;

           case ("Up"):
                [pdx, pdy] = [previousLast.x, previousLast.y + 40];
            break;
        }
        const oldImgID = previousLast.image.id, endImdIDlen = previousLast.image.id.length;

        const newElem = new SnakeNode(game, oldImgID, pdx, pdy);
        newElem.direction = previousLast.direction;

        let newImgID = "body v";
        if (oldImgID[endImdIDlen] == 'u' || oldImgID[endImdIDlen] == 'd')
            newImgID = "body h";
        
        previousLast.image = document.getElementById(newImgID);
        this.snake.push(newElem); 
        this.#alignBody();
    }

    /**
     * @brief Updates the 15x15 grid matrix representing element locations on the field.
     */
    #updateGrid()
    {
        for (let i = 0; i < this.snake.length; i++)
        {
            const [oldI, oldJ] = [this.snake[i].oldy / 40, this.snake[i].oldx / 40];
            this.grid[oldI][oldJ] = 0;

            const [newI, newJ] = [this.snake[i].y / 40, this.snake[i].x / 40];
            if((newI < 0 || newJ < 0) || (newI > 14 || newJ > 14) || (i == 0 && (this.grid[newI][newJ] != 0 && !(this.grid[newI][newJ] instanceof Apple))))
                this.#checkGameOver();
            else
                this.grid[newI][newJ] = this.snake[i];
        }
    }

    /**
     * @brief Aligns intermediate body nodes between head and tail: (tail) -> ... -> (prev) -> (@this) -> (next) -> ... -> (head).
     */    
    #alignBody(){
        for(var i = 1; i < this.snake.length - 1; i++)
        {
            let [prev, nodeToAlign, next] = [this.snake[i-1], this.snake[i], this.snake[i+1]];
            if(prev.x == next.x)
            {
                nodeToAlign.image = document.getElementById("body v");
            }
            else if(prev.y == next.y)
            {
                nodeToAlign.image = document.getElementById("body h");
            }
        }
        this.#orientBody();
        this.#orientTail();
    }

    /**
     * @brief Orients intermediate body segments (corner textures) based on current and next node directions.
     */
    #orientBody(){
        for(let i = 1; i < this.snake.length - 1; i++)
        {
            var c = this.snake[i];
            var p = this.snake[i+1];
            
            if ((c.direction == "Up" && p.direction == "Right") || (c.direction == "Left" && p.direction == "Down"))
                c.image = document.getElementById("body tl");
                
            else if((c.direction == "Up" && p.direction == "Left") || (c.direction == "Right" && p.direction == "Down"))
                c.image = document.getElementById("body tr");

            else if((c.direction == "Down" && p.direction == "Right") || (c.direction == "Left" && p.direction == "Up"))
                c.image = document.getElementById("body bl");

            else if((c.direction == "Right" && p.direction == "Up") || (c.direction == "Down" && p.direction == "Left"))
                c.image = document.getElementById("body br");
        }
    }
    
    /**
     * @brief Adjusts tail segment texture based on the direction of its predecessor.
     */
    #orientTail(){
        let tail = this.snake[this.snake.length-1];
        let prev = this.snake[this.snake.length-2];

        if(tail.y == prev.y)
        {
            if(tail.x > prev.x)
                tail.image = document.getElementById('tail r');
            else
                tail.image = document.getElementById('tail l');
        }
        else if(tail.x == prev.x)
        {
            if(tail.y > prev.y)
                tail.image = document.getElementById('tail d');
            else
                tail.image = document.getElementById('tail u');
        }
    }

    /**
     * @brief Checks if the snake head collided with walls or its own body, triggering game over.
     */
    #checkGameOver(){
        var head = this.snake[0];
        const [headI, headJ] = [head.y / 40, head.x / 40];
        // If touching wall or touching snake body -> Game Over
        if((head.x == 600 && head.direction === "Right") || 
           (head.x == -40 && head.direction === "Left") || 
           (head.y == -40 && head.direction === "Up") || 
           (head.y == 600 && head.direction === "Down") ||
           (this.grid[headI][headJ] != 0 && !(this.grid[headI][headJ] instanceof Apple)))
        {
            head.image = document.getElementById("dead " + head.image.id.substring(5));
            head.x = head.oldx;
            head.y = head.oldy;
            head.draw(this.game.context);

            this.game.gameOver = true;
        }
    }
}

/**
 * @class Apple
 * @brief Represents the consumable fruit entity that spawns randomly on the canvas grid.
 */
export class Apple{
    /**
     * @brief Constructs a new Apple object and places it on a free grid cell.
     * @param {Game} game - Reference to the main game object.
     */
    constructor(game){
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.checkAppleCoordinates();
        this.image = document.getElementById('apple');
    }

    /**
     * @brief Generates random coordinates for the apple, ensuring no overlap with snake segments.
     */
    checkAppleCoordinates(){
        const grid = this.game.player.grid;
        if (grid[this.y / 40] && grid[this.y / 40][this.x / 40] instanceof Apple) {
            grid[this.y / 40][this.x / 40] = 0;
        }

        var i, j;
        do {
            j = Math.floor(Math.random() * 15);
            i = Math.floor(Math.random() * 15);
        } while(grid[i][j] != 0);

        grid[i][j] = this;

        this.x = 40 * j;
        this.y = 40 * i;
    }

    /**
     * @brief Draws the apple image at its current grid coordinates.
     * @param {CanvasRenderingContext2D} context - The 2D rendering context.
     */
    draw(context){
        context.beginPath();
        context.drawImage(this.image, this.x, this.y, width, height);
    }
}