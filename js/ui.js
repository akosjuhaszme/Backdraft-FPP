// ── UI Manager ──
// Handles HUD, timer, menus, penalty display, finish screen

export class UIManager {
  constructor() {
    this.timerDisplay = document.getElementById('timer-display');
    this.penaltyTotal = document.getElementById('penalty-total');
    this.stationInfo = document.getElementById('station-info');
    this.progressContainer = document.getElementById('progress-bar-container');
    this.hud = document.getElementById('hud');
    this.interactionBtn = document.getElementById('interaction-btn');
    this.menuScreen = document.getElementById('menu-screen');
    this.finishScreen = document.getElementById('finish-screen');
    this.finishTime = document.getElementById('finish-time');
    this.finishPenalties = document.getElementById('finish-penalties');
    this.penaltyBreakdown = document.getElementById('penalty-breakdown');
    this.retryBtn = document.getElementById('retry-btn');
    this.directionArrow = document.getElementById('direction-arrow');
    this.gestureInstruction = document.getElementById('gesture-instruction');
    this.instructionOverlay = document.getElementById('instruction-overlay');
    this.hammerCounter = document.getElementById('hammer-counter');
    this.loading = document.getElementById('loading');
    this.crosshair = document.getElementById('crosshair');

    this.penalties = [];
    this.totalPenalty = 0;
    this.timerRunning = false;
    this.startTime = 0;
    this.elapsed = 0;

    // Build progress dots
    this.progressContainer.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      dot.dataset.station = i;
      this.progressContainer.appendChild(dot);
    }
  }

  hideLoading() {
    this.loading.style.display = 'none';
  }

  showMenu() {
    this.menuScreen.style.display = 'flex';
  }

  hideMenu() {
    this.menuScreen.style.display = 'none';
  }

  showHUD() {
    this.hud.style.display = 'block';
  }

  hideHUD() {
    this.hud.style.display = 'none';
  }

  showCrosshair() {
    this.crosshair.style.display = 'block';
  }

  // Timer
  startTimer() {
    this.startTime = performance.now();
    this.timerRunning = true;
  }

  stopTimer() {
    this.timerRunning = false;
  }

  getElapsed() {
    return this.elapsed;
  }

  getTotalTime() {
    return this.elapsed + this.totalPenalty * 1000;
  }

  updateTimer() {
    if (!this.timerRunning) return;
    this.elapsed = performance.now() - this.startTime;
    this.timerDisplay.textContent = this.formatTime(this.elapsed);
    if (this.totalPenalty > 0) {
      this.penaltyTotal.textContent = `+${this.totalPenalty}s buntetes`;
    }
  }

  formatTime(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const millis = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  // Penalties
  addPenalty(seconds, reason) {
    this.totalPenalty += seconds;
    this.penalties.push({ seconds, reason });
    this.showPenaltyFloat(seconds, reason);
  }

  showPenaltyFloat(seconds, reason) {
    const el = document.createElement('div');
    el.className = 'penalty-float';
    el.textContent = `+${seconds}s BUNTETES!`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }

  showStationComplete(name) {
    const el = document.createElement('div');
    el.className = 'station-complete-float';
    el.textContent = `${name} - KESZ!`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }

  // Station info
  setStationInfo(text) {
    this.stationInfo.textContent = text;
  }

  updateProgress(currentStation) {
    const dots = this.progressContainer.children;
    for (let i = 0; i < dots.length; i++) {
      dots[i].className = 'progress-dot';
      if (i < currentStation) dots[i].classList.add('completed');
      else if (i === currentStation) dots[i].classList.add('current');
    }
  }

  // Interaction button
  showInteraction(text, callback, isGesture = false) {
    this.interactionBtn.textContent = text;
    this.interactionBtn.style.display = 'block';
    this.interactionBtn.className = isGesture ? 'gesture-hint' : '';
    this.interactionBtn.onclick = (e) => {
      e.stopPropagation();
      callback();
    };
    this.interactionBtn.ontouchstart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      callback();
    };
  }

  hideInteraction() {
    this.interactionBtn.style.display = 'none';
    this.interactionBtn.onclick = null;
    this.interactionBtn.ontouchstart = null;
  }

  // Instruction overlay
  showInstruction(text) {
    this.instructionOverlay.textContent = text;
    this.instructionOverlay.style.display = 'block';
  }

  hideInstruction() {
    this.instructionOverlay.style.display = 'none';
  }

  // Gesture instruction
  showGesture(text) {
    this.gestureInstruction.textContent = text;
    this.gestureInstruction.style.display = 'block';
  }

  hideGesture() {
    this.gestureInstruction.style.display = 'none';
  }

  // Hammer counter
  showHammerCount(current, total) {
    this.hammerCounter.style.display = 'block';
    this.hammerCounter.textContent = `${current}/${total}`;
  }

  hideHammerCount() {
    this.hammerCounter.style.display = 'none';
  }

  // Direction arrow
  showArrow() {
    this.directionArrow.style.display = 'block';
  }

  hideArrow() {
    this.directionArrow.style.display = 'none';
  }

  // Finish screen
  showFinish() {
    const totalMs = this.elapsed;
    const finalMs = totalMs + this.totalPenalty * 1000;

    this.finishTime.textContent = this.formatTime(finalMs);
    this.finishPenalties.textContent = this.totalPenalty > 0
      ? `Ido: ${this.formatTime(totalMs)} + ${this.totalPenalty}s buntetes`
      : `Tiszta ido, nincs buntetes!`;

    this.penaltyBreakdown.innerHTML = '';
    if (this.penalties.length === 0) {
      this.penaltyBreakdown.innerHTML = '<div>Nincs buntetes - tokeletes futam!</div>';
    } else {
      this.penalties.forEach(p => {
        const div = document.createElement('div');
        div.textContent = `+${p.seconds}s - ${p.reason}`;
        this.penaltyBreakdown.appendChild(div);
      });
    }

    this.finishScreen.style.display = 'flex';
    this.hideHUD();
    this.hideInteraction();
    this.hideInstruction();
    this.hideGesture();
    this.hideArrow();
  }

  hideFinish() {
    this.finishScreen.style.display = 'none';
  }

  reset() {
    this.penalties = [];
    this.totalPenalty = 0;
    this.timerRunning = false;
    this.startTime = 0;
    this.elapsed = 0;
    this.timerDisplay.textContent = '00:00.000';
    this.penaltyTotal.textContent = '';
    this.hideFinish();
    this.hideInteraction();
    this.hideInstruction();
    this.hideGesture();
    this.hideArrow();
    this.hideHammerCount();
  }
}
