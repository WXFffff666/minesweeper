/**
 * Renderer module - handles all DOM rendering, board creation, cell updates,
 * LED displays, and smiley face state.
 */
MS.Renderer = (function() {
    'use strict';

    var boardEl = document.querySelector('.board');
    var mineCounterEl = document.querySelector('.mine-counter');
    var timerEl = document.querySelector('.timer');
    var smileyBtn = document.querySelector('.smiley-btn');
    var currentCols = 0;

    function createBoard(rows, cols) {
        currentCols = cols;
        boardEl.innerHTML = '';
        boardEl.style.setProperty('--cols', cols);

        var fragment = document.createDocumentFragment();
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                fragment.appendChild(cell);
            }
        }
        boardEl.appendChild(fragment);
    }

    function getCellElement(row, col) {
        return boardEl.children[row * currentCols + col];
    }

    function updateCell(row, col) {
        var el = getCellElement(row, col);
        if (!el) return;

        var boardState = MS.Engine.getBoard();
        var cell = boardState[row][col];

        el.className = 'cell';
        el.textContent = '';
        el.removeAttribute('data-number');

        if (cell.revealed) {
            el.classList.add('revealed');
            if (cell.mine) {
                el.textContent = '\u{1F4A3}';
            } else if (cell.adjacentMines > 0) {
                el.textContent = cell.adjacentMines;
                el.dataset.number = cell.adjacentMines;
            }
        } else if (cell.flagged) {
            el.classList.add('flagged');
            el.textContent = '\u{1F6A9}';
        }
    }

    function updateCells(cells) {
        for (var i = 0; i < cells.length; i++) {
            updateCell(cells[i].row, cells[i].col);
        }
    }

    function revealResult(result) {
        if (!result) return;

        switch (result.type) {
            case 'reveal':
                updateCells(result.cells);
                break;
            case 'win':
                updateCells(result.cells);
                setSmiley('won');
                break;
            case 'lose':
                showGameOver(result.cell, result.allMines);
                setSmiley('lost');
                break;
            case 'flag':
                updateCell(result.cell.row, result.cell.col);
                updateMineCounter(MS.Engine.getMines() - MS.Engine.getFlagCount());
                break;
            case 'chord':
                updateCells(result.cells);
                break;
        }
    }

    function showGameOver(explodedCell, allMines) {
        for (var i = 0; i < allMines.length; i++) {
            var m = allMines[i];
            var el = getCellElement(m.row, m.col);
            if (!el) continue;

            el.className = 'cell';
            el.removeAttribute('data-number');

            if (m.type === 'exploded') {
                el.classList.add('exploded');
                el.textContent = '\u{1F4A3}';
            } else if (m.type === 'mine') {
                el.classList.add('mine');
                el.textContent = '\u{1F4A3}';
            } else if (m.type === 'wrong-flag') {
                el.classList.add('wrong-flag');
                el.textContent = '\u{1F6A9}';
            }
        }
    }

    function updateLED(element, value) {
        var digits = element.querySelectorAll('.digit');
        var str;

        if (value < 0) {
            var abs = Math.min(Math.abs(value), 99);
            str = '-' + (abs < 10 ? '0' + abs : '' + abs);
        } else {
            value = Math.min(value, 999);
            if (value < 10) {
                str = '00' + value;
            } else if (value < 100) {
                str = '0' + value;
            } else {
                str = '' + value;
            }
        }

        for (var i = 0; i < digits.length && i < str.length; i++) {
            digits[i].textContent = str[i];
        }
    }

    function updateMineCounter(remaining) {
        updateLED(mineCounterEl, remaining);
    }

    function updateTimer(seconds) {
        updateLED(timerEl, seconds);
    }

    function setSmiley(state) {
        switch (state) {
            case 'normal':
                smileyBtn.textContent = '\u{1F642}';
                break;
            case 'surprised':
                smileyBtn.textContent = '\u{1F62E}';
                break;
            case 'won':
                smileyBtn.textContent = '\u{1F60E}';
                break;
            case 'lost':
                smileyBtn.textContent = '\u{1F635}';
                break;
        }
    }

    return {
        createBoard: createBoard,
        getCellElement: getCellElement,
        updateCell: updateCell,
        updateCells: updateCells,
        revealResult: revealResult,
        showGameOver: showGameOver,
        updateLED: updateLED,
        updateMineCounter: updateMineCounter,
        updateTimer: updateTimer,
        setSmiley: setSmiley
    };
})();
