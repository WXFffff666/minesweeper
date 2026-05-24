/**
 * Themes module - handles visual theme switching and keyboard shortcuts.
 */
MS.Themes = (function() {
    'use strict';

    var current = 'classic';
    var themes = ['classic', 'dark', 'blue'];

    function apply(name) {
        if (themes.indexOf(name) === -1) return;
        document.body.className = '';
        if (name !== 'classic') {
            document.body.classList.add('theme-' + name);
        }
        current = name;
        MS.Storage.save(MS.Config.storageKeys.theme, name);
    }

    function getCurrent() {
        return current;
    }

    function getList() {
        return themes.slice();
    }

    function init() {
        var saved = MS.Storage.load(MS.Config.storageKeys.theme, 'classic');
        apply(saved);
        initKeyboardShortcuts();
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // If a dialog is open, only handle Escape
            var dialog = document.querySelector('.dialog-overlay.visible');
            if (dialog) {
                if (e.key === 'Escape') {
                    // Close dialog - let app.js handle via its own listener or close directly
                    dialog.classList.remove('visible');
                    e.preventDefault();
                }
                return;
            }

            // Don't handle if an input is focused
            var tag = document.activeElement && document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            switch (e.key) {
                case 'F2':
                    if (MS.App && MS.App.newGame) MS.App.newGame();
                    e.preventDefault();
                    break;
                case '1':
                    if (MS.App && MS.App.setDifficulty) MS.App.setDifficulty('beginner');
                    break;
                case '2':
                    if (MS.App && MS.App.setDifficulty) MS.App.setDifficulty('intermediate');
                    break;
                case '3':
                    if (MS.App && MS.App.setDifficulty) MS.App.setDifficulty('expert');
                    break;
                case 'm':
                case 'M':
                    if (MS.Sound && MS.Sound.setEnabled && MS.Sound.isEnabled) {
                        MS.Sound.setEnabled(!MS.Sound.isEnabled());
                    }
                    break;
                case 'f':
                case 'F':
                    // Toggle flag mode - dispatch custom event for input module
                    document.dispatchEvent(new CustomEvent('ms-toggle-flag-mode'));
                    break;
                case 'Escape':
                    // Close any open menu
                    var openMenu = document.querySelector('.menu-dropdown.visible');
                    if (openMenu) {
                        openMenu.classList.remove('visible');
                    }
                    break;
            }
        });
    }

    return {
        init: init,
        apply: apply,
        getCurrent: getCurrent,
        getList: getList
    };
})();
