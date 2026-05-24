/**
 * Endless mode module - handles streak tracking, progressive difficulty,
 * and auto-advance after wins.
 */
MS.Endless = (function() {
    'use strict';

    var active = false;
    var stats = {
        currentStreak: 0,
        bestStreak: 0,
        totalGames: 0,
        gamesWon: 0,
        fastestTime: Infinity,
        currentDifficulty: null  // {rows, cols, mines}
    };
    var baseDifficulty = null;
    var countdownTimer = null;
    var onNextGame = null;  // Callback to start next game

    function start(difficulty) {
        // difficulty = {rows, cols, mines}
        active = true;
        baseDifficulty = { rows: difficulty.rows, cols: difficulty.cols, mines: difficulty.mines };
        stats.currentDifficulty = { rows: difficulty.rows, cols: difficulty.cols, mines: difficulty.mines };
        stats.currentStreak = 0;
        loadStats();
    }

    function stop() {
        active = false;
        if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null; }
    }

    function onWin(time) {
        if (!active) return;
        stats.totalGames++;
        stats.gamesWon++;
        stats.currentStreak++;
        if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
        }
        if (time < stats.fastestTime) {
            stats.fastestTime = time;
        }

        // Progressive difficulty
        updateDifficulty();
        saveStats();

        // Auto-advance after 2 seconds
        countdownTimer = setTimeout(function() {
            if (onNextGame) onNextGame(stats.currentDifficulty);
        }, 2000);
    }

    function onLose() {
        if (!active) return;
        stats.totalGames++;
        stats.currentStreak = 0;
        // Reset difficulty to base
        stats.currentDifficulty = { rows: baseDifficulty.rows, cols: baseDifficulty.cols, mines: baseDifficulty.mines };
        saveStats();
    }

    function updateDifficulty() {
        // Every 3 wins: increase mines by 5%
        if (stats.currentStreak % 3 === 0) {
            var maxMines = stats.currentDifficulty.rows * stats.currentDifficulty.cols - 9;
            var newMines = Math.min(Math.ceil(stats.currentDifficulty.mines * 1.05), maxMines);
            stats.currentDifficulty.mines = newMines;
        }
        // Every 10 wins: increase board size by 1 row and 1 col
        if (stats.currentStreak % 10 === 0 && stats.currentStreak > 0) {
            var maxSize = MS.Config.maxBoardSize;
            stats.currentDifficulty.rows = Math.min(stats.currentDifficulty.rows + 1, maxSize.rows);
            stats.currentDifficulty.cols = Math.min(stats.currentDifficulty.cols + 1, maxSize.cols);
        }
    }

    function loadStats() {
        var saved = MS.Storage.load(MS.Config.storageKeys.endlessHighScore, null);
        if (saved) {
            stats.bestStreak = saved.bestStreak || 0;
            stats.totalGames = saved.totalGames || 0;
            stats.gamesWon = saved.gamesWon || 0;
            stats.fastestTime = saved.fastestTime || Infinity;
        }
    }

    function saveStats() {
        MS.Storage.save(MS.Config.storageKeys.endlessHighScore, {
            bestStreak: stats.bestStreak,
            totalGames: stats.totalGames,
            gamesWon: stats.gamesWon,
            fastestTime: stats.fastestTime === Infinity ? null : stats.fastestTime
        });
    }

    function getStats() { return stats; }
    function isActive() { return active; }
    function setOnNextGame(fn) { onNextGame = fn; }

    return {
        start: start,
        stop: stop,
        onWin: onWin,
        onLose: onLose,
        getStats: getStats,
        isActive: isActive,
        setOnNextGame: setOnNextGame
    };
})();
