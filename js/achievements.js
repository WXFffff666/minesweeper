/**
 * Achievements module - checks conditions, unlocks achievements, notifies via callback.
 */
MS.Achievements = (function() {
    'use strict';

    var unlocked = {};
    var onUnlock = null;

    function init() {
        unlocked = MS.Storage.load(MS.Config.storageKeys.achievements, {});
    }

    function check(gameData) {
        var defs = MS.Config.achievements;
        var newUnlocks = [];

        for (var i = 0; i < defs.length; i++) {
            var ach = defs[i];
            if (unlocked[ach.id]) continue;

            if (checkCondition(ach.id, gameData)) {
                unlocked[ach.id] = { date: new Date().toISOString() };
                newUnlocks.push(ach);
            }
        }

        if (newUnlocks.length > 0) {
            save();
            for (var j = 0; j < newUnlocks.length; j++) {
                if (onUnlock) onUnlock(newUnlocks[j]);
            }
        }

        return newUnlocks;
    }

    function checkCondition(id, data) {
        switch (id) {
            case 'first_win': return data.won;
            case 'speed_demon': return data.won && data.difficulty === 'beginner' && data.time < 10;
            case 'intermediate_master': return data.won && data.difficulty === 'intermediate' && data.time < 60;
            case 'expert_master': return data.won && data.difficulty === 'expert' && data.time < 120;
            case 'no_flags': return data.won && data.flagsUsed === 0;
            case 'streak_5': return data.stats && data.stats.currentStreak >= 5;
            case 'streak_10': return data.stats && data.stats.currentStreak >= 10;
            case 'games_50': return data.stats && data.stats.totalGames >= 50;
            case 'games_100': return data.stats && data.stats.totalGames >= 100;
            case 'perfect_flag': return data.won && data.perfectFlags;
            case 'endless_50': return data.stats && data.stats.endlessWins >= 50;
            case 'all_difficulties': return data.stats && data.stats.wonBeginner && data.stats.wonIntermediate && data.stats.wonExpert;
            default: return false;
        }
    }

    function getAll() {
        var defs = MS.Config.achievements;
        var result = [];
        for (var i = 0; i < defs.length; i++) {
            var ach = defs[i];
            result.push({
                id: ach.id,
                name: ach.name,
                description: ach.description,
                unlocked: !!unlocked[ach.id],
                date: unlocked[ach.id] ? unlocked[ach.id].date : null
            });
        }
        return result;
    }

    function save() {
        MS.Storage.save(MS.Config.storageKeys.achievements, unlocked);
    }

    function setOnUnlock(fn) {
        onUnlock = fn;
    }

    return {
        init: init,
        check: check,
        getAll: getAll,
        setOnUnlock: setOnUnlock
    };
})();
