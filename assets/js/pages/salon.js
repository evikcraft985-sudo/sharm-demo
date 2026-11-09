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
  copper: { color: '#a1522e', label: 'Медь' },
  wheat: { color: '#c9a876', label: 'Пшеница' },
  blond: { color: '#e4dccd', label: 'Холодный блонд' },
  cherry: { color: '#7c2436', label: 'Вишня' },
};

const STYLES = { long: 'Длинные', bob: 'Каре', bun: 'Пучок' };

const lighten = (hex, t) => new THREE.Color(hex).lerp(new THREE.Color('#fff2df'), t);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

export async function init(viewport) {
  const stage = createStage(viewport, {
    background: '#efe1da',
    cameraPosition: [3.9, 2.4, 5.2],
    target: [0, 1.32, 0],
    fov: 34,
    environmentIntensity: 0.6,
    minDistance: 3.5,
    maxDistance: 12,
  });
  const { scene } = stage;
  scene.fog = new THREE.Fog('#efe1da', 13, 26);
  stage.renderer.toneMappingExposure = 1.02;

  const skin = new THREE.MeshStandardMaterial({
    color: '#e0bb9f',
    roughness: 0.52,
    metalness: 0.03,
    sheen: 0.2,
    sheenColor: new THREE.Color('#ffdfc9'),
  });
  const hairMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(COLORS.chocolate.color),
    roughness: 0.4,
    metalness: 0.06,
    sheen: 0.5,
    sheenRoughness: 0.48,
    sheenColor: new THREE.Color('#f3d9ae'),
    clearcoat: 0.14,
    clearcoatRoughness: 0.55,
    side: THREE.DoubleSide,
  });
  const hairInterior = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.chocolate.color).multiplyScalar(0.6),
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const highlightMaterial = new THREE.MeshPhysicalMaterial({
    color: lighten(COLORS.chocolate.color, 0.12),
    roughness: 0.3,
    metalness: 0.1,
    sheen: 0.6,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color('#f6e3bb'),
  });
  const brass = new THREE.MeshPhysicalMaterial({ color: '#b98d54', roughness: 0.22, metalness: 0.9 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#f8efe7', roughness: 0.05, metalness: 0.7 });
  const platformMaterial = new THREE.MeshStandardMaterial({ color: '#d8bfb3', roughness: 0.7 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#e6d3c8', roughness: 0.86 });
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: '#fff2df',
    emissive: '#ffd9a6',
    emissiveIntensity: 1.8,
    roughness: 0.4,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#2b1f16', roughness: 0.25 });
  const lipMaterial = new THREE.MeshStandardMaterial({ color: '#c07a6b', roughness: 0.45 });

  const root = new THREE.Group();
  scene.add(root);
  const ambient = new THREE.Group();
  root.add(ambient);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const platform = makeCylinder(1.25, 1.35, 0.22, platformMaterial, 64);
  platform.position.set(0, 0.11, 0);
  root.add(platform);

  // Bust: torso, neck, head
  const profile = [
    [0.02, 0.22], [0.62, 0.24], [0.6, 0.34], [0.52, 0.52],
    [0.4, 0.72], [0.26, 0.9], [0.19, 1.02], [0.17, 1.12],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), skin);
  torso.castShadow = true;
  torso.receiveShadow = true;
  ambient.add(torso);

  const neck = makeCylinder(0.16, 0.18, 0.34, skin, 32);
  neck.position.set(0, 1.16, 0);
  ambient.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.52, 0);
  ambient.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 48, 32), skin);
  head.scale.set(0.9, 1.12, 0.92);
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 16), skin);
    ear.position.set(side * 0.345, -0.02, 0.03);
    ear.scale.set(0.55, 1, 0.75);
    headGroup.add(ear);
  }

  // Soft mannequin face
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.056, 20, 16), eyeMaterial);
    eye.position.set(side * 0.12, 0.04, 0.315);
    eye.scale.set(1.1, 1.3, 0.45);
    headGroup.add(eye);
    const brow = makeBox(0.1, 0.02, 0.02, hairInterior, 0.008);
    brow.position.set(side * 0.125, 0.125, 0.31);
    brow.rotation.z = -side * 0.07;
    headGroup.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), skin);
  nose.position.set(0, -0.045, 0.345);
  headGroup.add(nose);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.048, 20, 14), lipMaterial);
  mouth.position.set(0, -0.155, 0.3);
  mouth.scale.set(1.5, 0.5, 0.5);
  headGroup.add(mouth);

  // Hair
  const hairRoot = new THREE.Group();
  headGroup.add(hairRoot);

  // Sway: thin live strands pivot at their root.
  const strands = [];
  const makeStrand = (points, radius, material = hairMaterial, swayAmp = 0.016) => {
    const top = new THREE.Vector3(...points[0]);
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p).sub(top)),
    );
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, radius, 9, false), material);
    mesh.castShadow = true;
    const pivot = new THREE.Group();
    pivot.position.copy(top);
    pivot.add(mesh);
    pivot.userData.sway = {
      phase: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 0.7,
      amp: swayAmp * (0.7 + Math.random() * 0.6),
    };
    strands.push(pivot);
    return pivot;
  };

  // Wig masses: crown hemisphere + a back drop-shell, hugging the head.
  const wigTop = (dropTheta = Math.PI * 0.5) => {
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMaterial,
    );
    crown.scale.set(1.03, 1.09, 1.05);
    crown.position.set(0, 0.05, -0.05);
    crown.rotation.x = -0.22;
    crown.castShadow = true;
    const back = new THREE.Mesh(
      new THREE.SphereGeometry(0.445, 48, 32, Math.PI, Math.PI, 0, dropTheta),
      hairInterior,
    );
    back.scale.set(0.99, 1.08, 0.95);
    back.position.set(0, 0.05, -0.03);
    back.rotation.x = -0.12;
    back.castShadow = true;
    return [crown, back];
  };

  const fringeBand = () => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.432, 0.415, 0.16, 44, 1, true, Math.PI * 2 - 2.35, 2.35),
      hairMaterial,
    );
    band.position.set(0, 0.27, 0.02);
    band.rotation.x = 0.16;
    band.rotation.z = Math.PI;
    band.castShadow = true;
    return band;
  };

  const sideMass = (len, radius = 0.16) => {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const mass = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 10, 20), hairMaterial);
      mass.position.set(side * 0.33, -len / 2 - 0.05, -0.01);
      mass.scale.set(0.85, 1, 0.7);
      mass.rotation.z = -side * 0.06;
      mass.castShadow = true;
      group.add(mass);
    }
    return group;
  };

  const looseWisps = (drop) => {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      group.add(makeStrand(
        [
          [side * 0.35, 0.18, 0.1],
          [side * 0.4, 0.18 - drop * 0.4, 0.12],
          [side * 0.38, 0.18 - drop * 0.75, 0.1],
          [side * 0.33, 0.18 - drop, 0.08],
        ],
        0.018, highlightMaterial, 0.02,
      ));
      group.add(makeStrand(
        [
          [side * 0.28, 0.3, 0.2],
          [side * 0.34, 0.15, 0.24],
          [side * 0.31, 0.02, 0.22],
        ],
        0.012, hairMaterial, 0.026,
      ));
    }
    return group;
  };

  const styles = {};

  // Long: full wig + shoulder-length side masses
  const long = new THREE.Group();
  for (const mesh of wigTop(Math.PI * 0.86)) long.add(mesh);
  long.add(fringeBand());
  long.add(sideMass(0.52));
  long.add(looseWisps(0.58));
  styles.long = long;

  // Bob: short masses, chin length
  const bob = new THREE.Group();
  for (const mesh of wigTop(Math.PI * 0.6)) bob.add(mesh);
  bob.add(fringeBand());
  bob.add(sideMass(0.24, 0.15));
  bob.add(looseWisps(0.24));
  styles.bob = bob;

  // Bun: sleek pulled-back crown + knot
  const bun = new THREE.Group();
  for (const mesh of wigTop(Math.PI * 0.5)) bun.add(mesh);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.185, 32, 24), hairMaterial);
  knot.scale.set(1, 0.8, 0.95);
  knot.position.set(0, 0.5, -0.13);
  knot.castShadow = true;
  bun.add(knot);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 12, 40), brass);
  band.position.set(0, 0.38, -0.12);
  band.rotation.x = Math.PI / 2.3;
  bun.add(band);
  bun.add(looseWisps(0.2));
  styles.bun = bun;

  for (const [key, group] of Object.entries(styles)) {
    group.visible = key === 'long';
    hairRoot.add(group);
  }

  // Mirror with bulbs
  const mirror = new THREE.Group();
  mirror.position.set(0, 1.75, -1.85);
  root.add(mirror);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.045, 16, 80), brass);
  mirror.add(frame);
  const mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.93, 64), glass);
  mirror.add(mirrorGlass);
  const bulbs = [];
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), bulbMaterial);
    bulb.position.set(Math.cos(a) * 1.06, Math.sin(a) * 1.06, 0.04);
    bulb.userData.phase = (i / 10) * Math.PI * 2;
    mirror.add(bulb);
    bulbs.push(bulb);
  }

  // Light rig: warm key, warm rim, soft bounces
  addShadow(stage, { intensity: 1.9, position: [3, 7, 5] });
  const key = new THREE.DirectionalLight('#ffe7d2', 1.15);
  key.position.set(3.2, 4.4, 3.6);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#f9d9c0', 0.8);
  rim.position.set(-3.4, 3.2, -2.8);
  scene.add(rim);
  const bounce = new THREE.PointLight('#ffd0a8', 10, 9, 2);
  bounce.position.set(0.6, 2.2, 2.4);
  scene.add(bounce);
  const heel = new THREE.PointLight('#e8b28c', 5, 6, 2);
  heel.position.set(-1.4, 1.0, 1.6);
  scene.add(heel);

  let styleAnim = null;
  let currentStyle = 'long';
  let currentColor = 'chocolate';
  let idleOn = true;
  const colorAnim = { from: hairMaterial.color.clone(), to: hairMaterial.color.clone(), progress: 1 };

  const loop = createRenderLoop(stage, (delta, time) => {
    let active = false;

    // Hair color glides to the chosen shade
    if (colorAnim.progress < 1) {
      colorAnim.progress = Math.min(1, colorAnim.progress + delta * 2.6);
      const k = easeOut(colorAnim.progress);
      hairMaterial.color.lerpColors(colorAnim.from, colorAnim.to, k);
      highlightMaterial.color.lerpColors(lighten(colorAnim.from, 0.12), lighten(colorAnim.to, 0.12), k);
      hairInterior.color.lerpColors(
        colorAnim.from.clone().multiplyScalar(0.6),
        colorAnim.to.clone().multiplyScalar(0.6),
        k,
      );
      active = true;
    }

    // Style crossfade: old group shrinks, new grows with a soft overshoot
    if (styleAnim) {
      styleAnim.time += delta;
      const inG = styles[styleAnim.next];
      const outG = styles[styleAnim.prev];
      const t = Math.min(1, styleAnim.time / 0.42);
      if (t < 0.5) {
        const s = 1 - easeOut(t * 2);
        outG.scale.setScalar(0.94 + 0.06 * s);
        outG.visible = s > 0.02;
        inG.visible = false;
      } else {
        const u = easeOut((t - 0.5) * 2);
        const overshoot = 1 + 0.035 * Math.sin(u * Math.PI);
        inG.scale.setScalar((0.9 + 0.1 * u) * overshoot);
        inG.visible = true;
        if (t >= 1) inG.scale.setScalar(1);
        if (outG) { outG.visible = false; outG.scale.setScalar(1); }
      }
      if (t >= 1) styleAnim = null;
      active = true;
    }

    // Idle life: breath, micro head tilt, strand sway, bulb shimmer
    const idleMoving = idleOn || colorAnim.progress < 1 || Boolean(styleAnim);
    if (idleOn) {
      torso.scale.y = 1 + Math.sin(time * 1.5) * 0.006;
      headGroup.rotation.z = Math.sin(time * 0.55) * 0.022;
      headGroup.rotation.y = Math.sin(time * 0.35) * 0.03;
      for (const strand of strands) {
        const { phase, speed, amp } = strand.userData.sway;
        strand.rotation.z = Math.sin(time * speed + phase) * amp;
        strand.rotation.x = Math.cos(time * speed * 0.8 + phase) * amp * 0.7;
      }
      for (const bulb of bulbs) {
        bulb.material.emissiveIntensity = 1.5 + Math.sin(time * 2.2 + bulb.userData.phase) * 0.35;
      }
    }
    if (idleMoving) active = true;

    return active;
  });

  const shell = viewport.closest('[data-scene]');
  const status = shell.querySelector('[data-scene-status]');

  const syncButtons = () => {
    shell.querySelectorAll('[data-style]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.style === currentStyle)));
    shell.querySelectorAll('[data-color]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.color === currentColor)));
  };

  shell.querySelectorAll('[data-style]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.style;
      if (next === currentStyle || styleAnim) return;
      styleAnim = { prev: currentStyle, next, time: 0 };
      currentStyle = next;
      syncButtons();
      status.textContent = `Причёска «${STYLES[currentStyle]}», цвет «${COLORS[currentColor].label}». Поверните модель, чтобы оценить образ со всех сторон.`;
      loop.request();
    });
  });

  shell.querySelectorAll('[data-color]').forEach((button) => {
    button.addEventListener('click', () => {
      currentColor = button.dataset.color;
      colorAnim.from = hairMaterial.color.clone();
      colorAnim.to = new THREE.Color(COLORS[currentColor].color);
      colorAnim.progress = 0;
      syncButtons();
      status.textContent = `Цвет «${COLORS[currentColor].label}» плавно наносится на причёску «${STYLES[currentStyle]}».`;
      loop.request();
    });
  });

  shell.querySelector('[data-reset-camera]')?.addEventListener('click', () => {
    stage.camera.position.set(3.9, 2.4, 5.2);
    stage.controls.target.set(0, 1.32, 0);
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
    idleOn = loop.motion;
    syncMotionButton();
    status.textContent = loop.motion
      ? 'Живое вращение и дыхание модели включены.'
      : 'Вращение остановлено. Модель можно поворачивать вручную.';
  });
  syncMotionButton();

  viewport.addEventListener('scenecontextlost', () => {
    setFallback(viewport, '3D-контекст потерян. Показана статичная версия концепта.');
  });
  window.addEventListener('pagehide', () => loop.dispose(), { once: true });

  stage.renderer.render(scene, stage.camera);
  setReady(viewport, 'Выберите причёску и цвет — модель живая и можно вращать.');
}
