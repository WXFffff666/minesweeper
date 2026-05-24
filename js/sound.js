/**
 * Sound effects module - handles audio feedback for game actions.
 * All sounds synthesized via Web Audio API - no external files needed.
 */
MS.Sound = (function() {
    'use strict';

    var audioCtx = null;
    var enabled = true;
    var volume = 0.3;
    var initialized = false;

    function init() {
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) { return; }
            audioCtx = new AudioContext();
            initialized = true;
        } catch (e) {
            initialized = false;
        }
    }

    function ensureContext() {
        if (!initialized) { init(); }
        if (!audioCtx) { return false; }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return true;
    }

    function play(name) {
        if (!enabled) { return; }
        if (!ensureContext()) { return; }
        try {
            switch (name) {
                case 'click': playClick(); break;
                case 'flag': playFlag(); break;
                case 'unflag': playUnflag(); break;
                case 'explosion': playExplosion(); break;
                case 'win': playWin(); break;
                case 'chord': playChord(); break;
            }
        } catch (e) {
            // Silent failure
        }
    }

    function createNoiseBuffer(duration) {
        var sampleRate = audioCtx.sampleRate;
        var length = Math.floor(sampleRate * duration);
        var buffer = audioCtx.createBuffer(1, length, sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    function playClick() {
        var now = audioCtx.currentTime;
        var duration = 0.02;

        var buffer = createNoiseBuffer(duration);
        var source = audioCtx.createBufferSource();
        source.buffer = buffer;

        var filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;

        var gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.001);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        source.start(now);
        source.stop(now + duration);
    }

    function playFlag() {
        var now = audioCtx.currentTime;
        var duration = 0.03;

        var osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 800;

        var gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.002);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    function playUnflag() {
        var now = audioCtx.currentTime;
        var duration = 0.025;

        var osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 400;

        var gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.002);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    function playExplosion() {
        var now = audioCtx.currentTime;
        var duration = 0.15;

        var osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 60;

        var noiseBuffer = createNoiseBuffer(duration);
        var noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        var filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        var oscGain = audioCtx.createGain();
        oscGain.gain.setValueAtTime(volume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        var noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(audioCtx.destination);

        noise.connect(filter);
        noiseGain.connect(audioCtx.destination);
        noise.connect(noiseGain);

        osc.start(now);
        osc.stop(now + duration);
        noise.start(now);
        noise.stop(now + duration);
    }

    function playWin() {
        var now = audioCtx.currentTime;
        var notes = [523, 659, 784]; // C5, E5, G5
        var noteDuration = 0.1;
        var stagger = 0.12;

        for (var i = 0; i < notes.length; i++) {
            var startTime = now + i * stagger;
            var osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = notes[i];

            var gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gain.gain.linearRampToValueAtTime(0, startTime + noteDuration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(startTime);
            osc.stop(startTime + noteDuration);
        }
    }

    function playChord() {
        var now = audioCtx.currentTime;
        var duration = 0.02;

        for (var i = 0; i < 2; i++) {
            var startTime = now + i * 0.05;
            var buffer = createNoiseBuffer(duration);
            var source = audioCtx.createBufferSource();
            source.buffer = buffer;

            var filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2000;
            filter.Q.value = 1;

            var gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.001);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            source.start(startTime);
            source.stop(startTime + duration);
        }
    }

    function setEnabled(val) { enabled = !!val; }
    function setVolume(val) { volume = Math.max(0, Math.min(1, val)); }
    function isEnabled() { return enabled; }

    return {
        init: init,
        play: play,
        setEnabled: setEnabled,
        setVolume: setVolume,
        isEnabled: isEnabled
    };
})();
