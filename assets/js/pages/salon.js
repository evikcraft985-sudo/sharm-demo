import {
  THREE,
  addShadow,
  createRenderLoop,
  createStage,
  makeBox,
  makeCylinder,
  setFallback,
  setReady,
} from '../core/stage.js';

const COLORS = {
  chocolate: { color: '#4b2e20', label: 'Шоколад' },
  copper: { color: '#b5623a', label: 'Медь' },
  wheat: { color: '#c9a876', label: 'Пшеница' },
  blond: { color: '#e6ded0', label: 'Холодный блонд' },
  cherry: { color: '#7c2436', label: 'Вишня' },
};

const STYLES = { long: 'Длинные', bob: 'Каре', bun: 'Пучок' };

export async function init(viewport) {
  const stage = createStage(viewport, {
    background: '#efe1da',
    cameraPosition: [3.7, 2.5, 5.4],
    target: [0, 1.25, 0],
    fov: 34,
    environmentIntensity: 0.75,
    minDistance: 3.5,
    maxDistance: 12,
  });
  const { scene } = stage;
  scene.fog = new THREE.Fog('#efe1da', 13, 26);

  const skin = new THREE.MeshStandardMaterial({ color: '#ddb296', roughness: 0.55, metalness: 0.04 });
  const hairMaterial = new THREE.MeshStandardMaterial({ color: COLORS.chocolate.color, roughness: 0.32, metalness: 0.12 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b98d54', roughness: 0.24, metalness: 0.85 });
  const glass = new THREE.MeshStandardMaterial({ color: '#f6ece4', roughness: 0.06, metalness: 0.65 });
  const platformMaterial = new THREE.MeshStandardMaterial({ color: '#d8bfb3', roughness: 0.7 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#e6d3c8', roughness: 0.86 });
  const bulbMaterial = new THREE.MeshStandardMaterial({ color: '#fff2df', emissive: '#ffd9a6', emissiveIntensity: 1.6, roughness: 0.4 });

  const root = new THREE.Group();
  scene.add(root);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const platform = makeCylinder(1.25, 1.35, 0.22, platformMaterial, 64);
  platform.position.set(0, 0.11, 0);
  root.add(platform);

  // Torso and neck (bust)
  const profile = [
    [0.02, 0.22], [0.62, 0.24], [0.6, 0.34], [0.52, 0.52],
    [0.4, 0.72], [0.26, 0.9], [0.19, 1.02], [0.17, 1.12],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), skin);
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  const neck = makeCylinder(0.16, 0.18, 0.34, skin, 32);
  neck.position.set(0, 1.16, 0);
  root.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.52, 0);
  root.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 48, 32), skin);
  head.scale.set(0.9, 1.12, 0.92);
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), skin);
    ear.position.set(side * 0.395, -0.02, 0.02);
    ear.scale.set(0.6, 1, 0.8);
    headGroup.add(ear);
  }

  // Hair cap shared by all styles
  const hairRoot = new THREE.Group();
  headGroup.add(hairRoot);

  const makeCap = () => {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.56),
      hairMaterial,
    );
    cap.scale.set(1.0, 1.06, 1.02);
    cap.rotation.x = -0.58;
    cap.position.set(0, 0.08, -0.05);
    cap.castShadow = true;
    return cap;
  };

  const strand = (points, radius = 0.075) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, radius, 10, false), hairMaterial);
    mesh.castShadow = true;
    return mesh;
  };

  const styles = {};

  // Long hair
  const long = new THREE.Group();
  long.add(makeCap());
  for (let i = -4; i <= 4; i += 1) {
    const a = (i / 4) * 1.45;
    const x = Math.sin(a) * 0.34;
    const z = -Math.cos(a) * 0.3;
    long.add(strand([
      [x * 0.75, 0.32, z * 0.75],
      [x * 1.12, 0.02, z * 1.12],
      [x * 1.25, -0.34, z * 1.2],
      [x * 1.28, -0.66, z * 1.1],
    ], 0.085));
  }
  for (const side of [-1, 1]) {
    long.add(strand([
      [side * 0.3, 0.3, 0.16],
      [side * 0.44, 0.02, 0.24],
      [side * 0.48, -0.32, 0.26],
      [side * 0.44, -0.62, 0.2],
    ], 0.08));
  }
  styles.long = long;

  // Bob
  const bob = new THREE.Group();
  bob.add(makeCap());
  const backBob = makeBox(0.72, 0.44, 0.24, hairMaterial, 0.12);
  backBob.position.set(0, -0.16, -0.3);
  bob.add(backBob);
  for (const side of [-1, 1]) {
    const sideBob = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 8, 16), hairMaterial);
    sideBob.position.set(side * 0.4, -0.16, 0.08);
    sideBob.rotation.z = side * 0.12;
    sideBob.castShadow = true;
    bob.add(sideBob);
    const fringe = strand([
      [side * 0.2, 0.32, 0.22],
      [side * 0.38, 0.1, 0.3],
      [side * 0.42, -0.12, 0.28],
    ], 0.07);
    bob.add(fringe);
  }
  styles.bob = bob;

  // Bun
  const bun = new THREE.Group();
  bun.add(makeCap());
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 24), hairMaterial);
  knot.position.set(0, 0.52, -0.16);
  knot.castShadow = true;
  bun.add(knot);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 12, 32), brass);
  band.position.set(0, 0.44, -0.16);
  band.rotation.x = Math.PI / 2.4;
  bun.add(band);
  for (const side of [-1, 1]) {
    bun.add(strand([
      [side * 0.28, 0.26, 0.2],
      [side * 0.4, 0.02, 0.24],
      [side * 0.38, -0.2, 0.2],
    ], 0.055));
  }
  styles.bun = bun;

  for (const [key, group] of Object.entries(styles)) {
    group.visible = key === 'long';
    hairRoot.add(group);
  }

  // Mirror and bulbs
  const mirror = new THREE.Group();
  mirror.position.set(0, 1.75, -1.85);
  root.add(mirror);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.045, 16, 80), brass);
  mirror.add(frame);
  const mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.93, 64), glass);
  mirror.add(mirrorGlass);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), bulbMaterial);
    bulb.position.set(Math.cos(a) * 1.06, Math.sin(a) * 1.06, 0.04);
    mirror.add(bulb);
  }

  addShadow(stage, { intensity: 2.4, position: [3, 7, 5] });
  const fill = new THREE.DirectionalLight('#ffe4d6', 0.9);
  fill.position.set(-4, 3, 3);
  scene.add(fill);
  const warm = new THREE.PointLight('#ffd0a8', 12, 9, 2);
  warm.position.set(0.6, 2.6, 2.2);
  scene.add(warm);

  const loop = createRenderLoop(stage, () => true);

  const shell = viewport.closest('[data-scene]');
  const status = shell.querySelector('[data-scene-status]');
  let currentStyle = 'long';
  let currentColor = 'chocolate';

  const syncButtons = () => {
    shell.querySelectorAll('[data-style]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.style === currentStyle)));
    shell.querySelectorAll('[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === currentColor)));
  };

  shell.querySelectorAll('[data-style]').forEach((button) => {
    button.addEventListener('click', () => {
      currentStyle = button.dataset.style;
      for (const [key, group] of Object.entries(styles)) group.visible = key === currentStyle;
      syncButtons();
      status.textContent = `Причёска «${STYLES[currentStyle]}», цвет «${COLORS[currentColor].label}». Поверните модель, чтобы оценить образ со всех сторон.`;
      loop.request();
    });
  });

  shell.querySelectorAll('[data-color]').forEach((button) => {
    button.addEventListener('click', () => {
      currentColor = button.dataset.color;
      hairMaterial.color.set(COLORS[currentColor].color);
      syncButtons();
      status.textContent = `Цвет «${COLORS[currentColor].label}» применён к причёске «${STYLES[currentStyle]}». Материал обновлён в реальном времени.`;
      loop.request();
    });
  });

  shell.querySelector('[data-reset-camera]')?.addEventListener('click', () => {
    stage.camera.position.set(3.7, 2.5, 5.4);
    stage.controls.target.set(0, 1.25, 0);
    stage.controls.update();
    status.textContent = 'Камера возвращена к общему виду модели.';
    loop.request();
  });

  const motionButton = shell.querySelector('[data-motion]');
  const syncMotionButton = () => {
    motionButton?.setAttribute('aria-pressed', String(loop.motion));
    if (motionButton) motionButton.textContent = loop.motion ? 'Пауза' : 'Включить вращение';
  };
  motionButton?.addEventListener('click', () => {
    loop.setMotion(!loop.motion);
    syncMotionButton();
    status.textContent = loop.motion ? 'Медленное вращение включено.' : 'Вращение остановлено. Модель можно поворачивать вручную.';
  });
  syncMotionButton();

  viewport.addEventListener('scenecontextlost', () => {
    setFallback(viewport, '3D-контекст потерян. Показана статичная версия концепта.');
  });
  window.addEventListener('pagehide', () => loop.dispose(), { once: true });

  stage.renderer.render(scene, stage.camera);
  setReady(viewport, 'Выберите причёску и цвет — модель можно вращать.');
}
