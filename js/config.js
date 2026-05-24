/**
 * Configuration module for Minesweeper.
 * Contains difficulty presets, color maps, achievements, and app settings.
 */
MS.Config = (function() {
    'use strict';

    var difficulties = {
        beginner: { rows: 9, cols: 9, mines: 10 },
        intermediate: { rows: 16, cols: 16, mines: 40 },
        expert: { rows: 16, cols: 30, mines: 99 }
    };

    var numberColors = {
        1: '#0000FF',
        2: '#008000',
        3: '#FF0000',
        4: '#000080',
        5: '#800000',
        6: '#008080',
        7: '#000000',
        8: '#808080'
    };

    var maxBoardSize = { rows: 50, cols: 50 };
    var minBoardSize = { rows: 5, cols: 5 };

    var achievements = [
        { id: 'first_win', name: '首次胜利', description: '赢得第一局游戏', condition: 'win_count >= 1' },
        { id: 'speed_demon', name: '速度恶魔', description: '10秒内通关初级', condition: 'beginner_time < 10' },
        { id: 'intermediate_master', name: '中级大师', description: '60秒内通关中级', condition: 'intermediate_time < 60' },
        { id: 'expert_master', name: '高级大师', description: '120秒内通关高级', condition: 'expert_time < 120' },
        { id: 'no_flags', name: '无旗通关', description: '不插旗赢得游戏', condition: 'flags_used === 0' },
        { id: 'streak_5', name: '连胜5局', description: '连续赢得5局', condition: 'win_streak >= 5' },
        { id: 'streak_10', name: '势不可挡', description: '连续赢得10局', condition: 'win_streak >= 10' },
        { id: 'games_50', name: '忠实玩家', description: '累计游玩50局', condition: 'total_games >= 50' },
        { id: 'games_100', name: '扫雷上瘾', description: '累计游玩100局', condition: 'total_games >= 100' },
        { id: 'perfect_flag', name: '完美标旗', description: '所有旗子都插在雷上并获胜', condition: 'perfect_flags === true' },
        { id: 'endless_50', name: '无尽探索者', description: '无尽模式通关50局', condition: 'endless_cleared >= 50' },
        { id: 'all_difficulties', name: '全面发展', description: '在三个难度都获胜', condition: 'won_beginner && won_intermediate && won_expert' }
    ];

    var storageKeys = {
        bestTimes: 'ms_best_times',
        stats: 'ms_stats',
        achievements: 'ms_achievements',
        settings: 'ms_settings',
        theme: 'ms_theme',
        customDifficulty: 'ms_custom_difficulty',
        endlessHighScore: 'ms_endless_high_score',
        soundEnabled: 'ms_sound_enabled'
    };

    return {
        difficulties: difficulties,
        numberColors: numberColors,
        maxBoardSize: maxBoardSize,
        minBoardSize: minBoardSize,
        achievements: achievements,
        storageKeys: storageKeys,
        version: '1.0.0'
    };
})();
