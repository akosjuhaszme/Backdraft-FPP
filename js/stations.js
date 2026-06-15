import * as THREE from 'three';

const STATION_NAMES = [
  'Rajt',
  'Ajtonnyitas',
  'TFA Kalapalas',
  'Kozmuzaras',
  'Sulycipeles',
  'Osztokotes',
  'Legzolevetal',
  'Kapcsolas',
  'Tomlo felszedes',
  'Cel'
];

const STATION_INSTRUCTIONS = [
  'Allj a rajtszonyegre es nyomd meg a START gombot!',
  'Vedd fel a Halligan Tool-t es feszitsd ki az ajtoeket!',
  'Vedd fel a kalapcsot es kalapalj fel-le!',
  'Kapcsold le a kismegszakitokat es zard el a gazt!',
  'Vedd fel a legzokeszuleket es a tuzoltokeszulekeket!',
  'Kosd meg a kotelet a helyes sorrendben!',
  'Tedd le a felszereleseket a kijelolt helyre!',
  'Kapcsold ossze a B tomlokat es kosd az osztohoz!',
  'Tekerd fel a tomlokat es rakd a dobozokba!',
  'Fuss a celba!'
];

export class StationManager {
  constructor(scene, ui, controls, category) {
    this.scene = scene;
    this.ui = ui;
    this.controls = controls;
    this.category = category;
    this.currentStation = 0;
    this.stationObjects = [];
    this.stationPositions = [];
    this.stationPhase = 'approach';
    this.interactionRadius = 8;
    this.gameStarted = false;
    this.gameFinished = false;

    this._hammerCount = 0;
    this._hammerTarget = category === 'strong' ? 40 : category === 'women' ? 20 : 10;
    this._hammerPhase = 'up';
    this._toolPickedUp = false;
    this._toolPlacedBack = false;
    this._doorOpened = false;
    this._doorPassed = false;

    this._breakersOff = [false, false, false];
    this._valveClosed = false;

    this._scbaOn = false;
    this._extinguisherPickedUp = false;

    this._knotStep = 0;
    this._knotTotal = 4;

    this._equipmentDropped = false;

    this._hosesConnected = [];
    this._hoseTotal = 4;

    this._rollProgress = [0, 0];
    this._currentRoll = 0;
    this._rollAngle = 0;
    this._lastRollAngle = 0;

    this._buildCourse();
  }

  _buildCourse() {
    const positions = [
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, 0.1, -25),
      new THREE.Vector3(0, 8, -50),
      new THREE.Vector3(5, 12, -70),
      new THREE.Vector3(15, 12, -85),
      new THREE.Vector3(30, 14, -100),
      new THREE.Vector3(15, 12, -85),
      new THREE.Vector3(-10, 16, -115),
      new THREE.Vector3(-10, 22, -135),
      new THREE.Vector3(0, 22, -150),
    ];
    this.stationPositions = positions;

