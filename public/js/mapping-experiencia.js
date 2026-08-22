import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import {
  FilesetResolver,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const DETECT_INTERVAL = 1000 / 30;

const canvasMount = document.querySelector("#mapping-canvas");
const video = document.querySelector("#mapping-camera");
const startButton = document.querySelector("#mapping-start-camera");
const statusLabel = document.querySelector("#mapping-status");
const introPanel = document.querySelector(".mapping-panel");

let renderer;
let scene;
let camera;
let worldBounds = { left: -8, right: 8, top: 4.5, bottom: -4.5, width: 16, height: 9 };
let handLandmarker;
let lastDetectAt = 0;
let lastVideoTime = -1;
let smoothedHands = [];
let lastFlowerAt = 0;
let lastFlowerPosition = null;
let pointerTarget = null;

const flowers = [];
const pollen = [];
const clock = new THREE.Clock();

function setStatus(message) {
  statusLabel.textContent = message;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function average(points) {
  return points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
      z: acc.z + point.z / points.length
    }),
    { x: 0, y: 0, z: 0 }
  );
}

function smoothPoint(previous, current, amount = 0.35) {
  if (!previous) {
    return current;
  }

  return {
    x: previous.x + (current.x - previous.x) * amount,
    y: previous.y + (current.y - previous.y) * amount,
    z: previous.z + (current.z - previous.z) * amount
  };
}

function normalizedToWorld(point) {
  const mirroredX = 1 - point.x;

  return {
    x: worldBounds.left + mirroredX * worldBounds.width,
    y: worldBounds.top - point.y * worldBounds.height,
    z: 0
  };
}

function makeCircleTexture(color = "#ffffff", soft = true) {
  const canvas = document.createElement("canvas");
  const size = 128;
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, color);
  gradient.addColorStop(soft ? 0.42 : 0.7, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const pollenTexture = makeCircleTexture("rgba(98,231,255,0.9)");
const flowerTexture = makeCircleTexture("rgba(234,69,190,0.96)", false);
const markerTexture = makeCircleTexture("rgba(255,255,255,0.92)");

function createRenderer() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05040a);

  camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, -10, 10);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvasMount.appendChild(renderer.domElement);

  buildScene();
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointerMove);
}

function buildScene() {
  const grid = new THREE.GridHelper(26, 32, 0x3650cf, 0x2b2340);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -0.04;
  grid.material.transparent = true;
  grid.material.opacity = 0.26;
  scene.add(grid);

  const glowGeometry = new THREE.PlaneGeometry(26, 14);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x110b23,
    transparent: true,
    opacity: 0.8
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.z = -0.08;
  scene.add(glow);

  for (let index = 0; index < 140; index += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: pollenTexture,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        color: index % 3 === 0 ? 0xea45be : 0x62e7ff
      })
    );

    const scale = 0.035 + Math.random() * 0.08;
    sprite.scale.set(scale, scale, 1);
    sprite.position.set(
      worldBounds.left + Math.random() * worldBounds.width,
      worldBounds.bottom + Math.random() * worldBounds.height,
      Math.random() * 0.12
    );

    pollen.push({
      sprite,
      velocity: new THREE.Vector2((Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006),
      drift: Math.random() * Math.PI * 2
    });
    scene.add(sprite);
  }
}

function resize() {
  const aspect = window.innerWidth / window.innerHeight;
  const worldHeight = 9;
  const worldWidth = worldHeight * aspect;

  worldBounds = {
    left: -worldWidth / 2,
    right: worldWidth / 2,
    top: worldHeight / 2,
    bottom: -worldHeight / 2,
    width: worldWidth,
    height: worldHeight
  };

  camera.left = worldBounds.left;
  camera.right = worldBounds.right;
  camera.top = worldBounds.top;
  camera.bottom = worldBounds.bottom;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function loadVisionModel() {
  setStatus("Cargando MediaPipe y modelo de manos...");

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  startButton.disabled = false;
  setStatus("Listo. Activa la cámara para iniciar el tracking.");
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Este navegador no permite acceso a cámara en esta página.");
    return;
  }

  try {
    startButton.disabled = true;
    setStatus("Solicitando permiso de cámara...");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      }
    });

    video.srcObject = stream;
    await new Promise((resolve) => {
      video.addEventListener("loadeddata", resolve, { once: true });
    });

    video.classList.add("is-active");
    introPanel.classList.add("is-hidden");
    setStatus("Tracking activo. Mueve tus manos frente a la cámara.");
  } catch (error) {
    startButton.disabled = false;
    setStatus("No se pudo activar la cámara. Revisa permisos o abre el sitio desde HTTPS/localhost.");
    console.error(error);
  }
}

function handlePointerMove(event) {
  pointerTarget = {
    x: event.clientX / window.innerWidth,
    y: event.clientY / window.innerHeight,
    z: 0
  };
}

