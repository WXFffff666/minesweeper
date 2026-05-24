/**
 * Application module - wires all modules together into a fully working Minesweeper game.
 * Manages game state, menus, dialogs, and module coordination.
 */
MS.App = (function() {
    'use strict';

    var currentDifficulty = 'beginner';
    var currentConfig = null;
    var gameState = 'idle'; // idle | playing | won | lost

    // --- Initialization ---

    function init() {
        var savedSettings = MS.Storage.load(MS.Config.storageKeys.settings, {});
        currentDifficulty = savedSettings.difficulty || 'beginner';

        MS.Stats.init();
        MS.Achievements.init();
        MS.Themes.init();

        MS.Timer.setOnTick(function(seconds) {
            MS.Renderer.updateTimer(seconds);
        });

        MS.Input.setOnReveal(handleReveal);
        MS.Input.setOnFlag(handleFlag);
        MS.Input.setOnChord(handleChord);
        MS.Input.setOnRestart(newGame);
        MS.Input.init();

        MS.Endless.setOnNextGame(function(difficulty) {
            currentConfig = difficulty;
            startGame();
        });

        MS.Achievements.setOnUnlock(showAchievementToast);

        initMenus();
        registerServiceWorker();
        newGame();
    }

    // --- Game Flow ---

    function newGame() {
        currentConfig = MS.Config.difficulties[currentDifficulty] || MS.Config.difficulties.beginner;
        startGame();
    }

    function startGame() {
        gameState = 'idle';
        MS.Engine.newGame(currentConfig.rows, currentConfig.cols, currentConfig.mines);
        MS.Renderer.createBoard(currentConfig.rows, currentConfig.cols);
        MS.Renderer.updateMineCounter(currentConfig.mines);
        MS.Timer.reset();
        MS.Renderer.updateTimer(0);
        MS.Renderer.setSmiley('normal');
        MS.Input.setGameActive(true);
    }

    function handleReveal(row, col) {
        if (gameState === 'won' || gameState === 'lost') return;

        if (gameState === 'idle') {
            gameState = 'playing';
            MS.Timer.start();
        }

        var result = MS.Engine.reveal(row, col);
        if (!result) return;

        MS.Sound.play('click');
        MS.Renderer.revealResult(result);

        if (result.type === 'win') handleWin();
        if (result.type === 'lose') handleLose();
    }

    function handleFlag(row, col) {
        if (gameState === 'won' || gameState === 'lost') return;

        if (gameState === 'idle') {
            gameState = 'playing';
            MS.Timer.start();
        }

        var result = MS.Engine.toggleFlag(row, col);
        if (!result) return;

        MS.Sound.play(result.cell.flagged ? 'flag' : 'unflag');
        MS.Renderer.revealResult(result);
    }

    function handleChord(row, col) {
        if (gameState === 'won' || gameState === 'lost') return;

        var result = MS.Engine.chord(row, col);
        if (!result) return;

        MS.Sound.play('chord');
        MS.Renderer.revealResult(result);

        if (result.type === 'win') handleWin();
        if (result.type === 'lose') handleLose();
    }

    function handleWin() {
        gameState = 'won';
        MS.Timer.stop();
        MS.Input.setGameActive(false);
        MS.Sound.play('win');

        var time = MS.Timer.getTime();

        MS.Stats.recordGame({ won: true, difficulty: currentDifficulty, time: time });

        MS.Achievements.check({
            won: true,
            difficulty: currentDifficulty,
            time: time,
            flagsUsed: MS.Engine.getFlagCount(),
            boardSize: { rows: currentConfig.rows, cols: currentConfig.cols },
            stats: MS.Stats.getAll()
        });

        if (MS.Endless.isActive()) {
            MS.Endless.onWin(time);
            MS.Stats.recordEndlessWin();
        }
    }

    function handleLose() {
        gameState = 'lost';
        MS.Timer.stop();
        MS.Input.setGameActive(false);
        MS.Sound.play('explosion');

        MS.Stats.recordGame({ won: false, difficulty: currentDifficulty, time: MS.Timer.getTime() });

        if (MS.Endless.isActive()) {
            MS.Endless.onLose();
        }
    }

    // --- Difficulty ---

    function setDifficulty(name) {
        if (MS.Config.difficulties[name]) {
            currentDifficulty = name;
            MS.Storage.save(MS.Config.storageKeys.settings, { difficulty: name });
            MS.Endless.stop();
            newGame();
        }
    }

    function setCustomDifficulty(rows, cols, mines) {
        var max = MS.Config.maxBoardSize;
        var min = MS.Config.minBoardSize;
        rows = Math.max(min.rows, Math.min(max.rows, rows));
        cols = Math.max(min.cols, Math.min(max.cols, cols));
        mines = Math.max(1, Math.min(rows * cols - 9, mines));

        currentDifficulty = 'custom';
        currentConfig = { rows: rows, cols: cols, mines: mines };
        MS.Storage.save(MS.Config.storageKeys.customDifficulty, currentConfig);
        MS.Endless.stop();
        startGame();
    }

    function toggleEndless() {
        if (MS.Endless.isActive()) {
            MS.Endless.stop();
        } else {
            MS.Endless.start(currentConfig);
        }
    }

    // --- Menu System ---

    function initMenus() {
        var menuBar = document.querySelector('.menu-bar');
        if (!menuBar) return;

        var menus = buildMenuData();
        var buttons = menuBar.querySelectorAll('.menu-btn');

        for (var i = 0; i < buttons.length; i++) {
            (function(btn) {
                var menuName = btn.getAttribute('data-menu');
                var menuData = menus[menuName];
                if (!menuData) return;

                var dropdown = createDropdown(menuData);
                btn.parentNode.appendChild(dropdown);
                btn._dropdown = dropdown;

                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var wasVisible = dropdown.classList.contains('visible');
                    closeAllMenus();
                    if (!wasVisible) {
                        dropdown.classList.add('visible');
                        positionDropdown(btn, dropdown);
                    }
                });
            })(buttons[i]);
        }

        document.addEventListener('click', function() {
            closeAllMenus();
        });
    }

    function buildMenuData() {
        return {
            game: [
                { label: '新游戏', action: newGame, shortcut: 'F2' },
                { type: 'separator' },
                { label: '初级', action: function() { setDifficulty('beginner'); }, radio: 'difficulty', checked: function() { return currentDifficulty === 'beginner'; } },
                { label: '中级', action: function() { setDifficulty('intermediate'); }, radio: 'difficulty', checked: function() { return currentDifficulty === 'intermediate'; } },
                { label: '高级', action: function() { setDifficulty('expert'); }, radio: 'difficulty', checked: function() { return currentDifficulty === 'expert'; } },
                { label: '自定义\u2026', action: showCustomDialog },
                { type: 'separator' },
                { label: '无尽模式', action: toggleEndless, checkbox: true, checked: function() { return MS.Endless.isActive(); } },
                { type: 'separator' },
                { label: '统计\u2026', action: showStatsDialog },
                { label: '成就\u2026', action: showAchievementsDialog }
            ],
            options: [
                { label: '音效', action: function() { MS.Sound.setEnabled(!MS.Sound.isEnabled()); }, checkbox: true, checked: function() { return MS.Sound.isEnabled(); } },
                { type: 'separator' },
                { label: '经典', action: function() { MS.Themes.apply('classic'); }, radio: 'theme', checked: function() { return MS.Themes.getCurrent() === 'classic'; } },
                { label: '深色', action: function() { MS.Themes.apply('dark'); }, radio: 'theme', checked: function() { return MS.Themes.getCurrent() === 'dark'; } },
                { label: '蓝色', action: function() { MS.Themes.apply('blue'); }, radio: 'theme', checked: function() { return MS.Themes.getCurrent() === 'blue'; } }
            ],
            help: [
                { label: '快捷键', action: showShortcutsDialog },
                { type: 'separator' },
                { label: '关于', action: showAboutDialog }
            ]
        };
    }

    function createDropdown(items) {
        var dropdown = document.createElement('div');
        dropdown.className = 'menu-dropdown';

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (item.type === 'separator') {
                var sep = document.createElement('div');
                sep.className = 'menu-separator';
                dropdown.appendChild(sep);
                continue;
            }

            var el = document.createElement('div');
            el.className = 'menu-item';

            var labelSpan = document.createElement('span');
            labelSpan.className = 'menu-item-label';
            labelSpan.textContent = item.label;
            el.appendChild(labelSpan);

            if (item.shortcut) {
                var shortcutSpan = document.createElement('span');
                shortcutSpan.className = 'menu-item-shortcut';
                shortcutSpan.textContent = item.shortcut;
                el.appendChild(shortcutSpan);
            }

            if (item.checkbox || item.radio) {
                var marker = document.createElement('span');
                marker.className = 'menu-item-marker';
                el.insertBefore(marker, el.firstChild);
                el._checkedFn = item.checked;
                el._isCheckable = true;
            }

            el._action = item.action;

            el.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this._action) this._action();
                closeAllMenus();
            });

            dropdown.appendChild(el);
        }

        return dropdown;
    }

    function positionDropdown(btn, dropdown) {
        var rect = btn.getBoundingClientRect();
        dropdown.style.left = rect.left + 'px';
        dropdown.style.top = rect.bottom + 'px';

        // Update checkable items
        var items = dropdown.querySelectorAll('.menu-item');
        for (var i = 0; i < items.length; i++) {
            var el = items[i];
            if (el._isCheckable && el._checkedFn) {
                var marker = el.querySelector('.menu-item-marker');
                if (marker) {
                    marker.textContent = el._checkedFn() ? '\u2713' : '';
                }
            }
        }
    }

    function closeAllMenus() {
        var dropdowns = document.querySelectorAll('.menu-dropdown.visible');
        for (var i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.remove('visible');
        }
    }

    // --- Dialogs ---

    function createDialog(title, content) {
        var overlay = document.createElement('div');
        overlay.className = 'dialog-overlay visible';

        var dialog = document.createElement('div');
        dialog.className = 'dialog';

        var header = document.createElement('div');
        header.className = 'dialog-header';

        var titleEl = document.createElement('span');
        titleEl.className = 'dialog-title';
        titleEl.textContent = title;
        header.appendChild(titleEl);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'dialog-close';
        closeBtn.textContent = '\u00D7';
        closeBtn.addEventListener('click', function() {
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 200);
        });
        header.appendChild(closeBtn);

        var body = document.createElement('div');
        body.className = 'dialog-body';
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }

        dialog.appendChild(header);
        dialog.appendChild(body);
        overlay.appendChild(dialog);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('visible');
                setTimeout(function() { overlay.remove(); }, 200);
            }
        });

        document.body.appendChild(overlay);
        return overlay;
    }

    function showCustomDialog() {
        var saved = MS.Storage.load(MS.Config.storageKeys.customDifficulty, { rows: 16, cols: 16, mines: 40 });

        var form = document.createElement('div');
        form.className = 'dialog-form';

        form.innerHTML =
            '<div class="form-row">' +
                '<label for="custom-rows">行数:</label>' +
                '<input type="number" id="custom-rows" min="' + MS.Config.minBoardSize.rows + '" max="' + MS.Config.maxBoardSize.rows + '" value="' + saved.rows + '">' +
            '</div>' +
            '<div class="form-row">' +
                '<label for="custom-cols">列数:</label>' +
                '<input type="number" id="custom-cols" min="' + MS.Config.minBoardSize.cols + '" max="' + MS.Config.maxBoardSize.cols + '" value="' + saved.cols + '">' +
            '</div>' +
            '<div class="form-row">' +
                '<label for="custom-mines">雷数:</label>' +
                '<input type="number" id="custom-mines" min="1" max="' + (saved.rows * saved.cols - 9) + '" value="' + saved.mines + '">' +
            '</div>' +
            '<div class="form-actions">' +
                '<button class="btn btn-primary" id="custom-ok">确定</button>' +
                '<button class="btn" id="custom-cancel">取消</button>' +
            '</div>';

        var overlay = createDialog('自定义难度', form);

        var okBtn = overlay.querySelector('#custom-ok');
        var cancelBtn = overlay.querySelector('#custom-cancel');

        okBtn.addEventListener('click', function() {
            var r = parseInt(overlay.querySelector('#custom-rows').value, 10) || 9;
            var c = parseInt(overlay.querySelector('#custom-cols').value, 10) || 9;
            var m = parseInt(overlay.querySelector('#custom-mines').value, 10) || 10;
            setCustomDifficulty(r, c, m);
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 200);
        });

        cancelBtn.addEventListener('click', function() {
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 200);
        });
    }

    function showStatsDialog() {
        var stats = MS.Stats.getAll();
        var winRate = MS.Stats.getWinRate();

        var html =
            '<table class="stats-table">' +
            '<tr><td>总局数</td><td>' + stats.totalGames + '</td></tr>' +
            '<tr><td>胜利</td><td>' + stats.gamesWon + '</td></tr>' +
            '<tr><td>失败</td><td>' + stats.gamesLost + '</td></tr>' +
            '<tr><td>胜率</td><td>' + winRate + '%</td></tr>' +
            '<tr><td>当前连胜</td><td>' + stats.currentStreak + '</td></tr>' +
            '<tr><td>最佳连胜</td><td>' + stats.bestStreak + '</td></tr>' +
            '<tr><td>无尽胜场</td><td>' + stats.endlessWins + '</td></tr>' +
            '</table>';

        var bestTimesHtml = '<h3>最佳时间</h3><table class="stats-table">';
        var difficulties = ['beginner', 'intermediate', 'expert'];
        var diffNames = { beginner: '初级', intermediate: '中级', expert: '高级' };
        for (var i = 0; i < difficulties.length; i++) {
            var d = difficulties[i];
            var times = stats.bestTimes[d] || [];
            var best = times.length > 0 ? times[0] + '秒' : '--';
            bestTimesHtml += '<tr><td>' + diffNames[d] + '</td><td>' + best + '</td></tr>';
        }
        bestTimesHtml += '</table>';

        var content = document.createElement('div');
        content.innerHTML = html + bestTimesHtml +
            '<div class="form-actions"><button class="btn" id="stats-reset">重置</button></div>';

        var overlay = createDialog('统计', content);

        overlay.querySelector('#stats-reset').addEventListener('click', function() {
            if (confirm('确定重置所有统计数据？')) {
                MS.Stats.reset();
                overlay.classList.remove('visible');
                setTimeout(function() { overlay.remove(); }, 200);
            }
        });
    }

    function showAchievementsDialog() {
        var achievements = MS.Achievements.getAll();

        var html = '<div class="achievements-list">';
        for (var i = 0; i < achievements.length; i++) {
            var ach = achievements[i];
            var cls = ach.unlocked ? 'achievement unlocked' : 'achievement locked';
            var icon = ach.unlocked ? '\u{1F3C6}' : '\u{1F512}';
            var date = ach.unlocked && ach.date ? ' (' + new Date(ach.date).toLocaleDateString() + ')' : '';
            html += '<div class="' + cls + '">' +
                '<span class="achievement-icon">' + icon + '</span>' +
                '<div class="achievement-info">' +
                    '<strong>' + ach.name + '</strong>' +
                    '<p>' + ach.description + date + '</p>' +
                '</div>' +
            '</div>';
        }
        html += '</div>';

        createDialog('成就', html);
    }

    function showShortcutsDialog() {
        var html =
            '<table class="stats-table">' +
            '<tr><td><kbd>F2</kbd></td><td>新游戏</td></tr>' +
            '<tr><td><kbd>1</kbd></td><td>初级</td></tr>' +
            '<tr><td><kbd>2</kbd></td><td>中级</td></tr>' +
            '<tr><td><kbd>3</kbd></td><td>高级</td></tr>' +
            '<tr><td><kbd>M</kbd></td><td>切换音效</td></tr>' +
            '<tr><td><kbd>F</kbd></td><td>切换标旗模式</td></tr>' +
            '<tr><td><kbd>Esc</kbd></td><td>关闭菜单/对话框</td></tr>' +
            '</table>';

        createDialog('快捷键', html);
    }

    function showAboutDialog() {
        var html =
            '<div class="about-content">' +
                '<h2>扫雷</h2>' +
                '<p>版本 1.0.0</p>' +
                '<p>使用原生 JavaScript 构建的经典扫雷游戏。</p>' +
                '<p>功能：多种难度、无尽模式、成就系统、主题切换、音效及完整的键盘/触屏支持。</p>' +
            '</div>';

        createDialog('关于', html);
    }

    // --- Achievement Toast ---

    function showAchievementToast(achievement) {
        var toast = document.createElement('div');
        toast.className = 'toast visible';
        toast.innerHTML = '\u{1F3C6} <strong>' + achievement.name + '</strong>';

        document.body.appendChild(toast);

        setTimeout(function() {
            toast.remove();
        }, 3000);
    }

    // --- Service Worker ---

    function registerServiceWorker() {
        if ('serviceWorker' in navigator && location.protocol !== 'file:') {
            navigator.serviceWorker.register('./sw.js').catch(function() {});
        }
    }

    return {
        init: init,
        newGame: newGame,
        setDifficulty: setDifficulty,
        setCustomDifficulty: setCustomDifficulty,
        toggleEndless: toggleEndless
    };
})();

document.addEventListener('DOMContentLoaded', MS.App.init);
