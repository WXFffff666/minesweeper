/**
 * Game engine module - handles board generation, mine placement, and game logic.
 * Pure logic layer: NO DOM, NO events, NO rendering.
 */
MS.Engine = (function() {
    'use strict';

    var board = null;
    var rows = 0, cols = 0, totalMines = 0;
    var state = 'idle'; // idle | playing | won | lost
    var revealedCount = 0;
    var flagCount = 0;
    var firstClick = true;

    // --- Helpers ---

    function createCell() {
        return {
            mine: false,
            revealed: false,
            flagged: false,
            adjacentMines: 0
        };
    }

    function inBounds(r, c) {
        return r >= 0 && r < rows && c >= 0 && c < cols;
    }

    function getNeighbors(r, c) {
        var neighbors = [];
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = r + dr;
                var nc = c + dc;
                if (inBounds(nr, nc)) {
                    neighbors.push({ row: nr, col: nc });
                }
            }
        }
        return neighbors;
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function placeMines(safeRow, safeCol) {
        var positions = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                // Exclude 3x3 area around safe cell
                if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) {
                    continue;
                }
                positions.push({ row: r, col: c });
            }
        }

        shuffle(positions);

        var minesToPlace = Math.min(totalMines, positions.length);
        for (var i = 0; i < minesToPlace; i++) {
            board[positions[i].row][positions[i].col].mine = true;
        }

        // Calculate adjacentMines for all cells
        for (var r2 = 0; r2 < rows; r2++) {
            for (var c2 = 0; c2 < cols; c2++) {
                if (board[r2][c2].mine) continue;
                var count = 0;
                var neighbors = getNeighbors(r2, c2);
                for (var n = 0; n < neighbors.length; n++) {
                    if (board[neighbors[n].row][neighbors[n].col].mine) {
                        count++;
                    }
                }
                board[r2][c2].adjacentMines = count;
            }
        }
    }

    function floodFill(startRow, startCol) {
        var queue = [];
        var revealed = [];

        queue.push({ row: startRow, col: startCol });

        while (queue.length > 0) {
            var cell = queue.shift();
            var r = cell.row;
            var c = cell.col;
            var boardCell = board[r][c];

            if (boardCell.revealed || boardCell.flagged) continue;

            boardCell.revealed = true;
            revealedCount++;
            revealed.push({ row: r, col: c });

            if (boardCell.adjacentMines === 0) {
                var neighbors = getNeighbors(r, c);
                for (var i = 0; i < neighbors.length; i++) {
                    var nr = neighbors[i].row;
                    var nc = neighbors[i].col;
                    if (!board[nr][nc].revealed && !board[nr][nc].flagged) {
                        queue.push({ row: nr, col: nc });
                    }
                }
            }
        }

        return revealed;
    }

    function checkWin() {
        return revealedCount === (rows * cols - totalMines);
    }

    // --- Public API ---

    function newGame(r, c, m) {
        rows = r;
        cols = c;
        totalMines = m;
        state = 'idle';
        revealedCount = 0;
        flagCount = 0;
        firstClick = true;

        board = [];
        for (var i = 0; i < rows; i++) {
            board[i] = [];
            for (var j = 0; j < cols; j++) {
                board[i][j] = createCell();
            }
        }
    }

    function reveal(row, col) {
        if (state === 'won' || state === 'lost') return null;
        if (!inBounds(row, col)) return null;

        var cell = board[row][col];
        if (cell.revealed || cell.flagged) return null;

        if (firstClick) {
            firstClick = false;
            state = 'playing';
            placeMines(row, col);
        }

        // Hit a mine
        if (cell.mine) {
            state = 'lost';
            cell.revealed = true;
            return {
                type: 'lose',
                cell: { row: row, col: col },
                allMines: revealAllMines(row, col)
            };
        }

        // Flood fill or single reveal
        var cells = floodFill(row, col);

        // Check win
        if (checkWin()) {
            state = 'won';
            return { type: 'win', cells: cells };
        }

        return { type: 'reveal', cells: cells };
    }

    function toggleFlag(row, col) {
        if (state === 'won' || state === 'lost') return null;
        if (!inBounds(row, col)) return null;

        var cell = board[row][col];
        if (cell.revealed) return null;

        if (firstClick && state === 'idle') {
            state = 'playing';
        }

        cell.flagged = !cell.flagged;
        if (cell.flagged) {
            flagCount++;
        } else {
            flagCount--;
        }

        return { type: 'flag', cell: { row: row, col: col, flagged: cell.flagged } };
    }

    function chord(row, col) {
        if (state === 'won' || state === 'lost') return null;
        if (!inBounds(row, col)) return null;

        var cell = board[row][col];
        if (!cell.revealed || cell.adjacentMines === 0) return null;

        // Count adjacent flags
        var neighbors = getNeighbors(row, col);
        var adjacentFlags = 0;
        for (var i = 0; i < neighbors.length; i++) {
            if (board[neighbors[i].row][neighbors[i].col].flagged) {
                adjacentFlags++;
            }
        }

        if (adjacentFlags !== cell.adjacentMines) return null;

        // Reveal all adjacent unrevealed unflagged cells
        var revealedCells = [];
        var hitMine = false;
        var mineCell = null;

        for (var j = 0; j < neighbors.length; j++) {
            var nr = neighbors[j].row;
            var nc = neighbors[j].col;
            var neighbor = board[nr][nc];

            if (neighbor.revealed || neighbor.flagged) continue;

            if (neighbor.mine) {
                hitMine = true;
                mineCell = { row: nr, col: nc };
                neighbor.revealed = true;
                break;
            }

            var filled = floodFill(nr, nc);
            for (var k = 0; k < filled.length; k++) {
                revealedCells.push(filled[k]);
            }
        }

        if (hitMine) {
            state = 'lost';
            return {
                type: 'lose',
                cell: mineCell,
                allMines: revealAllMines(mineCell.row, mineCell.col)
            };
        }

        // Check win
        if (checkWin()) {
            state = 'won';
            return { type: 'win', cells: revealedCells };
        }

        return { type: 'chord', cells: revealedCells };
    }

    function revealAllMines(explodedRow, explodedCol) {
        var results = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = board[r][c];
                if (cell.mine) {
                    if (r === explodedRow && c === explodedCol) {
                        results.push({ row: r, col: c, type: 'exploded' });
                    } else if (cell.flagged) {
                        // Correctly flagged mine - skip (don't show)
                        continue;
                    } else {
                        results.push({ row: r, col: c, type: 'mine' });
                    }
                } else if (cell.flagged) {
                    // Flagged but not a mine = wrong flag
                    results.push({ row: r, col: c, type: 'wrong-flag' });
                }
            }
        }
        return results;
    }

    return {
        newGame: newGame,
        getBoard: function() { return board; },
        getState: function() { return state; },
        getRows: function() { return rows; },
        getCols: function() { return cols; },
        getMines: function() { return totalMines; },
        getFlagCount: function() { return flagCount; },
        getRevealedCount: function() { return revealedCount; },
        reveal: reveal,
        toggleFlag: toggleFlag,
        chord: chord,
        revealAllMines: function() { return revealAllMines(-1, -1); }
    };
})();
