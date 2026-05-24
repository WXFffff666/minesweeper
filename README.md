# Classic Minesweeper

A pixel-perfect recreation of Microsoft Windows XP/7 Classic Minesweeper, built as a pure static web application.

## Features

- **Authentic Visual Style**: Faithful recreation of Windows XP/7 Minesweeper with 3D borders, LED counters, and classic gray theme
- **Full Game Mechanics**: Left-click reveal, right-click flag, chord (both buttons), first-click safety, auto-expand empty areas
- **Difficulty Levels**: Beginner (9×9, 10 mines), Intermediate (16×16, 40 mines), Expert (16×30, 99 mines), Custom
- **Endless Mode**: Auto-advance after wins with progressive difficulty and streak tracking
- **Mobile Optimized**: Touch controls (tap to reveal, long-press to flag), flag-mode toggle, responsive layout
- **PWA Support**: Installable as app, works offline (on HTTPS)
- **Sound Effects**: Web Audio API synthesized sounds (no external files)
- **Achievements**: 12 unlockable achievements
- **Statistics**: Win rate, best times, streaks, leaderboard (local)
- **Themes**: Classic (default), Dark, Blue
- **Keyboard Shortcuts**: F2 (new game), 1/2/3 (difficulty), M (mute), F (flag mode)
- **No Dependencies**: Pure HTML + CSS + JavaScript, no frameworks, no npm

## How to Play

### Desktop
- **Left-click**: Reveal a cell
- **Right-click**: Place/remove flag
- **Both buttons** (or middle-click): Chord - reveal neighbors if flag count matches number
- **Smiley button**: Start new game

### Mobile
- **Tap**: Reveal a cell (or flag if flag-mode active)
- **Long-press** (500ms): Place/remove flag
- **Flag-mode button**: Toggle between dig and flag mode

## Running Locally

Simply double-click `index.html` in your browser. No server required.

Or use any static file server:
```bash
# Python
python -m http.server 8000

# Node.js (npx, no install needed)
npx serve .

# PHP
php -S localhost:8000
```

## Deployment

### Cloudflare Pages
1. Push to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Connect your GitHub repository
4. Set build output directory to `/` (or the repo root if this is the only content)
5. No build command needed
6. Deploy

### GitHub Pages
1. Push to GitHub
2. Go to repository Settings → Pages
3. Source: Deploy from a branch
4. Select `main` branch, root folder
5. Save - site will be live at `https://username.github.io/minesweeper/`

### Netlify
1. Drag and drop the `minesweeper/` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect GitHub repo, no build command needed

## Git Setup

```bash
cd minesweeper
git init
git add .
git commit -m "feat: complete classic minesweeper web game"

# Create GitHub repo and push
gh repo create minesweeper --public --source=. --push

# Or manually:
# git remote add origin https://github.com/YOUR_USERNAME/minesweeper.git
# git push -u origin main
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F2 | New game |
| 1 | Beginner difficulty |
| 2 | Intermediate difficulty |
| 3 | Expert difficulty |
| M | Toggle sound |
| F | Toggle flag mode |
| Esc | Close dialog/menu |

## Achievements

| Achievement | Description |
|-------------|-------------|
| First Victory | Win your first game |
| Speed Demon | Win beginner in under 10 seconds |
| Intermediate Master | Win intermediate in under 60 seconds |
| Expert Master | Win expert in under 120 seconds |
| No Flags Needed | Win without placing any flags |
| On a Roll | Win 5 games in a row |
| Unstoppable | Win 10 games in a row |
| Dedicated Player | Play 50 games |
| Minesweeper Addict | Play 100 games |
| Perfect Flagger | Win with every flag on a mine |
| Endless Explorer | Win 50 games in endless mode |
| Well Rounded | Win on all three difficulties |

## Technical Details

- **No build step**: Open index.html directly
- **No dependencies**: Pure vanilla JavaScript
- **No frameworks**: HTML + CSS + JS only
- **Offline capable**: PWA with service worker (on HTTPS)
- **Storage**: localStorage for settings, scores, achievements
- **Sound**: Web Audio API synthesis (no audio files)
- **Performance**: Event delegation, batch DOM updates, iterative BFS flood fill

## Project Structure

```
minesweeper/
├── index.html          # Main page
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── LICENSE            # MIT License
├── README.md          # This file
├── css/
│   ├── main.css       # Core layout, window chrome, dialogs
│   ├── board.css      # Board grid, cell states, number colors
│   ├── themes.css     # Theme variables and overrides
│   └── responsive.css # Mobile/tablet responsive styles
├── js/
│   ├── namespace.js   # Global MS namespace
│   ├── config.js      # Difficulty presets, colors, achievements
│   ├── engine.js      # Core game logic (pure, no DOM)
│   ├── sound.js       # Web Audio API sound synthesis
│   ├── storage.js     # localStorage wrapper
│   ├── timer.js       # Game timer
│   ├── renderer.js    # DOM rendering
│   ├── input.js       # Mouse/touch/keyboard input
│   ├── endless.js     # Endless mode logic
│   ├── achievements.js # Achievement system
│   ├── stats.js       # Statistics tracking
│   ├── themes.js      # Theme switching + keyboard shortcuts
│   └── app.js         # Main app initialization and wiring
└── icons/
    └── icon.svg       # PWA icon
```

## License

MIT License - see [LICENSE](LICENSE) file.
