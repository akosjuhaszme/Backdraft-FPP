// ── Controls Manager ──
// Touch controls (virtual joystick + look) and desktop fallback

import * as THREE from 'three';

export class ControlsManager {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveVector = new THREE.Vector2(0, 0); // joystick

    // Look state
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.euler.y = 0;
    this.locked = false;

    // Speed
    this.moveSpeed = 8;
    this.lookSensitivity = 0.003;
    this.touchLookSensitivity = 0.004;

    // Joystick state
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickThumb = document.getElementById('joystick-thumb');
    this.joystickZone = document.getElementById('joystick-zone');

    // Look touch state
    this.lookTouchId = null;
    this.lookPrev = { x: 0, y: 0 };
    this.lookZone = document.getElementById('look-zone');

    // Direction (for physics)
    this.direction = new THREE.Vector3();
    this.velocity = new THREE.Vector3();

    this.enabled = false;

    // Weight modifier (slows movement)
    this.weightModifier = 1.0;

    this._setupControls();
  }

  _setupControls() {
    if (this.isMobile) {
      this._setupTouch();
    } else {
      this._setupDesktop();
    }
  }

  _setupTouch() {
    const jz = this.joystickZone;

    jz.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      for (const touch of e.changedTouches) {
        if (this.joystickTouchId === null) {
          this.joystickTouchId = touch.identifier;
          this.joystickActive = true;
          this.joystickCenter = { x: touch.clientX, y: touch.clientY };

          this.joystickBase.style.display = 'block';
          this.joystickBase.style.left = (touch.clientX - 60) + 'px';
          this.joystickBase.style.top = (touch.clientY - 60) + 'px';
          this.joystickThumb.style.display = 'block';
          this.joystickThumb.style.left = (touch.clientX - 25) + 'px';
          this.joystickThumb.style.top = (touch.clientY - 25) + 'px';
        }
      }
    }, { passive: true });

    jz.addEventListener('touchmove', (e) => {
      if (!this.enabled) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          const dx = touch.clientX - this.joystickCenter.x;
          const dy = touch.clientY - this.joystickCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 50;
          const clampedDist = Math.min(dist, maxDist);
          const angle = Math.atan2(dy, dx);

          const cx = Math.cos(angle) * clampedDist;
          const cy = Math.sin(angle) * clampedDist;

          this.joystickThumb.style.left = (this.joystickCenter.x + cx - 25) + 'px';
          this.joystickThumb.style.top = (this.joystickCenter.y + cy - 25) + 'px';

          this.moveVector.x = cx / maxDist;
          this.moveVector.y = cy / maxDist;
        }
      }
    }, { passive: true });

    const endJoystick = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.joystickActive = false;
          this.moveVector.set(0, 0);
          this.joystickBase.style.display = 'none';
          this.joystickThumb.style.display = 'none';
        }
      }
    };
    jz.addEventListener('touchend', endJoystick, { passive: true });
    jz.addEventListener('touchcancel', endJoystick, { passive: true });

    // Look zone
    const lz = this.lookZone;

    lz.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      for (const touch of e.changedTouches) {
        if (this.lookTouchId === null) {
          this.lookTouchId = touch.identifier;
          this.lookPrev = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: true });

    lz.addEventListener('touchmove', (e) => {
      if (!this.enabled) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.lookTouchId) {
          const dx = touch.clientX - this.lookPrev.x;
          const dy = touch.clientY - this.lookPrev.y;
          this.lookPrev = { x: touch.clientX, y: touch.clientY };

          this.euler.y -= dx * this.touchLookSensitivity;
          this.euler.x -= dy * this.touchLookSensitivity;
          this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.euler.x));
          this.camera.quaternion.setFromEuler(this.euler);
        }
      }
    }, { passive: true });

    const endLook = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.lookTouchId) {
          this.lookTouchId = null;
        }
      }
    };
    lz.addEventListener('touchend', endLook, { passive: true });
    lz.addEventListener('touchcancel', endLook, { passive: true });
  }

  _setupDesktop() {
    // Pointer lock
    this.domElement.addEventListener('click', () => {
      if (this.enabled && !this.locked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.enabled) return;
      this.euler.y -= e.movementX * this.lookSensitivity;
      this.euler.x -= e.movementY * this.lookSensitivity;
      this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });

    // WASD
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
      }
    });

    // E key for interaction
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && this.enabled) {
        const btn = document.getElementById('interaction-btn');
        if (btn.style.display !== 'none' && btn.onclick) {
          btn.onclick();
        }
      }
    });
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveVector.set(0, 0);
  }

  setWeightModifier(mod) {
    this.weightModifier = mod;
  }

  update(delta, collisionCheck) {
    if (!this.enabled) return;

    const speed = this.moveSpeed * this.weightModifier * delta;

    // Get camera forward/right on XZ plane
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();

    if (this.isMobile) {
      // Joystick: x = left/right, y = forward/backward (inverted)
      move.add(right.clone().multiplyScalar(this.moveVector.x * speed));
      move.add(forward.clone().multiplyScalar(-this.moveVector.y * speed));
    } else {
      if (this.moveForward) move.add(forward.clone().multiplyScalar(speed));
      if (this.moveBackward) move.add(forward.clone().multiplyScalar(-speed));
      if (this.moveLeft) move.add(right.clone().multiplyScalar(-speed));
      if (this.moveRight) move.add(right.clone().multiplyScalar(speed));
    }

    if (move.lengthSq() > 0) {
      const newPos = this.camera.position.clone().add(move);

      // Simple collision: check if new position is valid
      if (collisionCheck) {
        const result = collisionCheck(newPos);
        this.camera.position.copy(result);
      } else {
        this.camera.position.add(move);
      }
    }
  }
}
