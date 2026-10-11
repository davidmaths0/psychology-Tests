/**
 * 2048.js
 *
 * Independent implementation of the 2048 sliding-tile puzzle, written for
 * this site. The game was created by Gabriele Cirulli (MIT License) and is
 * itself inspired by 1024 and Threes; game rules aren't protected by
 * copyright, and no original code was used here.
 *
 * Features: arrow keys / WASD and swipe controls, animated slides and
 * merges, score + best score, "keep going" after reaching 2048, and the
 * board is saved in localStorage so a reload resumes the game.
 * There is deliberately no timer — it's a calm, plan-ahead game.
 *
 * Markup/CSS: games/2048.html and the g2048- section of css/games.css.
 * Each tile is a positioned wrapper (.g2048-tile, moved via the --r / --c
 * CSS variables) holding an inner box (.g2048-tile-inner) for color/number.
 */

(function () {

    const SIZE = 4;
    const START_TILES = 2;
    const WIN_VALUE = 2048;
    const SLIDE_MS = 110;       // keep in sync with the transition in games.css
    const SWIPE_MIN_PX = 24;    // shorter drags are ignored
    const STATE_KEY = "game-2048:state";
    const BEST_KEY = "game-2048:best";

    // Direction index -> row/column step: 0 up, 1 right, 2 down, 3 left
    const DIRECTIONS = [
        { r: -1, c: 0 },
        { r: 0, c: 1 },
        { r: 1, c: 0 },
        { r: 0, c: -1 }
    ];

    const KEY_TO_DIRECTION = {
        ArrowUp: 0, w: 0, W: 0,
        ArrowRight: 1, d: 1, D: 1,
        ArrowDown: 2, s: 2, S: 2,
        ArrowLeft: 3, a: 3, A: 3
    };

    // ---- Game state ------------------------------------------------------
    let grid = [];          // SIZE x SIZE matrix of tile objects (or null)
    let nextTileId = 1;
    let score = 0;
    let best = 0;
    let won = false;        // a 2048 tile has been created
    let keepPlaying = false;
    let over = false;
    let openOverlay = null; // the modal currently shown, if any
    let lastFocused = null;

    // ---- DOM references (resolved on DOMContentLoaded) ---------------------
    let board, gridLayer, tilesLayer, scoreEl, bestEl, scoreBox,
        winOverlay, overOverlay, overScoreEl, overBestEl;

    // ======================================================================
    // Small helpers
    // ======================================================================

    function range(n) {
        return Array.from({ length: n }, (_, i) => i);
    }

    function inBounds(r, c) {
        return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
    }

    function emptyGrid() {
        return range(SIZE).map(() => range(SIZE).map(() => null));
    }

    function forEachTile(callback) {
        grid.forEach((row) => row.forEach((tile) => {
            if (tile) callback(tile);
        }));
    }

    // ======================================================================
    // Tiles (DOM)
    // ======================================================================

    function setPosition(tile) {
        tile.el.style.setProperty("--r", tile.row);
        tile.el.style.setProperty("--c", tile.col);
    }

    function renderValue(tile) {
        const cls = tile.value > 4096 ? "super" : tile.value; // 8192+ share one color
        tile.inner.className = `g2048-tile-inner g2048-v-${cls}`;
        tile.inner.dataset.digits = String(tile.value).length;
        tile.inner.textContent = tile.value;
    }

    /**
     * Creates a tile and its DOM element.
     * kind: "new" (spawn animation), "merged" (pop animation) or null.
     */
    function createTile(value, row, col, kind) {
        const tile = {
            id: nextTileId++,
            value,
            row,
            col,
            el: document.createElement("div"),
            inner: document.createElement("div")
        };

        tile.el.className = "g2048-tile" + (kind ? ` g2048-tile-${kind}` : "");
        setPosition(tile);
        renderValue(tile);
        tile.el.appendChild(tile.inner);
        tilesLayer.appendChild(tile.el);

        return tile;
    }

    function addRandomTile(animate = true) {
        const empty = [];
        grid.forEach((row, r) => row.forEach((tile, c) => {
            if (!tile) empty.push({ r, c });
        }));
        if (empty.length === 0) return;

        const spot = empty[Math.floor(Math.random() * empty.length)];
        const value = Math.random() < 0.9 ? 2 : 4;

        grid[spot.r][spot.c] = createTile(value, spot.r, spot.c, animate ? "new" : null);
    }

    function clearTiles() {
        tilesLayer.innerHTML = "";
    }

    // ======================================================================
    // Score
    // ======================================================================

    function renderScores() {
        scoreEl.textContent = score;
        bestEl.textContent = best;
    }

    function addToScore(points) {
        score += points;

        if (score > best) {
            best = score;
            saveBest();
        }

        renderScores();

        if (points > 0) {
            const popup = document.createElement("span");
            popup.className = "g2048-score-add";
            popup.textContent = `+${points}`;
            scoreBox.appendChild(popup);
            window.setTimeout(() => popup.remove(), 650);
        }
    }

    // ======================================================================
    // Persistence (localStorage). Never throws: if storage is unavailable
    // the game still works, it just won't remember anything.
    // ======================================================================

    function loadBest() {
        try {
            const value = Number(localStorage.getItem(BEST_KEY));
            return Number.isFinite(value) && value > 0 ? value : 0;
        } catch (error) {
            return 0;
        }
    }

    function saveBest() {
        try {
            localStorage.setItem(BEST_KEY, String(best));
        } catch (error) { /* ignore */ }
    }

    function saveState() {
        try {
            if (over) {
                localStorage.removeItem(STATE_KEY);
                return;
            }

            const tiles = [];
            forEachTile((tile) => tiles.push({ v: tile.value, r: tile.row, c: tile.col }));

            localStorage.setItem(STATE_KEY, JSON.stringify({ tiles, score, won, keepPlaying }));
        } catch (error) { /* ignore */ }
    }

    /** Returns a valid saved state, or null if there's none / it's corrupted. */
    function loadState() {
        try {
            const raw = localStorage.getItem(STATE_KEY);
            if (!raw) return null;

            const state = JSON.parse(raw);
            if (!state || !Array.isArray(state.tiles) || state.tiles.length === 0) return null;
            if (state.tiles.length > SIZE * SIZE) return null;
            if (!Number.isFinite(state.score) || state.score < 0) return null;

            const taken = new Set();
            for (const t of state.tiles) {
                const validValue = Number.isInteger(t.v) && t.v >= 2 && (t.v & (t.v - 1)) === 0;
                if (!validValue || !Number.isInteger(t.r) || !Number.isInteger(t.c) || !inBounds(t.r, t.c)) {
                    return null;
                }
                const key = `${t.r},${t.c}`;
                if (taken.has(key)) return null;
                taken.add(key);
            }

            return state;
        } catch (error) {
            return null;
        }
    }

    // ======================================================================
    // Game flow
    // ======================================================================

    function canMove() {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const tile = grid[r][c];
                if (!tile) return true;

                const right = c + 1 < SIZE ? grid[r][c + 1] : null;
                const below = r + 1 < SIZE ? grid[r + 1][c] : null;

                if ((right && right.value === tile.value) || (below && below.value === tile.value)) {
                    return true;
                }
            }
        }
        return false;
    }

    function newGame() {
        clearTiles();
        grid = emptyGrid();
        score = 0;
        won = false;
        keepPlaying = false;
        over = false;

        closeOverlays();
        renderScores();

        for (let i = 0; i < START_TILES; i++) addRandomTile(false);

        saveState();
    }

    function restoreGame(state) {
        clearTiles();
        grid = emptyGrid();
        score = state.score;
        won = Boolean(state.won);
        keepPlaying = Boolean(state.keepPlaying);
        over = false;

        state.tiles.forEach((t) => {
            grid[t.r][t.c] = createTile(t.v, t.r, t.c, null);
        });

        renderScores();

        // A saved board with no moves left isn't resumable
        if (!canMove()) {
            newGame();
            return;
        }

        if (won && !keepPlaying) showOverlay(winOverlay);
    }

    /**
     * Slides every tile in the given direction, merging equal neighbors
     * (each tile merges at most once per move), then spawns a new tile.
     */
    function move(direction) {
        if (over || openOverlay) return;

        const vector = DIRECTIONS[direction];

        // Visit tiles starting from the edge they're sliding toward
        const rows = range(SIZE);
        const cols = range(SIZE);
        if (vector.r === 1) rows.reverse();
        if (vector.c === 1) cols.reverse();

        const mergedIds = new Set();
        const consumed = [];
        let moved = false;
        let gained = 0;
        let createdWinTile = false;

        rows.forEach((r) => cols.forEach((c) => {
            const tile = grid[r][c];
            if (!tile) return;

            // Find the farthest empty cell in this direction
            let destR = r;
            let destC = c;
            let nextR = r + vector.r;
            let nextC = c + vector.c;

            while (inBounds(nextR, nextC) && !grid[nextR][nextC]) {
                destR = nextR;
                destC = nextC;
                nextR += vector.r;
                nextC += vector.c;
            }

            const blocker = inBounds(nextR, nextC) ? grid[nextR][nextC] : null;

            if (blocker && blocker.value === tile.value && !mergedIds.has(blocker.id)) {
                // Merge: both tiles slide into the blocker's cell and are replaced
                // by a single tile of double value.
                grid[r][c] = null;
                tile.row = blocker.row;
                tile.col = blocker.col;
                setPosition(tile);

                const merged = createTile(tile.value * 2, blocker.row, blocker.col, "merged");
                grid[blocker.row][blocker.col] = merged;
                mergedIds.add(merged.id);

                consumed.push(tile, blocker);
                gained += merged.value;
                moved = true;

                if (merged.value === WIN_VALUE) createdWinTile = true;
            } else if (destR !== r || destC !== c) {
                grid[r][c] = null;
                grid[destR][destC] = tile;
                tile.row = destR;
                tile.col = destC;
                setPosition(tile);
                moved = true;
            }
        }));

        if (!moved) return; // nothing changed: no spawn, no score

        // The two source tiles of each merge are removed once they've slid in
        window.setTimeout(() => consumed.forEach((tile) => tile.el.remove()), SLIDE_MS + 20);

        if (createdWinTile && !keepPlaying) won = true;

        addToScore(gained);
        addRandomTile(true);

        if (!canMove()) over = true;

        saveState();

        if (won && !keepPlaying) {
            window.setTimeout(() => showOverlay(winOverlay), 350);
        } else if (over) {
            window.setTimeout(showGameOver, 350);
        }
    }

    // ======================================================================
    // Modals
    // ======================================================================

    function showOverlay(overlay) {
        window.clearTimeout(overlay._hideTimer);
        lastFocused = document.activeElement;

        overlay.classList.remove("hidden");
        window.requestAnimationFrame(() => {
            overlay.classList.add("visible");
            const primary = overlay.querySelector(".quiz-btn-primary");
            if (primary) primary.focus();
        });

        openOverlay = overlay;
    }

    function hideOverlay(overlay) {
        overlay.classList.remove("visible");
        overlay._hideTimer = window.setTimeout(() => overlay.classList.add("hidden"), 250);

        if (openOverlay === overlay) {
            openOverlay = null;
            if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
        }
    }

    function closeOverlays() {
        [winOverlay, overOverlay].forEach((overlay) => {
            if (!overlay.classList.contains("hidden")) hideOverlay(overlay);
        });
    }

    function showGameOver() {
        overScoreEl.textContent = score;
        overBestEl.textContent = best;
        showOverlay(overOverlay);
    }

    function keepGoing() {
        keepPlaying = true;
        hideOverlay(winOverlay);
        saveState();

        // Reaching 2048 on a completely stuck board: go straight to game over
        if (over) window.setTimeout(showGameOver, 300);
    }

    // ======================================================================
    // Input
    // ======================================================================

    function onKeyDown(event) {
        if (event.key === "Escape" && openOverlay) {
            if (openOverlay === winOverlay) keepGoing();
            else hideOverlay(openOverlay);
            return;
        }

        if (openOverlay) return;
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

        const direction = KEY_TO_DIRECTION[event.key];
        if (direction === undefined) return;

        event.preventDefault(); // keep arrow keys from scrolling the page
        move(direction);
    }

    function bindSwipe() {
        let tracking = false;
        let startX = 0;
        let startY = 0;

        board.addEventListener("pointerdown", (event) => {
            tracking = true;
            startX = event.clientX;
            startY = event.clientY;

            try {
                board.setPointerCapture(event.pointerId);
            } catch (error) { /* capture isn't essential */ }
        });

        board.addEventListener("pointerup", (event) => {
            if (!tracking) return;
            tracking = false;

            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) return;

            if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : 3);
            else move(dy > 0 ? 2 : 0);
        });

        board.addEventListener("pointercancel", () => { tracking = false; });
    }

    // ======================================================================
    // Init
    // ======================================================================

    document.addEventListener("DOMContentLoaded", () => {
        board = document.getElementById("g2048-board");
        if (!board) return; // not on the 2048 page

        gridLayer = document.getElementById("g2048-grid");
        tilesLayer = document.getElementById("g2048-tiles");
        scoreEl = document.getElementById("g2048-score");
        bestEl = document.getElementById("g2048-best");
        scoreBox = document.getElementById("g2048-score-box");
        winOverlay = document.getElementById("g2048-win");
        overOverlay = document.getElementById("g2048-over");
        overScoreEl = document.getElementById("g2048-over-score");
        overBestEl = document.getElementById("g2048-over-best");

        // Decorative background cells
        for (let i = 0; i < SIZE * SIZE; i++) {
            const cell = document.createElement("div");
            cell.className = "g2048-cell";
            gridLayer.appendChild(cell);
        }

        best = loadBest();

        const saved = loadState();
        if (saved) restoreGame(saved);
        else newGame();

        document.addEventListener("keydown", onKeyDown);
        bindSwipe();

        document.getElementById("g2048-new").addEventListener("click", newGame);
        document.getElementById("g2048-keep").addEventListener("click", keepGoing);
        document.getElementById("g2048-win-new").addEventListener("click", newGame);
        document.getElementById("g2048-over-new").addEventListener("click", newGame);
    });

})();
