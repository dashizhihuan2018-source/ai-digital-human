import {
  ACESFilmicToneMapping,
  AnimationMixer,
  Box3,
  LoopOnce,
  MathUtils,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Spherical,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createLotusStage } from './lotus-stage.js';

const viewer = document.querySelector('.model-viewer');
const canvas = viewer.querySelector('canvas');
const poster = viewer.querySelector('.model-poster');
const controlsPanel = viewer.querySelector('.model-controls');
const actionsPanel = viewer.querySelector('.model-actions');
const actionButtons = [...actionsPanel.querySelectorAll('[data-clip]')];
const status = viewer.querySelector('.model-status');
const idleName = 'MedusaBreathe';
status.hidden = false;

async function showModel() {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  const compact = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();

  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync(canvas.dataset.modelUrl);
    const names = new Set(gltf.animations.map(clip => clip.name));
    if (actionButtons.some(button => !names.has(button.dataset.clip))) {
      throw new Error('GLB 缺少舞台所需的动作');
    }
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  const model = gltf.scene;
  scene.add(model);
  const bounds = new Box3().setFromObject(model, true);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  model.traverse(object => {
    if (object.isMesh) object.castShadow = true;
  });
  const floor = new Vector3(center.x, bounds.min.y - size.y * .006, center.z);
  const openPetals = createLotusStage(scene, floor, size.y);
  const framing = center.clone().add(new Vector3(0, -size.y * .080, 0));

  const camera = new PerspectiveCamera(33, 1, .01, 50);
  const cameraControls = new OrbitControls(camera, canvas);
  cameraControls.target.copy(framing);
  cameraControls.cursor.copy(framing);
  cameraControls.maxTargetRadius = size.y * .55;
  cameraControls.enablePan = false;
  cameraControls.zoomToCursor = true;
  cameraControls.minPolarAngle = .18;
  cameraControls.maxPolarAngle = Math.PI * .488;
  cameraControls.rotateSpeed = .76;
  cameraControls.zoomSpeed = .8;
  cameraControls.minDistance = size.y * .54;
  const initialDirection = new Vector3(.13, .235, 1).normalize();
  const offset = new Vector3();
  const orbit = new Spherical();
  let fittedDistance = 0;
  const render = () => renderer.render(scene, camera);

  function resetView() {
    cameraControls.target.copy(framing);
    camera.position.copy(framing).addScaledVector(initialDirection, fittedDistance);
    cameraControls.update();
    render();
  }

  function fitView() {
    const { width, height } = canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    const previousFit = fittedDistance;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const fovSlope = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const halfWidth = Math.max(size.y * .49, Math.hypot(size.x, size.z) / 2);
    fittedDistance = Math.max(size.y * .70, halfWidth / camera.aspect) / fovSlope * 1.03;
    cameraControls.maxDistance = fittedDistance * 1.75;
    renderer.setSize(Math.round(width), Math.round(height), false);
    if (previousFit === 0) {
      resetView();
      return;
    }
    offset.subVectors(camera.position, cameraControls.target).multiplyScalar(fittedDistance / previousFit);
    camera.position.copy(cameraControls.target).add(offset);
    cameraControls.update();
    render();
  }

  function zoom(scale) {
    offset.subVectors(camera.position, cameraControls.target);
    const previous = offset.length();
    const distance = MathUtils.clamp(previous * scale, cameraControls.minDistance, cameraControls.maxDistance);
    cameraControls.target.y += (previous - distance) / fittedDistance * size.y * .46;
    camera.position.copy(cameraControls.target).add(offset.setLength(distance));
    cameraControls.update();
  }

  cameraControls.addEventListener('change', render);
  canvas.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      zoom(event.key === '-' ? 1.2 : 1 / 1.2);
      return;
    }
    const step = Math.PI / 18;
    const keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const movement = keys[event.key];
    if (!movement) return;
    event.preventDefault();
    orbit.setFromVector3(offset.subVectors(camera.position, cameraControls.target));
    orbit.theta += movement[0];
    orbit.phi = MathUtils.clamp(orbit.phi + movement[1], cameraControls.minPolarAngle, cameraControls.maxPolarAngle);
    camera.position.setFromSpherical(orbit).add(cameraControls.target);
    cameraControls.update();
  });
  controlsPanel.querySelector('[data-zoom="in"]').addEventListener('click', () => zoom(1 / 1.2));
  controlsPanel.querySelector('[data-zoom="out"]').addEventListener('click', () => zoom(1.2));
  controlsPanel.querySelector('.model-reset').addEventListener('click', resetView);

  const mixer = new AnimationMixer(model);
  const clips = new Map(gltf.animations.map(clip => [clip.name, clip]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let activeAction;
  let finishedAction;
  let visible = false;
  let contextLost = false;
  let animationRunning = false;
  let lastFrame = null;
  const unfoldingTime = .94;
  let unfolding = reducedMotion.matches ? unfoldingTime : 0;
  if (unfolding === 0) openPetals(0);

  function animate(now) {
    const delta = lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, .25);
    mixer.update(delta);
    renderer.shadowMap.needsUpdate = true;
    if (unfolding < unfoldingTime) {
      unfolding = Math.min(unfoldingTime, unfolding + delta);
      openPetals(1 - (1 - unfolding / unfoldingTime) ** 3);
    }
    lastFrame = now;
    if (finishedAction === activeAction) {
      finishedAction = null;
      play(idleName);
    } else {
      render();
    }
  }

  function updateLoop() {
    const moving = activeAction && !(reducedMotion.matches && activeAction.getClip().name === idleName);
    const running = Boolean(visible && !document.hidden && !contextLost && moving);
    if (running === animationRunning) return;
    animationRunning = running;
    lastFrame = null;
    renderer.setAnimationLoop(running ? animate : null);
  }

  function play(name) {
    const next = mixer.clipAction(clips.get(name));
    finishedAction = null;
    const blend = reducedMotion.matches ? 0 : .16;
    if (activeAction && activeAction !== next) {
      if (blend > 0) activeAction.fadeOut(blend);
      else activeAction.stop();
    }
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
    if (name !== idleName) {
      next.setLoop(LoopOnce, 1);
      next.clampWhenFinished = true;
    }
    if (activeAction && activeAction !== next && blend > 0) next.fadeIn(blend);
    activeAction = next.play();
    viewer.dataset.action = name;
    for (const button of actionButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.clip === name));
    }
    mixer.update(0);
    renderer.shadowMap.needsUpdate = true;
    render();
    updateLoop();
  }

  mixer.addEventListener('finished', event => {
    if (event.action === activeAction) finishedAction = event.action;
  });
  actionsPanel.addEventListener('click', event => {
    const button = event.target.closest('[data-clip]');
    if (button) play(button.dataset.clip);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && unfolding < unfoldingTime) {
      unfolding = unfoldingTime;
      openPetals(1);
      renderer.shadowMap.needsUpdate = true;
      render();
    }
    updateLoop();
  });
  document.addEventListener('visibilitychange', updateLoop);

  function showPoster(shown) {
    canvas.tabIndex = shown ? -1 : 0;
    canvas.setAttribute('aria-hidden', String(shown));
    poster.hidden = !shown;
    controlsPanel.hidden = shown;
    actionsPanel.hidden = shown;
    status.hidden = !shown;
    if (shown) status.textContent = '3D 画面暂不可用';
    viewer.dataset.view = shown ? 'poster' : 'model';
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    updateLoop();
    showPoster(true);
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    renderer.shadowMap.needsUpdate = true;
    fitView();
    showPoster(false);
    updateLoop();
  });
  new ResizeObserver(fitView).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateLoop();
  }).observe(canvas);
  fitView();
  play(idleName);
  if (!renderer.getContext().isContextLost()) showPoster(false);
}

const loader = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  loader.disconnect();
  showModel().catch(error => {
    status.textContent = '3D 模型暂未载入';
    console.warn('美杜莎 3D 舞台未能载入', error);
  });
}, { rootMargin: '180px' });
loader.observe(viewer);