function detectHands(now) {
  if (!handLandmarker || !video.srcObject || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return;
  }

  if (now - lastDetectAt < DETECT_INTERVAL || video.currentTime === lastVideoTime) {
    return;
  }

  lastDetectAt = now;
  lastVideoTime = video.currentTime;

  const result = handLandmarker.detectForVideo(video, now);
  smoothedHands = (result.landmarks || []).map((landmarks, index) => {
    const previous = smoothedHands[index];
    const indexTip = smoothPoint(previous?.indexTip, landmarks[8]);
    const palmCenter = smoothPoint(previous?.palmCenter, average([
      landmarks[0],
      landmarks[5],
      landmarks[9],
      landmarks[13],
      landmarks[17]
    ]));

    return {
      indexTip,
      palmCenter,
      lastPalmWorld: previous?.palmWorld || null,
      palmWorld: normalizedToWorld(palmCenter)
    };
  });
}

function plantFlower(position, now) {
  const flower = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: flowerTexture,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      color: Math.random() > 0.5 ? 0xea45be : 0x62e7ff
    })
  );

  const size = 0.28 + Math.random() * 0.34;
  flower.position.set(position.x, position.y, 0.12);
  flower.scale.set(size, size, 1);
  scene.add(flower);
  flowers.push({ sprite: flower, bornAt: now, baseSize: size });

  if (flowers.length > 70) {
    const oldFlower = flowers.shift();
    scene.remove(oldFlower.sprite);
    oldFlower.sprite.material.dispose();
  }
}

function maybePlantFlower(position, now) {
  const insideScreen = position.x > worldBounds.left && position.x < worldBounds.right
    && position.y > worldBounds.bottom && position.y < worldBounds.top;

  if (!insideScreen || now - lastFlowerAt < 180) {
    return;
  }

  const distance = lastFlowerPosition
    ? Math.hypot(position.x - lastFlowerPosition.x, position.y - lastFlowerPosition.y)
    : Infinity;

  if (distance >= 0.35) {
    plantFlower(position, now);
    lastFlowerAt = now;
    lastFlowerPosition = position;
  }
}

function repelPollen(palm, previousPalm) {
  const velocity = previousPalm
    ? new THREE.Vector2(palm.x - previousPalm.x, palm.y - previousPalm.y)
    : new THREE.Vector2(0, 0);

  const force = clamp(velocity.length() * 5, 0.15, 2.5);
  const radius = clamp(1.2 + force * 0.52, 1.2, 2.5);

  pollen.forEach((particle) => {
    const dx = particle.sprite.position.x - palm.x;
    const dy = particle.sprite.position.y - palm.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 0 && distance < radius) {
      const push = (1 - distance / radius) * force * 0.028;
      particle.velocity.x += (dx / distance) * push;
      particle.velocity.y += (dy / distance) * push;
    }
  });
}

function updatePollen(delta, elapsed) {
  pollen.forEach((particle) => {
    particle.drift += delta * 0.7;
    particle.velocity.x += Math.cos(particle.drift + elapsed) * 0.0008;
    particle.velocity.y += Math.sin(particle.drift * 0.8 + elapsed) * 0.0008;
    particle.velocity.multiplyScalar(0.982);

    particle.sprite.position.x += particle.velocity.x * delta * 60;
    particle.sprite.position.y += particle.velocity.y * delta * 60;

    if (particle.sprite.position.x < worldBounds.left) particle.sprite.position.x = worldBounds.right;
    if (particle.sprite.position.x > worldBounds.right) particle.sprite.position.x = worldBounds.left;
    if (particle.sprite.position.y < worldBounds.bottom) particle.sprite.position.y = worldBounds.top;
    if (particle.sprite.position.y > worldBounds.top) particle.sprite.position.y = worldBounds.bottom;
  });
}

function updateFlowers(elapsed) {
  flowers.forEach((flower, index) => {
    const pulse = 1 + Math.sin(elapsed * 2.4 + index) * 0.08;
    flower.sprite.scale.setScalar(flower.baseSize * pulse);
    flower.sprite.material.opacity = clamp(0.92 - (elapsed * 1000 - flower.bornAt) / 24000, 0.18, 0.92);
  });
}

function updateDebugMarkers(now) {
  const hands = smoothedHands.length
    ? smoothedHands
    : pointerTarget
      ? [{ indexTip: pointerTarget, palmCenter: pointerTarget, palmWorld: normalizedToWorld(pointerTarget), lastPalmWorld: null }]
      : [];

  hands.forEach((hand) => {
    const indexWorld = normalizedToWorld(hand.indexTip);
    maybePlantFlower(indexWorld, now);
    repelPollen(hand.palmWorld, hand.lastPalmWorld);
  });
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  detectHands(now);
  updateDebugMarkers(now);
  updatePollen(delta, elapsed);
  updateFlowers(elapsed);
  renderer.render(scene, camera);
}

async function init() {
  createRenderer();
  animate();
  startButton.addEventListener("click", startCamera);

  try {
    await loadVisionModel();
  } catch (error) {
    startButton.disabled = true;
    setStatus("No se pudieron cargar las librerías de tracking. Revisa la conexión a internet.");
    console.error(error);
  }
}

init();
