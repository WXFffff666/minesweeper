/**
 * Storage module - handles localStorage persistence for settings, stats, and achievements.
 */
MS.Storage = (function() {
    'use strict';

    var memoryFallback = {};
    var available = false;

    function testAvailability() {
        try {
            var test = '__ms_test__';
            localStorage.setItem(test, '1');
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    available = testAvailability();

    function save(key, value) {
        var json = JSON.stringify(value);
        if (available) {
            try {
                localStorage.setItem(key, json);
            } catch (e) {
                memoryFallback[key] = json;
            }
        } else {
            memoryFallback[key] = json;
        }
    }

    function load(key, defaultValue) {
        var raw = null;
        if (available) {
            try {
                raw = localStorage.getItem(key);
            } catch (e) {
                raw = memoryFallback[key] || null;
            }
        } else {
            raw = memoryFallback[key] || null;
        }

        if (raw === null) return defaultValue !== undefined ? defaultValue : null;

        try {
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue !== undefined ? defaultValue : null;
        }
    }

    function remove(key) {
        if (available) {
            try { localStorage.removeItem(key); } catch (e) {}
        }
        delete memoryFallback[key];
    }

    function clear() {
        if (available) {
            try {
                var keysToRemove = [];
                for (var i = 0; i < localStorage.length; i++) {
                    var k = localStorage.key(i);
                    if (k && k.indexOf('ms_') === 0) {
                        keysToRemove.push(k);
                    }
                }
                for (var j = 0; j < keysToRemove.length; j++) {
                    localStorage.removeItem(keysToRemove[j]);
                }
            } catch (e) {}
        }
        memoryFallback = {};
    }

    function isAvailable() {
        return available;
    }

    return {
        save: save,
        load: load,
        remove: remove,
        clear: clear,
        isAvailable: isAvailable
    };
})();