    this._buildGround();
    this._buildPaths();
    this._buildStation0_Start();
    this._buildStation1_Door();
    this._buildStation2_Hammer();
    this._buildStation3_Utility();
    this._buildStation4_Weight();
    this._buildStation5_Knot();
    this._buildStation6_Remove();
    this._buildStation7_Coupling();
    this._buildStation8_Roll();
    this._buildStation9_Finish();
    this._buildEnvironment();
  }

  _mat(color) {
    return new THREE.MeshLambertMaterial({ color });
  }

  _addMesh(geo, mat, pos, name) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (name) mesh.name = name;
    this.scene.add(mesh);
    return mesh;
  }

  _buildGround() {
    const ground = this._addMesh(
      new THREE.PlaneGeometry(200, 300),
      new THREE.MeshLambertMaterial({ color: 0x4a7c3f }),
      new THREE.Vector3(0, -0.5, -75)
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
  }

  _buildPaths() {
    const pathMat = this._mat(0x999999);
    const stoneMat = this._mat(0xbbaa99);

    const createPath = (x, z, w, d, y = 0, ry = 0) => {
      const m = this._addMesh(new THREE.BoxGeometry(w, 0.2, d), stoneMat, new THREE.Vector3(x, y, z));
      m.rotation.y = ry;
      return m;
    };

    createPath(0, -12, 4, 25, 0);

    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      const y = t * 8;
      const z = -25 - i * 1.6;
      this._addMesh(
        new THREE.BoxGeometry(6, 0.5, 1.6),
        this._mat(0xaa9988),
        new THREE.Vector3(0, y, z)
      );
    }

    createPath(2.5, -60, 4, 20, 10);

    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const y = 10 + t * 2;
      const z = -65 - i * 1.2;
      this._addMesh(
        new THREE.BoxGeometry(6, 0.5, 1.2),
        this._mat(0xaa9988),
        new THREE.Vector3(3, y, z)
      );
    }

    createPath(10, -78, 20, 4, 12);
    createPath(22, -92, 4, 25, 13, 0.3);

    createPath(15, -85, 6, 6, 12);

    createPath(-5, -105, 4, 30, 14, 0.1);

    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const y = 16 + t * 6;
      const z = -118 - i * 1.3;
      this._addMesh(
        new THREE.BoxGeometry(6, 0.5, 1.3),
        this._mat(0xaa9988),
        new THREE.Vector3(-10, y, z)
      );
    }

    createPath(0, -148, 20, 10, 22);
  }

  _buildStation0_Start() {
    const pos = this.stationPositions[0];
    this._addMesh(
      new THREE.BoxGeometry(3, 0.05, 2),
      this._mat(0xcc2222),
      new THREE.Vector3(pos.x, 0.05, pos.z),
      'start-mat'
    );
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3);
    this._addMesh(poleGeo, this._mat(0xff6600), new THREE.Vector3(pos.x - 2, 1.5, pos.z));
    this._addMesh(poleGeo, this._mat(0xff6600), new THREE.Vector3(pos.x + 2, 1.5, pos.z));

    const banner = this._addMesh(
      new THREE.BoxGeometry(4, 0.8, 0.1),
      this._mat(0xff6600),
      new THREE.Vector3(pos.x, 2.8, pos.z),
      'start-banner'
    );
  }

  _buildStation1_Door() {
    const pos = this.stationPositions[1];

    const frameMat = this._mat(0x333333);
    const frame = new THREE.Group();
    frame.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), frameMat));
    frame.children[0].position.set(-1.2, 1.25, 0);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), frameMat);
    r.position.set(1.2, 1.25, 0);
    frame.add(r);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.15, 0.15), frameMat);
    top.position.set(0, 2.5, 0);
    frame.add(top);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.3, 0.08),
      this._mat(0x666666)
    );
    door.position.set(0, 1.2, 0);
    door.name = 'door-panel';
    frame.add(door);

    const wedge = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.3, 0.12),
      this._mat(0xcc8844)
    );
    wedge.position.set(1.0, 1.0, 0.1);
    wedge.name = 'door-wedge';
    frame.add(wedge);

    frame.position.copy(pos);
    this.scene.add(frame);
    this._doorGroup = frame;

    const toolSpot = this._addMesh(
      new THREE.BoxGeometry(0.8, 0.05, 0.5),
      this._mat(0xcc2222),
      new THREE.Vector3(pos.x - 2, pos.y, pos.z + 1),
      'tool-spot'
    );

    const halligan = this._addMesh(
      new THREE.BoxGeometry(0.08, 0.8, 0.08),
      this._mat(0x444444),
      new THREE.Vector3(pos.x - 2, pos.y + 0.4, pos.z + 1),
      'halligan'
    );
    this._halligan = halligan;
  }

  _buildStation2_Hammer() {
    const pos = this.stationPositions[2];

    const stand = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3),
      this._mat(0x666666)
    );
    pole.position.set(0, 1.5, 0);
    stand.add(pole);

    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 0.1),
      this._mat(0xff4444)
    );
    topBar.position.set(0, 2.8, 0);
    topBar.name = 'hammer-top';
    stand.add(topBar);

    const bottomBar = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 0.1),
      this._mat(0x4444ff)
    );
    bottomBar.position.set(0, 0.3, 0);
    bottomBar.name = 'hammer-bottom';
    stand.add(bottomBar);

    const hammer = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.6, 0.12),
      this._mat(0x884400)
    );
    hammer.position.set(0.6, 1.5, 0);
    hammer.name = 'hammer-tool';
    stand.add(hammer);

    stand.position.copy(pos);
    this.scene.add(stand);
    this._hammerStand = stand;
  }

  _buildStation3_Utility() {
    const pos = this.stationPositions[3];

    const panel = new THREE.Group();

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.2, 0.15),
      this._mat(0x555555)
    );
    board.position.set(0, 1.2, 0);
    panel.add(board);

    for (let i = 0; i < 3; i++) {
      const breaker = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.35, 0.1),
        this._mat(0xff4444)
      );
      breaker.position.set(-0.4 + i * 0.4, 1.3, 0.1);
      breaker.name = `breaker-${i}`;
      panel.add(breaker);
    }

    const valveBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.1),
      this._mat(0x888888)
    );
    valveBase.position.set(0, 0.5, 0.1);
    panel.add(valveBase);

    const valveHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.08, 0.08),
      this._mat(0xffcc00)
    );
    valveHandle.position.set(0, 0.5, 0.15);
    valveHandle.name = 'gas-valve';
    panel.add(valveHandle);
    this._valveHandle = valveHandle;

    const memorial = this._addMesh(
      new THREE.BoxGeometry(2, 0.6, 0.3),
      this._mat(0x887766),
      new THREE.Vector3(pos.x + 2, pos.y + 0.3, pos.z)
    );

    panel.position.copy(pos);
    this.scene.add(panel);
    this._utilityPanel = panel;
  }

  _buildStation4_Weight() {
    const pos = this.stationPositions[4];

    const spotMat = this._mat(0xcc2222);
    this._addMesh(
      new THREE.BoxGeometry(1.5, 0.05, 1),
      spotMat,
      new THREE.Vector3(pos.x, pos.y, pos.z),
      'scba-spot'
    );

    const scba = this._addMesh(
      new THREE.BoxGeometry(0.4, 0.6, 0.3),
      this._mat(0xdd3333),
      new THREE.Vector3(pos.x, pos.y + 0.35, pos.z),
      'scba'
    );

    const tank = this._addMesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.5),
      this._mat(0x222222),
      new THREE.Vector3(pos.x, pos.y + 0.35, pos.z - 0.25),
      'scba-tank'
    );

    this._addMesh(
      new THREE.BoxGeometry(1.5, 0.05, 1),
      spotMat,
      new THREE.Vector3(pos.x + 1.5, pos.y, pos.z),
      'ext-spot'
    );

    for (let i = 0; i < 2; i++) {
      const ext = this._addMesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5),
        this._mat(0x111111),
        new THREE.Vector3(pos.x + 1.2 + i * 0.6, pos.y + 0.3, pos.z),
        `extinguisher-${i}`
      );
    }
  }

  _buildStation5_Knot() {
    const pos = this.stationPositions[5];

    const railing = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.2),
        this._mat(0x444444)
      );
      p.position.set(i * 0.6 - 1.2, 0.6, 0);
      railing.add(p);
    }
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.08, 0.08),
      this._mat(0x444444)
    );
    rail.position.set(0, 1.2, 0);
    railing.add(rail);

    railing.position.copy(pos);
    railing.position.y = pos.y;
    this.scene.add(railing);

    const distributor = this._addMesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.4),
      this._mat(0xcc8800),
      new THREE.Vector3(pos.x - 1, pos.y + 0.2, pos.z + 1),
      'distributor'
    );

    const rope = this._addMesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2),
      this._mat(0xddcc88),
      new THREE.Vector3(pos.x, pos.y + 0.1, pos.z + 1.5),
      'rope'
    );
    rope.rotation.z = Math.PI / 2;
  }

  _buildStation6_Remove() {
    const pos = this.stationPositions[6];
    this._addMesh(
      new THREE.BoxGeometry(2, 0.05, 1.5),
      this._mat(0xcc2222),
      new THREE.Vector3(pos.x, pos.y, pos.z),
      'remove-spot'
    );
  }

  _buildStation7_Coupling() {
    const pos = this.stationPositions[7];

    for (let i = 0; i < 4; i++) {
      const hose = this._addMesh(
        new THREE.CylinderGeometry(0.06, 0.06, 3),
        this._mat(0xcccc44),
        new THREE.Vector3(pos.x + (i % 2) * 2 - 1, pos.y + 0.1, pos.z - i * 2),
        `hose-b-${i}`
      );
      hose.rotation.z = Math.PI / 2;
    }

    const dist = this._addMesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.4),
      this._mat(0xcc8800),
      new THREE.Vector3(pos.x, pos.y + 6, pos.z - 10),
      'coupling-distributor'
    );
  }

  _buildStation8_Roll() {
    const pos = this.stationPositions[8];

    const hoseB = this._addMesh(
      new THREE.CylinderGeometry(0.06, 0.06, 6),
      this._mat(0xcccc44),
      new THREE.Vector3(pos.x - 2, pos.y + 0.1, pos.z),
      'roll-hose-b'
    );
    hoseB.rotation.z = Math.PI / 2;

    const hoseC = this._addMesh(
      new THREE.CylinderGeometry(0.04, 0.04, 4),
      this._mat(0x44cc44),
      new THREE.Vector3(pos.x + 2, pos.y + 0.1, pos.z),
      'roll-hose-c'
    );
    hoseC.rotation.z = Math.PI / 2;

    for (let i = 0; i < 2; i++) {
      const box = this._addMesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.8),
        this._mat(0x884422),
        new THREE.Vector3(pos.x - 2 + i * 4, pos.y + 0.25, pos.z + 2),
        `roll-box-${i}`
      );
    }
  }

  _buildStation9_Finish() {
    const pos = this.stationPositions[9];

    this._addMesh(
      new THREE.BoxGeometry(6, 0.05, 2),
      this._mat(0xcc2222),
      new THREE.Vector3(pos.x, pos.y + 0.05, pos.z)
    );

    const arch = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5), this._mat(0xff6600));
    p1.position.set(-3, 1.75, 0);
    arch.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5), this._mat(0xff6600));
    p2.position.set(3, 1.75, 0);
    arch.add(p2);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.3, 0.15), this._mat(0xff6600));
    bar.position.set(0, 3.5, 0);
    arch.add(bar);
    arch.position.set(pos.x, pos.y, pos.z);
    this.scene.add(arch);

    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.2, 1, 12),
      this._mat(0x887766)
    );
    well.position.set(pos.x + 5, pos.y + 0.5, pos.z + 3);
    this.scene.add(well);
  }

  _buildEnvironment() {
    const treeMat = this._mat(0x2d5a1e);
    const trunkMat = this._mat(0x5a3a1e);

    const treePositions = [
      [-8, 0, -10], [8, 0, -15], [-10, 4, -35], [10, 4, -40],
      [-6, 10, -60], [12, 10, -55], [-15, 12, -80], [25, 13, -95],
      [-8, 14, -100], [-15, 18, -125], [5, 22, -145], [-5, 22, -155],
      [15, 14, -110], [-20, 10, -50], [20, 8, -30],
    ];

    for (const [x, y, z] of treePositions) {
      const trunk = this._addMesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2),
        trunkMat,
        new THREE.Vector3(x, y + 1, z)
      );
      const crown = this._addMesh(
        new THREE.ConeGeometry(1.5, 3, 6),
        treeMat,
        new THREE.Vector3(x, y + 3.5, z)
      );
    }

    const lavenderPositions = [
      [20, 12, -82], [22, 12, -78], [18, 12, -86], [24, 13, -90],
    ];
    for (const [x, y, z] of lavenderPositions) {
      this._addMesh(
        new THREE.SphereGeometry(1, 6, 4),
        this._mat(0x7b68ee),
        new THREE.Vector3(x, y + 0.5, z)
      );
    }

    const wallPositions = [
      { p: [4, 6, -40], s: [0.5, 12, 10] },
      { p: [-4, 6, -40], s: [0.5, 12, 10] },
      { p: [8, 11, -65], s: [0.5, 4, 15] },
    ];
    for (const w of wallPositions) {
      this._addMesh(
        new THREE.BoxGeometry(...w.s),
        this._mat(0xaa9977),
        new THREE.Vector3(...w.p)
      );
    }
  }

  getHeightAt(x, z) {
    const stations = this.stationPositions;
    let minDist = Infinity;
    let h = 0;

    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i];
      const b = stations[i + 1];
      const ax = a.x, az = a.z, bx = b.x, bz = b.z;
      const dx = bx - ax, dz = bz - az;
      const len2 = dx * dx + dz * dz;
      let t = ((x - ax) * dx + (z - az) * dz) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx;
      const pz = az + t * dz;
      const dist = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
      if (dist < minDist) {
        minDist = dist;
        h = a.y + t * (b.y - a.y);
      }
    }
    return h;
  }

  getCollisionPosition(newPos) {
    const h = this.getHeightAt(newPos.x, newPos.z) + 1.7;
    let x = newPos.x;
    let z = newPos.z;

    if (!this._doorOpened) {
      const doorZ = this.stationPositions[1].z;
      const doorX = this.stationPositions[1].x;
      if (Math.abs(z - doorZ) < 1.5 && Math.abs(x - doorX) < 1.5) {
        z = doorZ + 1.5;
      }
    }

    return new THREE.Vector3(x, h, z);
  }

  getCurrentStationPos() {
    return this.stationPositions[this.currentStation];
  }

  getDistToStation() {
    const pos = this.controls.camera.position;
    const sp = this.stationPositions[this.currentStation];
    return pos.distanceTo(new THREE.Vector3(sp.x, pos.y, sp.z));
  }

  update() {
    if (this.gameFinished) return;

    const dist = this.getDistToStation();
    const nearStation = dist < this.interactionRadius;

    if (!this.gameStarted) {
      if (nearStation && this.currentStation === 0) {
        this.ui.showInteraction('START', () => this._startGame());
        this.ui.showInstruction(STATION_INSTRUCTIONS[0]);
      } else {
        this.ui.hideInteraction();
        this.ui.hideInstruction();
      }
      return;
    }

    this.ui.updateTimer();

    if (!nearStation) {
      this.ui.hideInteraction();
      this.ui.hideInstruction();
      this._hideAllPanels();
      return;
    }

    switch (this.currentStation) {
      case 1: this._updateDoor(); break;
      case 2: this._updateHammer(); break;
      case 3: this._updateUtility(); break;
      case 4: this._updateWeight(); break;
      case 5: this._updateKnot(); break;
      case 6: this._updateRemove(); break;
      case 7: this._updateCoupling(); break;
      case 8: this._updateRoll(); break;
      case 9: this._updateFinish(); break;
    }
  }

  _startGame() {
    this.gameStarted = true;
    this.ui.hideInteraction();
    this.ui.hideInstruction();
    this.ui.startTimer();
    this.currentStation = 1;
    this._advanceStation();
  }

  _advanceStation() {
    if (this.currentStation > 0) {
      this.ui.showStationComplete(STATION_NAMES[this.currentStation - 1]);
    }
    if (this.currentStation >= 10) {
      this._finishGame();
      return;
    }
    this.ui.setStationInfo(`${this.currentStation + 1}/10 - ${STATION_NAMES[this.currentStation]}`);
    this.ui.updateProgress(this.currentStation);
    this.ui.showArrow();
    this.stationPhase = 'approach';
  }

  _completeStation() {
    this._hideAllPanels();
    this.ui.hideInteraction();
    this.ui.hideInstruction();
    this.ui.hideGesture();
    this.currentStation++;
    this._advanceStation();
  }

  _hideAllPanels() {
    document.getElementById('utility-panel').style.display = 'none';
    document.getElementById('coupling-panel').style.display = 'none';
    document.getElementById('knot-sequence').style.display = 'none';
    document.getElementById('roll-area').style.display = 'none';
    document.getElementById('station-task-area').style.display = 'none';
    this.ui.hideHammerCount();
  }

  // ── Station 1: Door Opening ──
  _updateDoor() {
    if (!this._toolPickedUp) {
      this.ui.showInstruction('Vedd fel a Halligan Tool-t!');
      this.ui.showInteraction('FELVESZ', () => {
        this._toolPickedUp = true;
        if (this._halligan) this._halligan.visible = false;
      });
    } else if (!this._doorOpened) {
      this.ui.showInstruction('Feszitsd ki az ajtoeket! Huzd FELFE a gombot!');
      this.ui.showInteraction('FESZITES', () => {
        this._doorOpened = true;
        const wedge = this._doorGroup.getObjectByName('door-wedge');
        if (wedge) wedge.visible = false;
        const panel = this._doorGroup.getObjectByName('door-panel');
        if (panel) panel.rotation.y = -Math.PI / 1.8;
      });
    } else if (!this._toolPlacedBack) {
      this.ui.showInstruction('Tedd vissza a Halligan Tool-t es menj at az ajtón!');
      this.ui.showInteraction('LETESZ', () => {
        this._toolPlacedBack = true;
        if (this._halligan) this._halligan.visible = true;
        this._completeStation();
      });
    }
  }

  // ── Station 2: TFA Hammering ──
  _updateHammer() {
    if (this.stationPhase === 'approach') {
      this.ui.showInstruction('Vedd fel a kalapcsot!');
      this.ui.showInteraction('FELVESZ', () => {
        this.stationPhase = 'hammering';
        this._hammerCount = 0;
        this._hammerPhase = 'up';
      });
      return;
    }

    if (this.stationPhase === 'hammering') {
      this.ui.showHammerCount(this._hammerCount, this._hammerTarget);
      const label = this._hammerPhase === 'up' ? 'KALAPACS FEL' : 'KALAPACS LE';
      this.ui.showInstruction(`${label} (${this._hammerCount}/${this._hammerTarget})`);
      this.ui.showInteraction(label, () => {
        this._hammerCount++;
        this._hammerPhase = this._hammerPhase === 'up' ? 'down' : 'up';

        if (this._hammerCount >= this._hammerTarget) {
          this.stationPhase = 'done';
          this.ui.hideHammerCount();
        }
      });
      return;
    }

    if (this.stationPhase === 'done') {
      this.ui.showInstruction('Tedd vissza a kalapcsot!');
      this.ui.showInteraction('LETESZ', () => {
        this._completeStation();
      });
    }
  }

  // ── Station 3: Utility Shutoff ──
  _updateUtility() {
    const panel = document.getElementById('utility-panel');
    if (panel.style.display === 'none') {
      this._showUtilityPanel();
    }

    const allOff = this._breakersOff.every(b => b) && this._valveClosed;
    if (allOff) {
      panel.style.display = 'none';
      this._completeStation();
    }
  }

  _showUtilityPanel() {
    const panel = document.getElementById('utility-panel');
    panel.style.display = 'block';
    panel.innerHTML = '';
    this.ui.showInstruction('Kapcsold le a megszakitokat es zard el a gazt!');

    for (let i = 0; i < 3; i++) {
      const b = document.createElement('div');
      b.className = 'breaker';
      b.style.left = (25 + i * 20) + '%';
      b.style.top = '25%';
      const h = document.createElement('div');
      h.className = 'handle';
      b.appendChild(h);
      const breakerHandler = () => {
        if (!this._breakersOff[i]) {
          this._breakersOff[i] = true;
          b.classList.add('off');
        }
      };
      b.addEventListener('click', breakerHandler);
      b.addEventListener('touchstart', (e) => { e.preventDefault(); breakerHandler(); }, { passive: false });
      panel.appendChild(b);
    }

    const v = document.createElement('div');
    v.className = 'valve';
    v.style.left = '45%';
    v.style.top = '55%';
    const vh = document.createElement('div');
    vh.className = 'valve-handle';
    v.appendChild(vh);
    const valveHandler = () => {
      if (!this._valveClosed) {
        this._valveClosed = true;
        v.classList.add('closed');
      }
    };
    v.addEventListener('click', valveHandler);
    v.addEventListener('touchstart', (e) => { e.preventDefault(); valveHandler(); }, { passive: false });
    panel.appendChild(v);
  }

  // ── Station 4: Weight Carrying ──
  _updateWeight() {
    if (!this._scbaOn) {
      this.ui.showInstruction('Vedd fel a legzokeszuleket!');
      this.ui.showInteraction('FELVESZ SCBA', () => {
        this._scbaOn = true;
        const scba = this.scene.getObjectByName('scba');
        if (scba) scba.visible = false;
        const tank = this.scene.getObjectByName('scba-tank');
        if (tank) tank.visible = false;
      });
    } else if (!this._extinguisherPickedUp) {
      this.ui.showInstruction('Vedd fel a tuzoltokeszulekeket!');
      this.ui.showInteraction('FELVESZ', () => {
        this._extinguisherPickedUp = true;
        for (let i = 0; i < 2; i++) {
          const ext = this.scene.getObjectByName(`extinguisher-${i}`);
          if (ext) ext.visible = false;
        }
        this.controls.setWeightModifier(0.65);
        this._completeStation();
      });
    }
  }

  // ── Station 5: Knot Tying ──
  _updateKnot() {
    const panel = document.getElementById('knot-sequence');
    if (panel.style.display === 'none') {
      this._showKnotPanel();
    }
  }

  _showKnotPanel() {
    const panel = document.getElementById('knot-sequence');
    panel.style.display = 'block';
    panel.innerHTML = '';
    this._knotStep = 0;
    this.ui.showInstruction('Kosd meg a kotelet! Nyomd meg a szamokat sorrendben!');

    const positions = [
      { left: '20%', top: '30%' },
      { left: '50%', top: '20%' },
      { left: '70%', top: '45%' },
      { left: '40%', top: '65%' },
    ];

    for (let i = 0; i < this._knotTotal; i++) {
      const p = document.createElement('div');
      p.className = 'knot-point';
      p.style.left = positions[i].left;
      p.style.top = positions[i].top;
      p.textContent = (i + 1).toString();
      const knotHandler = (e) => {
        if (e) e.preventDefault();
        if (i === this._knotStep) {
          this._knotStep++;
          p.classList.add('done');
          if (this._knotStep >= this._knotTotal) {
            panel.style.display = 'none';
            this._completeStation();
          }
        } else if (i > this._knotStep) {
          this.ui.addPenalty(20, 'Hibas kotelkotes sorrend');
        }
      };
      p.addEventListener('click', knotHandler);
      p.addEventListener('touchstart', knotHandler, { passive: false });
      panel.appendChild(p);
    }
  }

  // ── Station 6: Remove Equipment ──
  _updateRemove() {
    if (!this._equipmentDropped) {
      this.ui.showInstruction('Tedd le a felszereleseket!');
      this.ui.showInteraction('LETESZ MINDENT', () => {
        this._equipmentDropped = true;
        this.controls.setWeightModifier(1.0);
        this._completeStation();
      });
    }
  }

  // ── Station 7: Hose Coupling ──
  _updateCoupling() {
    const panel = document.getElementById('coupling-panel');
    if (panel.style.display === 'none') {
      this._showCouplingPanel();
    }
  }

  _showCouplingPanel() {
    const panel = document.getElementById('coupling-panel');
    panel.style.display = 'block';
    panel.innerHTML = '';
    this._hosesConnected = [false, false, false, false];
    this._selectedHoseEnd = null;
    this.ui.showInstruction('Kapcsold ossze a tomlo vegeket parban!');

    const ends = [
      { id: 'a1', label: 'B1', left: '15%', top: '20%', pair: 'a2' },
      { id: 'a2', label: 'B1', left: '15%', top: '35%', pair: 'a1' },
      { id: 'b1', label: 'B2', left: '40%', top: '30%', pair: 'b2' },
      { id: 'b2', label: 'B2', left: '40%', top: '45%', pair: 'b1' },
      { id: 'c1', label: 'B3', left: '60%', top: '40%', pair: 'c2' },
      { id: 'c2', label: 'B3', left: '60%', top: '55%', pair: 'c1' },
      { id: 'd1', label: 'B4', left: '80%', top: '50%', pair: 'oszt' },
      { id: 'oszt', label: 'Oszto', left: '80%', top: '70%', pair: 'd1' },
    ];

    const elMap = {};
    let connectedCount = 0;

    for (const end of ends) {
      const el = document.createElement('div');
      el.className = 'hose-end';
      el.style.left = end.left;
      el.style.top = end.top;
      el.textContent = end.label;
      el.dataset.id = end.id;
      el.dataset.pair = end.pair;
      elMap[end.id] = el;

      const couplingHandler = (e) => {
        if (e) e.preventDefault();
        if (el.classList.contains('connected')) return;

        if (this._selectedHoseEnd === null) {
          this._selectedHoseEnd = end.id;
          el.classList.add('selected');
        } else {
          const prev = elMap[this._selectedHoseEnd];
          if (end.pair === this._selectedHoseEnd) {
            el.classList.add('connected');
            prev.classList.add('connected');
            prev.classList.remove('selected');
            connectedCount++;
            if (connectedCount >= 4) {
              panel.style.display = 'none';
              this._completeStation();
            }
          } else {
            prev.classList.remove('selected');
            this.ui.addPenalty(10, 'Hibas tomlokapcsolas');
          }
          this._selectedHoseEnd = null;
        }
      };
      el.addEventListener('click', couplingHandler);
      el.addEventListener('touchstart', couplingHandler, { passive: false });
      panel.appendChild(el);
    }
  }

  // ── Station 8: Hose Rolling ──
  _updateRoll() {
    const area = document.getElementById('roll-area');
    if (area.style.display === 'none') {
      this._showRollPanel();
    }
  }

  _showRollPanel() {
    const area = document.getElementById('roll-area');
    area.style.display = 'block';
    this._currentRoll = 0;
    this._rollProgress = [0, 0];
    this._rollAngle = 0;
    this._lastRollAngle = null;
    this._rollTotalRotation = 0;

    const progressText = document.getElementById('roll-progress-text');
    const circle = document.getElementById('roll-circle');
    const label = this._currentRoll === 0 ? 'B tomlo' : 'C tomlo';
    this.ui.showInstruction(`Tekerd fel a ${label}t! Korozoges a koron!`);
    progressText.textContent = '0%';

    let centerX, centerY;
    const rect = circle.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;

    const onMove = (clientX, clientY) => {
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const angle = Math.atan2(dy, dx);

      if (this._lastRollAngle !== null) {
        let delta = angle - this._lastRollAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        this._rollTotalRotation += Math.abs(delta);

        const progress = Math.min(100, Math.floor((this._rollTotalRotation / (Math.PI * 8)) * 100));
        this._rollProgress[this._currentRoll] = progress;
        progressText.textContent = progress + '%';

        if (progress >= 100) {
          this._currentRoll++;
          if (this._currentRoll >= 2) {
            area.style.display = 'none';
            this._completeStation();
          } else {
            this._rollTotalRotation = 0;
            this._lastRollAngle = null;
            this.ui.showInstruction('Tekerd fel a C tomlot! Korozoges a koron!');
            progressText.textContent = '0%';
            return;
          }
        }
      }
      this._lastRollAngle = angle;
    };

    area.ontouchmove = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    };

    area.onmousemove = (e) => {
      if (e.buttons) onMove(e.clientX, e.clientY);
    };

    area.ontouchstart = (e) => {
      e.preventDefault();
      const r = circle.getBoundingClientRect();
      centerX = r.left + r.width / 2;
      centerY = r.top + r.height / 2;
      this._lastRollAngle = null;
    };
  }

  // ── Station 9: Finish ──
  _updateFinish() {
    this._finishGame();
  }

  _finishGame() {
    this.gameFinished = true;
    this.ui.stopTimer();
    this.controls.disable();
    this.ui.showFinish();
  }

  reset(category) {
    this.category = category;
    this.currentStation = 0;
    this.stationPhase = 'approach';
    this.gameStarted = false;
    this.gameFinished = false;
    this._hammerCount = 0;
    this._hammerTarget = category === 'strong' ? 40 : category === 'women' ? 20 : 10;
    this._hammerPhase = 'up';
    this._toolPickedUp = false;
    this._toolPlacedBack = false;
    this._doorOpened = false;
    this._doorPassed = false;
    this._breakersOff = [false, false, false];
    this._valveClosed = false;
    this._scbaOn = false;
    this._extinguisherPickedUp = false;
    this._knotStep = 0;
    this._equipmentDropped = false;
    this._hosesConnected = [];
    this._selectedHoseEnd = null;
    this._rollProgress = [0, 0];
    this._currentRoll = 0;
    this.controls.setWeightModifier(1.0);
    this._hideAllPanels();

    if (this._halligan) this._halligan.visible = true;
    const scba = this.scene.getObjectByName('scba');
    if (scba) scba.visible = true;
    const tank = this.scene.getObjectByName('scba-tank');
    if (tank) tank.visible = true;
    for (let i = 0; i < 2; i++) {
      const ext = this.scene.getObjectByName(`extinguisher-${i}`);
      if (ext) ext.visible = true;
    }
    const wedge = this._doorGroup?.getObjectByName('door-wedge');
    if (wedge) wedge.visible = true;
    const doorPanel = this._doorGroup?.getObjectByName('door-panel');
    if (doorPanel) doorPanel.rotation.y = 0;
  }
}
