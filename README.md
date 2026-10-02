# Modern Tactical Dots & Boxes Web App

An ultra-sleek, responsive, and tactile web version of the classic pen-and-paper strategy game **Dots and Boxes**.

## ✨ Features

- **Rich Neon-Glass Aesthetics**: Dark slate background with ambient floating orbs, glowing cyan & rose player palettes, glassmorphism panels, and smooth micro-animations.
- **High-Visibility Grid Lines**: Distinct unplayed connector tracks between all dots with dynamic player-glow hover previews, plus ultra-bold `9px` neon claimed lines.
- **Intelligent AI with 3 Tiers**:
  - *Casual (Easy)*: Casual player, claims open boxes, occasionally blunders.
  - *Tactician (Medium)*: Greedy capturer, completely avoids opening 3rd sides.
  - *Grandmaster (Hard)*: Tactical chain analyzer with the classic Conway **Double-Crossing Heuristic** (sacrificing 2 boxes in a corridor to force the opponent to open the next corridor).
- **2-Player Local Pass & Play Mode**: Play against friends on the same device.
- **Multiple Board Sizes**:
  - 3×3 Dots (4 Boxes) - Blitz
  - 4×4 Dots (9 Boxes) - Classic
  - 5×5 Dots (16 Boxes) - Tactical Standard
  - 6×6 Dots (25 Boxes) - Grandmaster Master
- **Procedural Sound Engine**: Powered by Web Audio API (zero external mp3 assets, polyphonic combo chords, pop feedback, victory fanfares).
- **Particle & Confetti FX**: Fullscreen dynamic canvas particles when boxes are claimed and celebration fireworks upon winning.
- **Bonus Turns & Combo Tracker**: Chain multiple boxes in a single turn with ascending musical intervals!
- **Undo Move Support**: Seamless single or double turn rollback.
- **Lifetime Statistics**: Win rate, games played, total boxes, and highest combo streak saved in `localStorage`.
- **Keyboard Shortcuts**:
  - `R`: New / Restart Game
  - `Z`: Undo Move
  - `M`: Toggle Sound Mute
  - `?`: How to Play Rules
  - `Esc`: Close Modals

## 🚀 Running the Game

Simply open `index.html` in any modern web browser or serve it locally:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080) in your browser.
