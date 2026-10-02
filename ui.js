// =========================================================
// Dots & Boxes UI Orchestrator
// Renders SVG board, visible tracks, bold lines, particles & modals
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const gameSvg = document.getElementById('game-svg');
  const boardFrame = document.getElementById('board-frame');
  const boxesLayer = document.getElementById('boxes-layer');
  const linesLayer = document.getElementById('lines-layer');
  const dotsLayer = document.getElementById('dots-layer');
  const previewLayer = document.getElementById('hover-preview-layer');
  const hitAreasLayer = document.getElementById('hit-areas-layer');
  const gridBgLayer = document.getElementById('grid-background-layer');
  const floatersContainer = document.getElementById('floaters-container');
  const particlesCanvas = document.getElementById('particles-canvas');

  // Scoreboard DOM
  const cardP1 = document.getElementById('card-p1');
  const cardP2 = document.getElementById('card-p2');
  const scoreP1 = document.getElementById('score-p1');
  const scoreP2 = document.getElementById('score-p2');
  const barP1 = document.getElementById('bar-p1');
  const barP2 = document.getElementById('bar-p2');
  const nameP2 = document.getElementById('name-p2');
  const badgeP2 = document.getElementById('badge-p2');
  const avatarP2 = document.getElementById('avatar-p2');
  const turnBadge = document.getElementById('turn-badge');
  const turnText = document.getElementById('turn-text');
  const comboBanner = document.getElementById('combo-banner');
  const comboCount = document.getElementById('combo-count');
  const remainingCountText = document.getElementById('remaining-count-text');

  // Controls DOM
  const selectMode = document.getElementById('select-mode');
  const selectDiff = document.getElementById('select-diff');
  const selectGrid = document.getElementById('select-grid');
  const diffGroup = document.getElementById('difficulty-group');
  const btnUndo = document.getElementById('btn-undo');
  const btnRestart = document.getElementById('btn-restart');
  const btnSound = document.getElementById('btn-sound');
  const btnRules = document.getElementById('btn-rules');
  const btnStats = document.getElementById('btn-stats');

  // Modals DOM
  const modalGameOver = document.getElementById('modal-gameover');
  const modalRules = document.getElementById('modal-rules');
  const modalStatsView = document.getElementById('modal-stats-view');
  const btnModalRematch = document.getElementById('btn-modal-rematch');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnCloseRules = document.getElementById('btn-close-rules');
  const btnRulesGotIt = document.getElementById('btn-rules-got-it');
  const btnCloseStats = document.getElementById('btn-close-stats');
  const btnStatsOk = document.getElementById('btn-stats-ok');
  const btnResetStats = document.getElementById('btn-reset-stats');

  // Particles Engine
  class ParticleEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.animate();
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(x, y, color = '#00f2fe', count = 28) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5.5;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          color,
          size: 3 + Math.random() * 4,
          life: 1,
          decay: 0.02 + Math.random() * 0.02
        });
      }
    }

    confettiShower() {
      const colors = ['#00f2fe', '#ff2a6d', '#ffd166', '#06d6a0', '#ffffff'];
      for (let i = 0; i < 90; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: -10 - Math.random() * 80,
          vx: (Math.random() - 0.5) * 4,
          vy: 3 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 5,
          life: 1,
          decay: 0.007 + Math.random() * 0.008,
          wobble: Math.random() * Math.PI
        });
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      requestAnimationFrame(() => this.animate());
    }
  }

  const particleEngine = new ParticleEngine(particlesCanvas);

  // Initialize Game Instance
  let game = new DotsGame({
    gridSize: parseInt(selectGrid.value, 10),
    mode: selectMode.value,
    difficulty: selectDiff.value,
    onBoxClaimed: handleBoxClaimed,
    onMoveMade: handleMoveMade,
    onGameOver: handleGameOver
  });

  let isAiThinking = false;
  let previewLineEl = null;

  renderBoard();
  updateScoreboard();

  // Mode Selection Changed
  selectMode.addEventListener('change', () => {
    const isPvp = selectMode.value === 'pvp';
    diffGroup.classList.toggle('hidden', isPvp);

    if (isPvp) {
      nameP2.textContent = 'Player 2';
      badgeP2.textContent = 'P2';
      avatarP2.textContent = 'P2';
    } else {
      nameP2.textContent = 'AI Bot';
      badgeP2.textContent = 'BOT';
      avatarP2.textContent = 'AI';
    }

    restartMatch();
  });

  selectDiff.addEventListener('change', () => {
    game.difficulty = selectDiff.value;
  });

  selectGrid.addEventListener('change', () => {
    restartMatch();
  });

  btnRestart.addEventListener('click', () => {
    window.soundEngine.playTone(600, 'sine', 0.08, 0.2);
    restartMatch();
  });

  btnUndo.addEventListener('click', () => {
    if (isAiThinking) return;
    const undone = game.undo();
    if (undone) {
      window.soundEngine.playUndo();
      refreshBoardVisuals();
      updateScoreboard();
    }
  });

  btnSound.addEventListener('click', () => {
    const isUnmuted = window.soundEngine.toggleMute();
    updateSoundIcons(isUnmuted);
  });

  function updateSoundIcons(unmuted) {
    btnSound.querySelector('.sound-on').classList.toggle('hidden', !unmuted);
    btnSound.querySelector('.sound-off').classList.toggle('hidden', unmuted);
  }
  updateSoundIcons(!window.soundEngine.isMuted());

  btnRules.addEventListener('click', () => modalRules.classList.remove('hidden'));
  btnCloseRules.addEventListener('click', () => modalRules.classList.add('hidden'));
  btnRulesGotIt.addEventListener('click', () => modalRules.classList.add('hidden'));

  btnStats.addEventListener('click', () => {
    populateStatsModal();
    modalStatsView.classList.remove('hidden');
  });
  btnCloseStats.addEventListener('click', () => modalStatsView.classList.add('hidden'));
  btnStatsOk.addEventListener('click', () => modalStatsView.classList.add('hidden'));
  btnResetStats.addEventListener('click', () => {
    localStorage.removeItem('dots_stats');
    populateStatsModal();
  });

  btnModalRematch.addEventListener('click', () => {
    modalGameOver.classList.add('hidden');
    restartMatch();
  });
  btnModalClose.addEventListener('click', () => modalGameOver.classList.add('hidden'));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      restartMatch();
    } else if (e.key === 'z' || e.key === 'Z') {
      btnUndo.click();
    } else if (e.key === 'm' || e.key === 'M') {
      btnSound.click();
    } else if (e.key === '?') {
      modalRules.classList.toggle('hidden');
    } else if (e.key === 'Escape') {
      modalRules.classList.add('hidden');
      modalStatsView.classList.add('hidden');
      modalGameOver.classList.add('hidden');
    }
  });

  function restartMatch() {
    isAiThinking = false;
    modalGameOver.classList.add('hidden');
    game = new DotsGame({
      gridSize: parseInt(selectGrid.value, 10),
      mode: selectMode.value,
      difficulty: selectDiff.value,
      onBoxClaimed: handleBoxClaimed,
      onMoveMade: handleMoveMade,
      onGameOver: handleGameOver
    });
    renderBoard();
    updateScoreboard();
  }

  // Build the complete SVG Board geometry
  function renderBoard() {
    boxesLayer.innerHTML = '';
    linesLayer.innerHTML = '';
    dotsLayer.innerHTML = '';
    previewLayer.innerHTML = '';
    hitAreasLayer.innerHTML = '';
    gridBgLayer.innerHTML = '';
    floatersContainer.innerHTML = '';

    const N = game.gridSize;
    const svgSize = 500;
    const padding = 45;
    const boardArea = svgSize - padding * 2;
    const step = boardArea / (N - 1);

    gameSvg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);

    const getDotCoords = (r, c) => ({
      x: padding + c * step,
      y: padding + r * step
    });

    // 1. Visible Unclaimed Tracks (Horizontal and Vertical)
    // Horizontal tracks
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N - 1; c++) {
        const p1 = getDotCoords(r, c);
        const p2 = getDotCoords(r, c + 1);
        const edgeId = `h_${r}_${c}`;
        createTrackLine(edgeId, p1.x, p1.y, p2.x, p2.y);
      }
    }

    // Vertical tracks
    for (let r = 0; r < N - 1; r++) {
      for (let c = 0; c < N; c++) {
        const p1 = getDotCoords(r, c);
        const p2 = getDotCoords(r + 1, c);
        const edgeId = `v_${r}_${c}`;
        createTrackLine(edgeId, p1.x, p1.y, p2.x, p2.y);
      }
    }

    // 2. Boxes Rectangles (empty initial state)
    for (let r = 0; r < N - 1; r++) {
      for (let c = 0; c < N - 1; c++) {
        const { x, y } = getDotCoords(r, c);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.id = `box-rect-${r}_${c}`;
        rect.setAttribute('x', x + 5);
        rect.setAttribute('y', y + 5);
        rect.setAttribute('width', step - 10);
        rect.setAttribute('height', step - 10);
        rect.setAttribute('rx', 8);
        rect.setAttribute('fill', 'transparent');
        rect.classList.add('box-rect');
        boxesLayer.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.id = `box-text-${r}_${c}`;
        text.setAttribute('x', x + step / 2);
        text.setAttribute('y', y + step / 2);
        text.setAttribute('font-size', `${Math.max(14, step * 0.28)}px`);
        text.classList.add('box-text');
        boxesLayer.appendChild(text);
      }
    }

    // 3. Dots (Anchoring the lines)
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const { x, y } = getDotCoords(r, c);
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.id = `dot-${r}_${c}`;
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', N <= 4 ? 7.5 : 6);
        dot.classList.add('svg-dot');
        dotsLayer.appendChild(dot);
      }
    }

    // 4. Interactive Hit-Areas (Generous width for easy mobile and desktop clicking)
    const hitWidth = Math.min(36, step * 0.48);

    // Horizontal Lines Hitboxes
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N - 1; c++) {
        const p1 = getDotCoords(r, c);
        const p2 = getDotCoords(r, c + 1);
        const edgeId = `h_${r}_${c}`;
        createHitbox(edgeId, p1.x, p1.y, p2.x, p2.y, hitWidth);
      }
    }

    // Vertical Lines Hitboxes
    for (let r = 0; r < N - 1; r++) {
      for (let c = 0; c < N; c++) {
        const p1 = getDotCoords(r, c);
        const p2 = getDotCoords(r + 1, c);
        const edgeId = `v_${r}_${c}`;
        createHitbox(edgeId, p1.x, p1.y, p2.x, p2.y, hitWidth);
      }
    }
  }

  function createTrackLine(edgeId, x1, y1, x2, y2) {
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    track.id = `track-${edgeId}`;
    track.setAttribute('x1', x1);
    track.setAttribute('y1', y1);
    track.setAttribute('x2', x2);
    track.setAttribute('y2', y2);
    track.classList.add('svg-grid-line');
    gridBgLayer.appendChild(track);
  }

  function createHitbox(edgeId, x1, y1, x2, y2, strokeWidth) {
    const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitbox.id = `hitbox-${edgeId}`;
    hitbox.setAttribute('x1', x1);
    hitbox.setAttribute('y1', y1);
    hitbox.setAttribute('x2', x2);
    hitbox.setAttribute('y2', y2);
    hitbox.setAttribute('stroke-width', strokeWidth);
    hitbox.classList.add('svg-hitbox');

    // Hover Preview: illuminates the track and shows preview line
    hitbox.addEventListener('mouseenter', () => {
      if (game.edges[edgeId] || isAiThinking || game.isOver) return;
      window.soundEngine.playTick();
      highlightTrack(edgeId, true);
      showHoverPreview(x1, y1, x2, y2);
    });

    hitbox.addEventListener('mouseleave', () => {
      highlightTrack(edgeId, false);
      clearHoverPreview();
    });

    hitbox.addEventListener('click', () => {
      if (game.edges[edgeId] || isAiThinking || game.isOver) return;
      highlightTrack(edgeId, false);
      clearHoverPreview();
      makeUserMove(edgeId);
    });

    hitAreasLayer.appendChild(hitbox);
  }

  function highlightTrack(edgeId, isHovered) {
    const track = document.getElementById(`track-${edgeId}`);
    if (!track) return;
    if (isHovered) {
      track.classList.add(game.turn === 1 ? 'track-hover-p1' : 'track-hover-p2');
    } else {
      track.classList.remove('track-hover-p1', 'track-hover-p2');
    }
  }

  function showHoverPreview(x1, y1, x2, y2) {
    clearHoverPreview();
    previewLineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    previewLineEl.setAttribute('x1', x1);
    previewLineEl.setAttribute('y1', y1);
    previewLineEl.setAttribute('x2', x2);
    previewLineEl.setAttribute('y2', y2);
    previewLineEl.classList.add('svg-preview-line');
    previewLineEl.classList.add(game.turn === 1 ? 'preview-p1' : 'preview-p2');
    previewLayer.appendChild(previewLineEl);
  }

  function clearHoverPreview() {
    if (previewLineEl) {
      previewLineEl.remove();
      previewLineEl = null;
    }
  }

  function makeUserMove(edgeId) {
    const res = game.makeMove(edgeId);
    if (!res.success) return;

    window.soundEngine.playLine(res.player);

    if (game.mode === 'pve' && game.turn === 2 && !game.isOver) {
      triggerAiMove();
    }
  }

  function triggerAiMove() {
    isAiThinking = true;
    updateScoreboard();

    const delay = 450 + Math.random() * 200;
    setTimeout(() => {
      if (game.isOver) {
        isAiThinking = false;
        return;
      }

      const aiEdge = game.ai.computeMove(game.difficulty);
      if (aiEdge) {
        const res = game.makeMove(aiEdge);
        if (res.success) {
          window.soundEngine.playLine(2);
        }

        if (res.extraTurn && !game.isOver) {
          triggerAiMove();
        } else {
          isAiThinking = false;
          updateScoreboard();
        }
      } else {
        isAiThinking = false;
        updateScoreboard();
      }
    }, delay);
  }

  function handleMoveMade(data) {
    drawLine(data.edgeId, data.player);
    updateScoreboard();
  }

  function drawLine(edgeId, player) {
    const existing = document.getElementById(`line-${edgeId}`);
    if (existing) return;

    const hitbox = document.getElementById(`hitbox-${edgeId}`);
    if (!hitbox) return;

    const x1 = hitbox.getAttribute('x1');
    const y1 = hitbox.getAttribute('y1');
    const x2 = hitbox.getAttribute('x2');
    const y2 = hitbox.getAttribute('y2');

    // Hide the dashed track underneath
    const track = document.getElementById(`track-${edgeId}`);
    if (track) {
      track.style.opacity = '0';
      track.classList.remove('track-hover-p1', 'track-hover-p2');
    }

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.id = `line-${edgeId}`;
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.classList.add('svg-line');
    line.classList.add(player === 1 ? 'line-p1' : 'line-p2');

    linesLayer.appendChild(line);
  }

  function handleBoxClaimed(data) {
    const { box, player, combo } = data;
    const rect = document.getElementById(`box-rect-${box.key}`);
    const text = document.getElementById(`box-text-${box.key}`);

    if (rect) {
      rect.className.baseVal = `box-rect ${player === 1 ? 'box-p1' : 'box-p2'}`;
    }

    if (text) {
      text.textContent = player === 1 ? 'P1' : (game.mode === 'pvp' ? 'P2' : 'AI');
      text.className.baseVal = `box-text ${player === 1 ? 'text-p1' : 'text-p2'}`;
    }

    window.soundEngine.playBoxCapture(combo);

    if (rect) {
      const boxRect = rect.getBoundingClientRect();
      const centerX = boxRect.left + boxRect.width / 2;
      const centerY = boxRect.top + boxRect.height / 2;
      particleEngine.burst(centerX, centerY, player === 1 ? '#00f2fe' : '#ff2a6d', 24);
      spawnFloatingBadge(centerX, centerY, player, combo);
    }

    const scoreEl = player === 1 ? scoreP1 : scoreP2;
    scoreEl.classList.remove('score-bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-bump');
  }

  function spawnFloatingBadge(x, y, player, combo) {
    const badge = document.createElement('div');
    badge.className = `floater-pill ${player === 1 ? 'floater-p1' : 'floater-p2'}`;
    badge.style.left = `${x}px`;
    badge.style.top = `${y}px`;
    badge.textContent = combo > 1 ? `+1 COMBO x${combo}!` : '+1';

    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 1200);
  }

  function updateScoreboard() {
    scoreP1.textContent = game.scores[1];
    scoreP2.textContent = game.scores[2];

    const totalBoxes = game.getTotalBoxesCount();
    const remaining = game.getRemainingBoxesCount();
    remainingCountText.textContent = `${remaining} box${remaining === 1 ? '' : 'es'} unclaimed`;

    const p1Pct = (game.scores[1] / totalBoxes) * 100;
    const p2Pct = (game.scores[2] / totalBoxes) * 100;
    barP1.style.width = `${p1Pct}%`;
    barP2.style.width = `${p2Pct}%`;

    cardP1.classList.toggle('active-card', game.turn === 1 && !game.isOver);
    cardP2.classList.toggle('active-card', game.turn === 2 && !game.isOver);

    turnBadge.className = 'turn-badge';
    if (!game.isOver) {
      if (game.turn === 1) {
        turnBadge.classList.add('turn-p1');
        turnText.textContent = game.mode === 'pvp' ? "Player 1's Turn" : 'Your Turn';
      } else {
        turnBadge.classList.add('turn-p2');
        if (game.mode === 'pvp') {
          turnText.textContent = "Player 2's Turn";
        } else {
          turnText.textContent = isAiThinking ? 'AI is thinking...' : "AI's Turn";
        }
      }
    } else {
      turnText.textContent = 'Game Over';
    }

    if (game.currentCombo >= 2 && !game.isOver) {
      comboBanner.classList.remove('hidden');
      comboCount.textContent = `Combo x${game.currentCombo}!`;
    } else {
      comboBanner.classList.add('hidden');
    }

    btnUndo.disabled = game.history.length === 0 || isAiThinking || game.isOver;
  }

  function refreshBoardVisuals() {
    linesLayer.innerHTML = '';
    for (let r = 0; r < game.gridSize; r++) {
      for (let c = 0; c < game.gridSize; c++) {
        const hId = `h_${r}_${c}`;
        const vId = `v_${r}_${c}`;
        const th = document.getElementById(`track-${hId}`);
        const tv = document.getElementById(`track-${vId}`);
        if (th) th.style.opacity = '1';
        if (tv) tv.style.opacity = '1';
      }
    }

    for (const [edgeId, data] of Object.entries(game.edges)) {
      drawLine(edgeId, data.player);
    }

    for (const [boxKey, box] of Object.entries(game.boxes)) {
      const rect = document.getElementById(`box-rect-${boxKey}`);
      const text = document.getElementById(`box-text-${boxKey}`);
      if (box.owner) {
        rect.className.baseVal = `box-rect ${box.owner === 1 ? 'box-p1' : 'box-p2'}`;
        text.textContent = box.owner === 1 ? 'P1' : (game.mode === 'pvp' ? 'P2' : 'AI');
        text.className.baseVal = `box-text ${box.owner === 1 ? 'text-p1' : 'text-p2'}`;
      } else {
        rect.className.baseVal = 'box-rect';
        text.textContent = '';
      }
    }
  }

  function handleGameOver(summary) {
    isAiThinking = false;
    updateScoreboard();

    if (summary.winner === 1 || (game.mode === 'pvp' && summary.winner)) {
      window.soundEngine.playVictory();
      particleEngine.confettiShower();
      setTimeout(() => particleEngine.confettiShower(), 400);
    }

    const trophyEl = document.getElementById('modal-trophy');
    const titleEl = document.getElementById('modal-winner-title');
    const subtitleEl = document.getElementById('modal-winner-subtitle');

    if (summary.winner === 1) {
      trophyEl.textContent = '🏆';
      titleEl.textContent = 'VICTORY!';
      subtitleEl.textContent = game.mode === 'pve' ? 'You outmaneuvered the AI!' : 'Player 1 wins the match!';
    } else if (summary.winner === 2) {
      trophyEl.textContent = game.mode === 'pve' ? '🤖' : '🏆';
      titleEl.textContent = game.mode === 'pve' ? 'DEFEAT' : 'VICTORY!';
      subtitleEl.textContent = game.mode === 'pve' ? 'AI Bot claimed the board.' : 'Player 2 wins the match!';
    } else {
      trophyEl.textContent = '🤝';
      titleEl.textContent = 'DRAW!';
      subtitleEl.textContent = 'A legendary tactical standoff!';
    }

    document.getElementById('summary-score-p1').textContent = summary.scores[1];
    document.getElementById('summary-score-p2').textContent = summary.scores[2];
    document.getElementById('summary-name-p2').textContent = game.mode === 'pvp' ? 'Player 2' : 'AI Bot';

    const b1 = document.getElementById('summary-badge-p1');
    const b2 = document.getElementById('summary-badge-p2');

    if (summary.winner === 1) {
      b1.textContent = 'Winner';
      b1.className = 'summary-badge winner-badge';
      b2.textContent = 'Defeated';
      b2.className = 'summary-badge loser-badge';
    } else if (summary.winner === 2) {
      b2.textContent = 'Winner';
      b2.className = 'summary-badge winner-badge';
      b1.textContent = 'Defeated';
      b1.className = 'summary-badge loser-badge';
    } else {
      b1.textContent = 'Draw';
      b1.className = 'summary-badge';
      b2.textContent = 'Draw';
      b2.className = 'summary-badge';
    }

    document.getElementById('summary-total-moves').textContent = summary.totalMoves;
    document.getElementById('summary-max-combo').textContent = `${summary.maxCombo}x`;

    const mins = Math.floor(summary.duration / 60).toString().padStart(2, '0');
    const secs = (summary.duration % 60).toString().padStart(2, '0');
    document.getElementById('summary-time').textContent = `${mins}:${secs}`;

    setTimeout(() => {
      modalGameOver.classList.remove('hidden');
    }, 600);
  }

  function populateStatsModal() {
    try {
      const stats = JSON.parse(localStorage.getItem('dots_stats') || '{}');
      const played = stats.gamesPlayed || 0;
      const wins = stats.p1Wins || 0;
      const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

      document.getElementById('stats-games-played').textContent = played;
      document.getElementById('stats-win-rate').textContent = `${winRate}%`;
      document.getElementById('stats-boxes-captured').textContent = stats.boxesCaptured || 0;
      document.getElementById('stats-best-combo').textContent = `${stats.bestCombo || 0}x`;
    } catch (e) {}
  }
});
