// ─────────────────────────────────────────────────────────────────────────────
// Grid / cell constants
// ─────────────────────────────────────────────────────────────────────────────
const CELL = 40;        // pixel size of one grid cell
const BW   = 30;        // snake body width in px   = CELL * 0.75
const BO   = 5;         // body offset from edge     = (CELL - BW) / 2
const HC   = CELL / 2;  // half-cell                 = 20
const ARM  = HC + BW/2; // arm reach for corners/tail = 35

// ─────────────────────────────────────────────────────────────────────────────
// Colour palette
// ─────────────────────────────────────────────────────────────────────────────
const COL = {
    body:    '#3b82f6',   // blue-500  – main body
    head:    '#1d4ed8',   // blue-700  – head (slightly darker)
    dark:    '#1e3a8a',   // blue-950  – outline / pupil
    eye:     '#ffffff',   // white sclera
    dead:    '#ef4444',   // red-500   – dead snake
    deadDk:  '#991b1b',   // red-900   – dead outline
};

// ─────────────────────────────────────────────────────────────────────────────
// Sprite-ID helpers (pure geometry, no DOM)
// ─────────────────────────────────────────────────────────────────────────────
const CORNER_IDS = new Set(['body tl', 'body tr', 'body bl', 'body br']);

/** @returns {string} sprite ID for the tail from its position vs. the segment ahead */
function tailSpriteId(tail, prev) {
    if (tail.y === prev.y) return tail.x > prev.x ? 'tail r' : 'tail l';
    if (tail.x === prev.x) return tail.y > prev.y ? 'tail d' : 'tail u';
    return tail.image.id;
}

/** @returns {string} sprite ID for an intermediate body segment from neighbour positions */
function bodySpriteId(prev, node, next) {
    if (prev.x === next.x) return 'body v';
    if (prev.y === next.y) return 'body h';

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

    return 'body h';
}

/** Lightweight sprite reference – replaces DOM <img> for snake segments */
function spr(id) { return { id }; }

// ─────────────────────────────────────────────────────────────────────────────
// Canvas drawing routines
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw a filled rounded-rectangle helper.
 * Uses native roundRect where available, falls back to manual arc path.
 */
function fillRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    ctx.fill();
}

