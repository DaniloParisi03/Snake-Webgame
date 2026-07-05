// Size in px of each cell on canvas
const CELL = 40;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: derive the sprite ID for the tail segment from its position relative
// to the segment ahead of it (prev = snake[length-2]).
// ─────────────────────────────────────────────────────────────────────────────
function tailSpriteId(tail, prev) {
    if (tail.y === prev.y) return tail.x > prev.x ? 'tail r' : 'tail l';
    if (tail.x === prev.x) return tail.y > prev.y ? 'tail d' : 'tail u';
    return tail.image.id; // unchanged if geometry is ambiguous
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: derive the sprite ID for any intermediate body segment given its
// immediate neighbours (prev = segment closer to head, next = closer to tail).
// Uses ONLY x/y positions — no direction strings.
// ─────────────────────────────────────────────────────────────────────────────
function bodySpriteId(prev, node, next) {
    if (prev.x === next.x) return 'body v';   // same column → vertical
    if (prev.y === next.y) return 'body h';   // same row    → horizontal

    // Corner: which cardinal direction does each neighbour lie in?
    const fromPrev = prev.x < node.x ? 'left'  :
                     prev.x > node.x ? 'right' :
                     prev.y < node.y ? 'up'    : 'down';
    const fromNext = next.x < node.x ? 'left'  :
                     next.x > node.x ? 'right' :
                     next.y < node.y ? 'up'    : 'down';

    const up    = fromPrev === 'up'    || fromNext === 'up';
    const down  = fromPrev === 'down'  || fromNext === 'down';
    const left  = fromPrev === 'left'  || fromNext === 'left';
    const right = fromPrev === 'right' || fromNext === 'right';

    if (up   && left)  return 'body tl';
    if (up   && right) return 'body tr';
    if (down && left)  return 'body bl';
    if (down && right) return 'body br';

    return 'body h'; // fallback (should never happen on a valid grid)
}

// ─────────────────────────────────────────────────────────────────────────────
// Corner detection helper – used by SnakeNode.draw
// ─────────────────────────────────────────────────────────────────────────────
const CORNER_IDS = new Set(['body tl', 'body tr', 'body bl', 'body br']);

/**
 * @class SnakeNode
 * @brief One segment of the snake (head, body, or tail).
 *
 * Each node stores:
 *   x, y       – current grid-cell position (in pixels, multiples of CELL)
 *   oldx, oldy – position at the PREVIOUS step (for interpolation)
 *   image      – the DOM <img> element for the current sprite
 *   prevImage  – the DOM <img> element from the previous step (for blending)
 *   direction  – direction the HEAD is moving ("Right"|"Left"|"Up"|"Down");
 *                body/tail nodes store this only for the dead-head sprite fallback.
 */
class SnakeNode {
    constructor(game, imageId, x, y) {
        this.game      = game;
        this.x         = x;
        this.y         = y;
        this.oldx      = x;
        this.oldy      = y;
        this.direction = 'Right';
        this.image     = document.getElementById(imageId);
        this.prevImage = this.image;
    }

    /**
     * @brief 60-FPS draw with corner-aware blending.
     *
     * Blending rules:
     *   • current sprite IS a corner  → snap it in immediately (no blend).
     *   • current sprite is straight, prevImage was a corner → hold the corner
     *     until progress 0.5 so it stays visible while the segment glides away.
     *   • everything else → show current sprite.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} progress  – 0.0 … 1.0 interpolation ratio
     */
    draw(ctx, progress = 1) {
        const rx = this.oldx + (this.x - this.oldx) * progress;
        const ry = this.oldy + (this.y - this.oldy) * progress;

        const curIsCorner  = CORNER_IDS.has(this.image.id);
        const prevIsCorner = this.prevImage && CORNER_IDS.has(this.prevImage.id);

        const img = (!curIsCorner && prevIsCorner && progress < 0.5)
            ? this.prevImage
            : this.image;

        ctx.drawImage(img, rx, ry, CELL, CELL);
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @class Snake
 * @brief Manages the ordered list of SnakeNode segments and the collision grid.
 *
 * Movement model (one grid step):
 *   1. Snapshot positions of ALL segments (parallel — no sequential dependency).
 *   2. Move head to next cell (dx/dy from current direction).
 *   3. Move each body/tail segment to the cell the segment AHEAD just vacated.
 *   4. Reassign ALL sprites purely from geometry (no direction strings for body).
 *   5. Update the collision grid.
 */
export class Snake {
    constructor(game) {
        this.game = game;

        // Initial 3-segment snake facing right, centred vertically
        const y0 = 6 * CELL;
        this.snake = [
            new SnakeNode(game, 'head r', 2 * CELL, y0),
            new SnakeNode(game, 'body h',     CELL, y0),
            new SnakeNode(game, 'tail l',        0, y0),
        ];

        // 15×15 collision grid; 0 = empty, otherwise holds the occupant object
        this.grid = Array.from({ length: 15 }, () => Array(15).fill(0));
        this.grid[6][0] = this.snake[2];
        this.grid[6][1] = this.snake[1];
        this.grid[6][2] = this.snake[0];
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * @brief Render all segments with smooth interpolation.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} progress
     */
    draw(ctx, progress = 1) {
        for (const node of this.snake) node.draw(ctx, progress);
    }

    /**
     * @brief Advance the snake by one grid step.
     *
     * @param {number} dx         – pixel delta for the head (+/-CELL or 0)
     * @param {number} dy         – pixel delta for the head (+/-CELL or 0)
     * @param {string} direction  – new head direction
     */
    update(dx, dy, direction) {
        const n = this.snake.length;

        // ── Phase 1: snapshot every segment's current position ────────────────
        // We need a plain copy so that the parallel update in Phase 3 does NOT
        // see each other's new positions.
        const snap = this.snake.map(s => ({ x: s.x, y: s.y }));

        // ── Phase 2: commit oldx/oldy and prevImage for ALL nodes NOW ─────────
        for (const node of this.snake) {
            node.oldx      = node.x;
            node.oldy      = node.y;
            node.prevImage = node.image;
        }

        // ── Phase 3: move positions in parallel ───────────────────────────────
        // Head moves in the given direction.
        this.snake[0].x         += dx;
        this.snake[0].y         += dy;
        this.snake[0].direction  = direction;

        // Every other segment steps into the cell its predecessor occupied.
        for (let i = 1; i < n; i++) {
            this.snake[i].x = snap[i - 1].x;
            this.snake[i].y = snap[i - 1].y;
        }

        // ── Phase 4: assign sprites purely from geometry ──────────────────────
        this.#assignSprites(direction);

        // ── Phase 5: update collision grid ────────────────────────────────────
        this.#updateGrid();
    }

    /**
     * @brief Grow the snake by one segment after eating an apple.
     * @param {Game} game
     */
    addBodyElement(game) {
        const tail = this.snake[this.snake.length - 1];

        // The new tail spawns one cell behind the current tail (opposite to its
        // travel direction, derived from its position relative to the segment ahead).
        const prev     = this.snake[this.snake.length - 2];
        const newX     = tail.x + (tail.x - prev.x);
        const newY     = tail.y + (tail.y - prev.y);
        const newNode  = new SnakeNode(game, 'tail l', newX, newY);
        newNode.oldx   = newX;
        newNode.oldy   = newY;
        newNode.prevImage = newNode.image;

        this.snake.push(newNode);

        // Re-assign sprites so the old tail becomes a body segment
        this.#assignSprites(this.snake[0].direction);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * @brief Assign correct sprites to every segment based solely on geometry.
     *        Head: direction letter.
     *        Body: straight (h/v) or corner (tl/tr/bl/br) from neighbour positions.
     *        Tail: direction derived from position relative to segment ahead.
     * @param {string} direction  – current head direction string
     */
    #assignSprites(direction) {
        const n    = this.snake.length;
        const head = this.snake[0];

        // Head
        if (head.image.id.startsWith('dead')) {
            head.image = document.getElementById('dead ' + direction[0].toLowerCase());
        } else {
            head.image = document.getElementById('head ' + direction[0].toLowerCase());
        }

        // Intermediate body segments
        for (let i = 1; i < n - 1; i++) {
            const id = bodySpriteId(this.snake[i - 1], this.snake[i], this.snake[i + 1]);
            this.snake[i].image = document.getElementById(id);
        }

        // Tail (only when snake has more than 1 segment)
        if (n > 1) {
            const tail = this.snake[n - 1];
            const prev = this.snake[n - 2];
            tail.image = document.getElementById(tailSpriteId(tail, prev));
        }
    }

    /**
     * @brief Update the 15×15 collision grid after positions have been committed.
     */
    #updateGrid() {
        for (let i = 0; i < this.snake.length; i++) {
            const node = this.snake[i];

            // Clear old cell
            const oi = node.oldy / CELL, oj = node.oldx / CELL;
            if (oi >= 0 && oi < 15 && oj >= 0 && oj < 15)
                this.grid[oi][oj] = 0;

            // Check new cell
            const ni = node.y / CELL, nj = node.x / CELL;
            if (ni < 0 || nj < 0 || ni > 14 || nj > 14 ||
                (i === 0 && this.grid[ni][nj] !== 0 && !(this.grid[ni][nj] instanceof Apple))) {
                this.#triggerGameOver();
            } else {
                this.grid[ni][nj] = node;
            }
        }
    }

    /**
     * @brief Show the dead-head sprite and set game.gameOver = true.
     */
    #triggerGameOver() {
        const head = this.snake[0];
        const dir  = head.direction[0].toLowerCase();
        head.image = document.getElementById('dead ' + dir);
        // Snap head back to its previous cell so it's drawn on the grid
        head.x = head.oldx;
        head.y = head.oldy;
        head.draw(this.game.context, 1);
        this.game.gameOver = true;
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @class Apple
 * @brief Consumable fruit that spawns on a random empty grid cell.
 */
export class Apple {
    constructor(game) {
        this.game  = game;
        this.x     = 0;
        this.y     = 0;
        this.image = document.getElementById('apple');
        this.checkAppleCoordinates();
    }

    /**
     * @brief Pick a random free cell for the apple.
     */
    checkAppleCoordinates() {
        const grid = this.game.player.grid;

        // Clear current cell if occupied by this apple
        const ci = this.y / CELL, cj = this.x / CELL;
        if (grid[ci] && grid[ci][cj] instanceof Apple) grid[ci][cj] = 0;

        let i, j;
        do {
            i = Math.floor(Math.random() * 15);
            j = Math.floor(Math.random() * 15);
        } while (grid[i][j] !== 0);

        grid[i][j] = this;
        this.x = j * CELL;
        this.y = i * CELL;
    }

    /**
     * @brief Draw the apple at its current grid position.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, CELL, CELL);
    }
}