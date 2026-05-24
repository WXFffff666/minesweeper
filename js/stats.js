/**
 * Statistics module - tracks games played, won, lost, best times, streaks, win rate.
 */
MS.Stats = (function() {
    'use strict';

    var data = {
        totalGames: 0,
        gamesWon: 0,
        gamesLost: 0,
        currentStreak: 0,
        bestStreak: 0,
        bestTimes: { beginner: [], intermediate: [], expert: [] },
        wonBeginner: false,
        wonIntermediate: false,
        wonExpert: false,
        endlessWins: 0
    };

    function init() {
        var saved = MS.Storage.load(MS.Config.storageKeys.stats, null);
        if (saved) {
            for (var key in saved) {
                if (saved.hasOwnProperty(key) && data.hasOwnProperty(key)) {
                    data[key] = saved[key];
                }
            }
        }
    }

    function recordGame(result) {
        data.totalGames++;

        if (result.won) {
            data.gamesWon++;
            data.currentStreak++;
            if (data.currentStreak > data.bestStreak) {
                data.bestStreak = data.currentStreak;
            }

            if (result.difficulty === 'beginner') data.wonBeginner = true;
            if (result.difficulty === 'intermediate') data.wonIntermediate = true;
            if (result.difficulty === 'expert') data.wonExpert = true;

            if (data.bestTimes[result.difficulty]) {
                data.bestTimes[result.difficulty].push(result.time);
                data.bestTimes[result.difficulty].sort(function(a, b) { return a - b; });
                if (data.bestTimes[result.difficulty].length > 10) {
                    data.bestTimes[result.difficulty] = data.bestTimes[result.difficulty].slice(0, 10);
                }
            }
        } else {
            data.gamesLost++;
            data.currentStreak = 0;
        }

        save();
    }

    function recordEndlessWin() {
        data.endlessWins++;
        save();
    }

    function getAll() {
        return data;
    }

    function getWinRate() {
        if (data.totalGames === 0) return 0;
        return Math.round((data.gamesWon / data.totalGames) * 100);
    }

    function reset() {
        data = {
            totalGames: 0,
            gamesWon: 0,
            gamesLost: 0,
            currentStreak: 0,
            bestStreak: 0,
            bestTimes: { beginner: [], intermediate: [], expert: [] },
            wonBeginner: false,
            wonIntermediate: false,
            wonExpert: false,
            endlessWins: 0
        };
        save();
    }

    function save() {
        MS.Storage.save(MS.Config.storageKeys.stats, data);
    }

    return {
        init: init,
        recordGame: recordGame,
        recordEndlessWin: recordEndlessWin,
        getAll: getAll,
        getWinRate: getWinRate,
        reset: reset
    };
})();
