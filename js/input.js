/**
 * Input module - handles mouse, touch, and keyboard events.
 * Uses event delegation on the board container for performance.
 */
MS.Input = (function() {
    'use strict';

    var leftDown = false;
    var rightDown = false;
    var pressedCell = null;
    var chordPressed = [];
    var gameActive = true;

    var onReveal = null;
    var onFlag = null;
    var onChord = null;
    var onRestart = null;

    // Touch handling state
    var touchStartTime = 0;
    var touchTimer = null;
    var touchMoved = false;
    var touchStartX = 0;
    var touchStartY = 0;
    var flagMode = false;
    var LONG_PRESS_MS = 500;
    var MOVE_THRESHOLD = 10;

    function init() {
        var board = document.querySelector('.board');
        var smiley = document.querySelector('.smiley-btn');

        // Mouse events
        board.addEventListener('mousedown', handleMouseDown);
        board.addEventListener('mouseup', handleMouseUp);
        board.addEventListener('mouseleave', handleMouseLeave);
        board.addEventListener('contextmenu', function(e) { e.preventDefault(); });

        // Touch events
        board.addEventListener('touchstart', handleTouchStart, { passive: false });
        board.addEventListener('touchmove', handleTouchMove, { passive: false });
        board.addEventListener('touchend', handleTouchEnd, { passive: false });
        board.addEventListener('touchcancel', handleTouchCancel, { passive: false });

        smiley.addEventListener('click', function() {
            if (onRestart) onRestart();
        });

        // Create flag mode button for touch devices
        initFlagModeButton();
    }

    function handleMouseDown(e) {
        if (!gameActive) return;
        var cell = getCellFromEvent(e);
        if (!cell) return;

        if (e.button === 0) leftDown = true;
        if (e.button === 2) rightDown = true;
        if (e.button === 1) {
            e.preventDefault();
            showChordPressed(cell.row, cell.col);
            MS.Renderer.setSmiley('surprised');
            return;
        }

        if (leftDown && rightDown) {
            showChordPressed(cell.row, cell.col);
            MS.Renderer.setSmiley('surprised');
            return;
        }

        if (e.button === 0 && !rightDown) {
            showPressed(cell.row, cell.col);
            MS.Renderer.setSmiley('surprised');
        }
    }

    function handleMouseUp(e) {
        if (!gameActive) {
            leftDown = false;
            rightDown = false;
            return;
        }

        var cell = getCellFromEvent(e);

        if (e.button === 1) {
            if (cell && onChord) onChord(cell.row, cell.col);
            clearPressed();
            MS.Renderer.setSmiley('normal');
            return;
        }

        if (leftDown && rightDown) {
            if (cell && onChord) onChord(cell.row, cell.col);
            clearPressed();
            leftDown = false;
            rightDown = false;
            MS.Renderer.setSmiley('normal');
            return;
        }

        if (e.button === 2 && !leftDown) {
            if (cell && onFlag) onFlag(cell.row, cell.col);
        }

        if (e.button === 0 && !rightDown) {
            if (cell && onReveal) onReveal(cell.row, cell.col);
            MS.Renderer.setSmiley('normal');
        }

        clearPressed();
        if (e.button === 0) leftDown = false;
        if (e.button === 2) rightDown = false;
    }

    function handleMouseLeave() {
        clearPressed();
        if (!leftDown && !rightDown) {
            MS.Renderer.setSmiley('normal');
        }
    }

    function getCellFromEvent(e) {
        var el = e.target.closest('.cell');
        if (!el) return null;
        return {
            row: parseInt(el.dataset.row, 10),
            col: parseInt(el.dataset.col, 10),
            el: el
        };
    }

    function showPressed(row, col) {
        clearPressed();
        var el = MS.Renderer.getCellElement(row, col);
        if (el && !el.classList.contains('revealed') && !el.classList.contains('flagged')) {
            el.classList.add('pressed');
            pressedCell = { row: row, col: col };
        }
    }

    function showChordPressed(row, col) {
        clearPressed();
        var directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        var rows = MS.Engine.getRows();
        var cols = MS.Engine.getCols();

        for (var i = 0; i < directions.length; i++) {
            var nr = row + directions[i][0];
            var nc = col + directions[i][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

            var el = MS.Renderer.getCellElement(nr, nc);
            if (el && !el.classList.contains('revealed') && !el.classList.contains('flagged')) {
                el.classList.add('pressed');
                chordPressed.push({ row: nr, col: nc });
            }
        }

        var centerEl = MS.Renderer.getCellElement(row, col);
        if (centerEl && !centerEl.classList.contains('revealed') && !centerEl.classList.contains('flagged')) {
            centerEl.classList.add('pressed');
            chordPressed.push({ row: row, col: col });
        }
    }

    function clearPressed() {
        if (pressedCell) {
            var el = MS.Renderer.getCellElement(pressedCell.row, pressedCell.col);
            if (el) el.classList.remove('pressed');
            pressedCell = null;
        }
        for (var i = 0; i < chordPressed.length; i++) {
            var cel = MS.Renderer.getCellElement(chordPressed[i].row, chordPressed[i].col);
            if (cel) cel.classList.remove('pressed');
        }
        chordPressed = [];
    }

    // --- Touch event handlers ---

    function handleTouchStart(e) {
        if (!gameActive) return;
        e.preventDefault();

        var touch = e.touches[0];
        var cell = getCellFromTouch(touch);
        if (!cell) return;

        touchStartTime = Date.now();
        touchMoved = false;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        // Show pressed state immediately
        showPressed(cell.row, cell.col);
        MS.Renderer.setSmiley('surprised');

        // Start long-press timer for flag
        clearTimeout(touchTimer);
        touchTimer = setTimeout(function() {
            if (!touchMoved && gameActive) {
                // Long press = flag (regardless of flagMode)
                if (onFlag) onFlag(cell.row, cell.col);
                clearPressed();
                MS.Renderer.setSmiley('normal');
                touchTimer = null;
            }
        }, LONG_PRESS_MS);
    }

    function handleTouchMove(e) {
        if (!gameActive) return;
        e.preventDefault();

        var touch = e.touches[0];
        var dx = touch.clientX - touchStartX;
        var dy = touch.clientY - touchStartY;

        if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
            touchMoved = true;
            clearTimeout(touchTimer);
            touchTimer = null;
            clearPressed();
            MS.Renderer.setSmiley('normal');
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();

        if (!gameActive) {
            clearTimeout(touchTimer);
            touchTimer = null;
            return;
        }

        // If long-press timer already fired, do nothing
        if (touchTimer === null && !touchMoved) {
            clearPressed();
            MS.Renderer.setSmiley('normal');
            return;
        }

        clearTimeout(touchTimer);
        touchTimer = null;

        if (touchMoved) {
            clearPressed();
            MS.Renderer.setSmiley('normal');
            return;
        }

        // Short tap - get cell from last known position
        var touch = e.changedTouches[0];
        var cell = getCellFromTouch(touch);
        if (!cell) {
            clearPressed();
            MS.Renderer.setSmiley('normal');
            return;
        }

        var elapsed = Date.now() - touchStartTime;
        if (elapsed < LONG_PRESS_MS) {
            if (flagMode) {
                if (onFlag) onFlag(cell.row, cell.col);
            } else {
                if (onReveal) onReveal(cell.row, cell.col);
            }
        }

        clearPressed();
        MS.Renderer.setSmiley('normal');
    }

    function handleTouchCancel(e) {
        e.preventDefault();
        clearTimeout(touchTimer);
        touchTimer = null;
        touchMoved = false;
        clearPressed();
        MS.Renderer.setSmiley('normal');
    }

    function getCellFromTouch(touch) {
        var el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!el) return null;
        var cellEl = el.closest('.cell');
        if (!cellEl) return null;
        return {
            row: parseInt(cellEl.dataset.row, 10),
            col: parseInt(cellEl.dataset.col, 10),
            el: cellEl
        };
    }

    // --- Flag mode toggle ---

    function initFlagModeButton() {
        var statusBar = document.querySelector('.status-bar');
        if (!statusBar) return;

        // Only create if not already present
        var existing = statusBar.querySelector('.flag-mode-btn');
        if (!existing) {
            var btn = document.createElement('button');
            btn.className = 'flag-mode-btn';
            btn.textContent = '\u{1F6A9}';
            btn.title = 'Toggle flag mode';
            statusBar.appendChild(btn);
        }

        var flagBtn = statusBar.querySelector('.flag-mode-btn');
        flagBtn.addEventListener('click', function(e) {
            e.preventDefault();
            flagMode = !flagMode;
            flagBtn.classList.toggle('active', flagMode);
        });
    }

    function setGameActive(active) { gameActive = active; }
    function setOnReveal(fn) { onReveal = fn; }
    function setOnFlag(fn) { onFlag = fn; }
    function setOnChord(fn) { onChord = fn; }
    function setOnRestart(fn) { onRestart = fn; }

    return {
        init: init,
        setGameActive: setGameActive,
        setOnReveal: setOnReveal,
        setOnFlag: setOnFlag,
        setOnChord: setOnChord,
        setOnRestart: setOnRestart
    };
})();
