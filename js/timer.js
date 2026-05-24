/**
 * Timer module - handles game timer display and tracking.
 */
MS.Timer = (function() {
    'use strict';

    var seconds = 0;
    var intervalId = null;
    var running = false;
    var onTick = null;

    function start() {
        if (running) return;
        running = true;
        intervalId = setInterval(function() {
            if (seconds < 999) {
                seconds++;
                if (onTick) onTick(seconds);
            }
        }, 1000);
    }

    function stop() {
        if (!running) return;
        running = false;
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function reset() {
        stop();
        seconds = 0;
        if (onTick) onTick(seconds);
    }

    function getTime() {
        return seconds;
    }

    function isRunning() {
        return running;
    }

    function setOnTick(callback) {
        onTick = callback;
    }

    return {
        start: start,
        stop: stop,
        reset: reset,
        getTime: getTime,
        isRunning: isRunning,
        setOnTick: setOnTick
    };
})();
