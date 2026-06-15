import * as THREE from 'three';
import { ControlsManager } from './controls.js';
import { UIManager } from './ui.js';
import { StationManager } from './stations.js';

class Game {
  constructor() {
    this.ui = new UIManager();
    this.category = 'strong';
    this.clock = new THREE.Clock();

    this._setupRenderer();
    this._setupScene();
    this._setupCamera();
    this._setupLights();
    this._setupControls();
    this._setupMenu();

    this.stations = new StationManager(this.scene, this.ui, this.controls, this.category);

    this.ui.hideLoading();
    this.ui.showMenu();

    this._animate();
  }

  _setupRenderer() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
  }

  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 1.7, 2);
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.camera.far = 200;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x4a7c3f, 0.4);
    this.scene.add(hemi);
  }

  _setupControls() {
    this.controls = new ControlsManager(this.camera, this.canvas);
  }

  _setupMenu() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    const selectCategory = (btn) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.category = btn.dataset.category;
    };
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => selectCategory(btn));
      btn.addEventListener('touchend', (e) => { e.preventDefault(); selectCategory(btn); }, { passive: false });
    });

    const startBtn = document.getElementById('start-game-btn');
    const doStart = (e) => { if (e) e.preventDefault(); this._startGame(); };
    startBtn.addEventListener('click', doStart);
    startBtn.addEventListener('touchend', doStart, { passive: false });

    const retryBtn = document.getElementById('retry-btn');
    const doRetry = (e) => { if (e) e.preventDefault(); this._restart(); };
    retryBtn.addEventListener('click', doRetry);
    retryBtn.addEventListener('touchend', doRetry, { passive: false });
  }

  _startGame() {
    this.ui.hideMenu();
    this.ui.showHUD();

    if (!this.controls.isMobile) {
      this.ui.showCrosshair();
    }

    this.camera.position.set(0, 1.7, 2);
    this.controls.euler.set(0, 0, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.controls.euler);

    this.stations.reset(this.category);
    this.ui.reset();
    this.ui.showHUD();
    this.ui.setStationInfo('1/10 - Rajt');
    this.ui.updateProgress(0);

    this.controls.enable();
  }

  _restart() {
    this.ui.hideFinish();
    this._startGame();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.controls.update(delta, (newPos) => this.stations.getCollisionPosition(newPos));

    this.stations.update();

    this._updateDirectionArrow();

    this.renderer.render(this.scene, this.camera);
  }

  _updateDirectionArrow() {
    if (!this.stations.gameStarted || this.stations.gameFinished) return;

    const arrow = document.getElementById('direction-arrow');
    const target = this.stations.getCurrentStationPos();
    const pos = this.camera.position;

    const dir = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z).normalize();
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const angle = Math.atan2(
      forward.x * dir.z - forward.z * dir.x,
      forward.x * dir.x + forward.z * dir.z
    );

    arrow.style.display = 'block';
    arrow.style.transform = `translateX(-50%) rotate(${-angle * 180 / Math.PI}deg)`;

    const dist = this.stations.getDistToStation();
    arrow.style.opacity = dist < 5 ? '0.2' : '0.7';
  }
}

try {
  new Game();
} catch (err) {
  const el = document.getElementById('error-display');
  if (el) {
    el.style.display = 'flex';
    el.textContent = 'Hiba tortent: ' + err.message;
  }
  console.error(err);
}