/** Draw one eye (white sclera + coloured pupil) at canvas coords (cx, cy). */
function drawEye(ctx, cx, cy, pdx, pdy) {
    ctx.fillStyle = COL.eye;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COL.dark;
    ctx.beginPath();
    ctx.arc(cx + pdx, cy + pdy, 2, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw the snake head at canvas position (rx, ry).
 * @param {string} id  – e.g. 'head r', 'dead l'
 */
function drawHead(ctx, rx, ry, id) {
    const dead = id.startsWith('dead');
    const dir  = id.slice(-1);   // 'r' | 'l' | 'u' | 'd'
    const fill = dead ? COL.dead : COL.head;

    // ── Neck arm toward the body segment ────────────────────────────────────
    // Ensures no visual gap between head and body[1] during interpolation.
    ctx.fillStyle = fill;
    if (dir === 'r') ctx.fillRect(rx,       ry + BO, HC,  BW);
    if (dir === 'l') ctx.fillRect(rx + HC,  ry + BO, HC,  BW);
    if (dir === 'u') ctx.fillRect(rx + BO,  ry + HC, BW,  HC);
    if (dir === 'd') ctx.fillRect(rx + BO,  ry,      BW,  HC);

    // ── Main head block (rounded) ────────────────────────────────────────────
    ctx.fillStyle = fill;
    fillRoundRect(ctx, rx + 2, ry + 2, CELL - 4, CELL - 4, 8);

    // ── Eyes (only on live head) ──────────────────────────────────────────────
    if (!dead) {
        // Pupil offset points toward the front of movement
        const PO = 1.5; // pupil offset magnitude
        const eyes = {
            r: [{ x: rx + 29, y: ry + 11, px:  PO, py: 0  },
                { x: rx + 29, y: ry + 27, px:  PO, py: 0  }],
            l: [{ x: rx + 9,  y: ry + 11, px: -PO, py: 0  },
                { x: rx + 9,  y: ry + 27, px: -PO, py: 0  }],
            u: [{ x: rx + 11, y: ry + 9,  px: 0,   py: -PO },
                { x: rx + 27, y: ry + 9,  px: 0,   py: -PO }],
            d: [{ x: rx + 11, y: ry + 29, px: 0,   py:  PO },
                { x: rx + 27, y: ry + 29, px: 0,   py:  PO }],
        };
        for (const e of eyes[dir] ?? []) drawEye(ctx, e.x, e.y, e.px, e.py);

        // ── Subtle shine / highlight ──────────────────────────────────────────
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        fillRoundRect(ctx, rx + 5, ry + 5, 14, 10, 4);
    } else {
        // ── Dead: 𖦹 spiral eyes ───────────────────────────────────────────────
        const eyePos = {
            r: [{ x: rx + 28, y: ry + 12 }, { x: rx + 28, y: ry + 27 }],
            l: [{ x: rx + 10, y: ry + 12 }, { x: rx + 10, y: ry + 27 }],
            u: [{ x: rx + 12, y: ry + 10 }, { x: rx + 27, y: ry + 10 }],
            d: [{ x: rx + 12, y: ry + 28 }, { x: rx + 27, y: ry + 28 }],
        };
        for (const e of eyePos[dir] ?? []) {
            // White sclera
            ctx.fillStyle = COL.eye;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 5.5, 0, Math.PI * 2);
            ctx.fill();
            // 𖦹 spiral character
            ctx.fillStyle = '#7f1d1d';
            ctx.font = 'bold 9px serif';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('𖦹', e.x, e.y + 0.5);
        }
    }
}

/**
 * Draw a straight body segment (body h or body v) at (rx, ry).
 * @param {boolean} horiz
 */
function drawStraight(ctx, rx, ry, horiz) {
    ctx.fillStyle = COL.body;
    if (horiz) ctx.fillRect(rx, ry + BO, CELL, BW);
    else        ctx.fillRect(rx + BO, ry, BW, CELL);
}

/**
 * Draw a corner body segment at (rx, ry).
 * Each corner = two overlapping rectangles forming an L-shape.
 * @param {string} id – 'body tl' | 'body tr' | 'body bl' | 'body br'
 */
function drawCorner(ctx, rx, ry, id) {
    ctx.fillStyle = COL.body;
    switch (id) {
        case 'body tl':   // connects top  ↔ left
            ctx.fillRect(rx + BO, ry,       BW,  ARM);   // vertical arm (up)
            ctx.fillRect(rx,      ry + BO,  ARM, BW);    // horizontal arm (left)
            break;
        case 'body tr':   // connects top  ↔ right
            ctx.fillRect(rx + BO, ry,       BW,  ARM);   // vertical arm (up)
            ctx.fillRect(rx + BO, ry + BO,  ARM, BW);    // horizontal arm (right)
            break;
        case 'body bl':   // connects bottom ↔ left
            ctx.fillRect(rx + BO, ry + BO,  BW,  ARM);   // vertical arm (down)
            ctx.fillRect(rx,      ry + BO,  ARM, BW);    // horizontal arm (left)
            break;
        case 'body br':   // connects bottom ↔ right
            ctx.fillRect(rx + BO, ry + BO,  BW,  ARM);   // vertical arm (down)
            ctx.fillRect(rx + BO, ry + BO,  ARM, BW);    // horizontal arm (right)
            break;
    }
}

/**
 * Draw the tail segment with a rounded cap at its tip.
 * @param {string} id – 'tail r' | 'tail l' | 'tail u' | 'tail d'
 */
function drawTail(ctx, rx, ry, id) {
    ctx.fillStyle = COL.body;
    const dir = id.slice(-1);

    // Strip toward the body (the connected side)
    if (dir === 'r') {
        ctx.fillRect(rx,      ry + BO, ARM, BW);
        // Rounded cap at the right tip
        ctx.beginPath();
        ctx.arc(rx + ARM, ry + HC, BW / 2, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
    } else if (dir === 'l') {
        ctx.fillRect(rx + CELL - ARM, ry + BO, ARM, BW);
        ctx.beginPath();
        ctx.arc(rx + CELL - ARM, ry + HC, BW / 2, Math.PI / 2, 3 * Math.PI / 2);
        ctx.fill();
    } else if (dir === 'd') {
        ctx.fillRect(rx + BO, ry,      BW, ARM);
        ctx.beginPath();
        ctx.arc(rx + HC, ry + ARM, BW / 2, 0, Math.PI);
        ctx.fill();
    } else if (dir === 'u') {
        ctx.fillRect(rx + BO, ry + CELL - ARM, BW, ARM);
        ctx.beginPath();
        ctx.arc(rx + HC, ry + CELL - ARM, BW / 2, Math.PI, 2 * Math.PI);
        ctx.fill();
    }
}

/**
 * Master dispatcher: draw any snake segment at canvas coords (rx, ry)
 * based purely on the sprite ID string.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} rx – canvas x
 * @param {number} ry – canvas y
 * @param {string} id – sprite ID
 */
function drawSegment(ctx, rx, ry, id) {
    if (id === 'body h')    return drawStraight(ctx, rx, ry, true);
    if (id === 'body v')    return drawStraight(ctx, rx, ry, false);
    if (CORNER_IDS.has(id)) return drawCorner(ctx, rx, ry, id);
    if (id.startsWith('head') || id.startsWith('dead')) return drawHead(ctx, rx, ry, id);
    if (id.startsWith('tail')) return drawTail(ctx, rx, ry, id);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @class SnakeNode
 * @brief One segment of the snake (head, body, or tail).
 *
 *   x, y       – current grid position (px, multiples of CELL)
 *   oldx, oldy – position at the previous step (for interpolation)
 *   image      – { id } sprite reference object (NO DOM lookup needed)
 *   prevImage  – sprite reference from the previous step (for corner blending)
 *   direction  – current head direction string (head only; kept on all nodes
 *                so #triggerGameOver can read it without special-casing)
 */
class SnakeNode {
    constructor(game, imageId, x, y) {
        this.game      = game;
        this.x         = x;
        this.y         = y;
        this.oldx      = x;
        this.oldy      = y;
        this.direction = 'Right';
        this.image     = spr(imageId);
        this.prevImage = this.image;
    }

    /**
     * @brief 60-FPS draw with corner-aware blending.
     *
     * Rules:
     *   • current sprite IS a corner  → snap it in immediately (progress 0).
     *   • current sprite is straight, prevImage was a corner → hold corner
     *     until progress 0.5 (segment gliding away from the turning cell).
     *   • everything else → show current sprite.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} progress – 0.0 … 1.0
     */
    draw(ctx, progress = 1) {
        const rx = this.oldx + (this.x - this.oldx) * progress;
        const ry = this.oldy + (this.y - this.oldy) * progress;

        const curIsCorner  = CORNER_IDS.has(this.image.id);
        const prevIsCorner = this.prevImage && CORNER_IDS.has(this.prevImage.id);

        const id = (!curIsCorner && prevIsCorner && progress < 0.5)
            ? this.prevImage.id
            : this.image.id;

        drawSegment(ctx, rx, ry, id);
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @class Snake
 * @brief Manages the ordered list of SnakeNode segments and the collision grid.
 *
 * Movement model (one grid step):
 *   1. Snapshot ALL positions (parallel – no sequential dependency).
 *   2. Commit oldx/oldy + prevImage for ALL nodes simultaneously.
 *   3. Move head by (dx, dy); each body/tail takes its predecessor's old cell.
 *   4. Reassign ALL sprites purely from geometry (no direction strings for body).
 *   5. Update the collision grid.
 */
export class Snake {
    constructor(game) {
        this.game = game;
        const y0  = 6 * CELL;
        this.snake = [
            new SnakeNode(game, 'head r', 2 * CELL, y0),
            new SnakeNode(game, 'body h',     CELL,  y0),
            new SnakeNode(game, 'tail l',         0, y0),
        ];

        // 15×15 collision grid; 0 = empty, otherwise holds the occupant
        this.grid = Array.from({ length: 15 }, () => Array(15).fill(0));
        this.grid[6][0] = this.snake[2];
        this.grid[6][1] = this.snake[1];
        this.grid[6][2] = this.snake[0];
    }

    // ── Public API ────────────────────────────────────────────────────────────

    draw(ctx, progress = 1) {
        for (const node of this.snake) node.draw(ctx, progress);
    }

    update(dx, dy, direction) {
        const n    = this.snake.length;
        const snap = this.snake.map(s => ({ x: s.x, y: s.y }));

        for (const node of this.snake) {
            node.oldx      = node.x;
            node.oldy      = node.y;
            node.prevImage = node.image;
        }

        this.snake[0].x        += dx;
        this.snake[0].y        += dy;
        this.snake[0].direction = direction;

        for (let i = 1; i < n; i++) {
            this.snake[i].x = snap[i - 1].x;
            this.snake[i].y = snap[i - 1].y;
        }

        this.#assignSprites(direction);
        this.#updateGrid();
    }

    addBodyElement(game) {
        const tail = this.snake[this.snake.length - 1];
        const prev = this.snake[this.snake.length - 2];

        const newX    = tail.x + (tail.x - prev.x);
        const newY    = tail.y + (tail.y - prev.y);
        const newNode = new SnakeNode(game, 'tail l', newX, newY);
        newNode.oldx  = newX;
        newNode.oldy  = newY;
        newNode.prevImage = newNode.image;

        this.snake.push(newNode);
        this.#assignSprites(this.snake[0].direction);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    #assignSprites(direction) {
        const n    = this.snake.length;
        const head = this.snake[0];

        // Head (preserve dead state if already set)
        if (head.image.id.startsWith('dead')) {
            head.image = spr('dead ' + direction[0].toLowerCase());
        } else {
            head.image = spr('head ' + direction[0].toLowerCase());
        }

        // Body segments
        for (let i = 1; i < n - 1; i++) {
            this.snake[i].image = spr(bodySpriteId(this.snake[i-1], this.snake[i], this.snake[i+1]));
        }

        // Tail
        if (n > 1) {
            const tail = this.snake[n - 1];
            const prev = this.snake[n - 2];
            tail.image = spr(tailSpriteId(tail, prev));
        }
    }

    #updateGrid() {
        for (let i = 0; i < this.snake.length; i++) {
            const node = this.snake[i];

            const oi = node.oldy / CELL, oj = node.oldx / CELL;
            if (oi >= 0 && oi < 15 && oj >= 0 && oj < 15)
                this.grid[oi][oj] = 0;

            const ni = node.y / CELL, nj = node.x / CELL;
            const hitWall = ni < 0 || nj < 0 || ni > 14 || nj > 14;
            const hitSelf = !hitWall && i === 0 &&
                            this.grid[ni][nj] !== 0 &&
                            !(this.grid[ni][nj] instanceof Apple);

            if (hitWall || hitSelf) {
                this.#triggerGameOver(hitWall);
                return;
            }
            this.grid[ni][nj] = node;
        }
    }

    /**
     * @brief Show the dead-head sprite and trigger game over.
     *        If hitWall=true, sets up a bounce-back animation (head slides
     *        from the wall edge back to the last safe cell with 𖦹 eyes).
     *        If hitSelf=false (self-collision), snaps immediately.
     * @param {boolean} hitWall
     */
    #triggerGameOver(hitWall = false) {
        const head = this.snake[0];
        const dir  = head.direction[0].toLowerCase();
        head.image = spr('dead ' + dir);

        if (hitWall) {
            // Clamp attempted position to the canvas boundary so the head
            // appears just at the wall edge before bouncing back.
            const clampedX = Math.max(0, Math.min(14 * CELL, head.x));
            const clampedY = Math.max(0, Math.min(14 * CELL, head.y));
            const safeX = head.oldx, safeY = head.oldy;

            // Re-purpose old/current so draw() interpolates wall → safe
            // progress=0 ➜ at wall edge, progress=1 ➜ back at safe cell
            head.oldx = clampedX;
            head.oldy = clampedY;
            head.x    = safeX;
            head.y    = safeY;

            this.game.bounceBack     = true;
            this.game.bounceStart    = performance.now();
            this.game.bounceDuration = 500;   // ms for the full bounce animation
        } else {
            // Self-collision: snap head in place immediately
            head.x = head.oldx;
            head.y = head.oldy;
            head.draw(this.game.context, 1);
            this.game.bounceBack = false;
        }

        this.game.gameOver = true;
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @class Apple
 * @brief Consumable fruit that spawns on a random empty grid cell.
 * Still uses a DOM <img> for its sprite (kept as-is).
 */
export class Apple {
    constructor(game) {
        this.game  = game;
        this.x     = 0;
        this.y     = 0;
        this.image = document.getElementById('apple');
        this.checkAppleCoordinates();
    }

    checkAppleCoordinates() {
        const grid = this.game.player.grid;
        const ci   = this.y / CELL, cj = this.x / CELL;
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

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, CELL, CELL);
    }
}