import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import {
  FilesetResolver,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";
import { BookMappingExperience } from "./experiences/bookMapping/BookMappingExperience.js";
import { createHandInput } from "./experiences/bookMapping/interaction/HandInput.js";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const DETECT_INTERVAL = 1000 / 30;
const ENABLE_BOOK_MAPPING = true;

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
let pointerTarget = null;
let cameraActive = false;
let bookMappingExperience = null;

function setStatus(message) {
  statusLabel.textContent = message;
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
  grid.material.opacity = 0.12;
  grid.material.depthTest = false;
  grid.material.depthWrite = false;
  grid.renderOrder = -20;
  scene.add(grid);

  const glowGeometry = new THREE.PlaneGeometry(26, 14);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x110b23,
    transparent: true,
    opacity: 0.62,
    depthTest: false,
    depthWrite: false
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.z = -0.08;
  glow.renderOrder = -30;
  scene.add(glow);
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
    cameraActive = true;
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

function getInteractionHands() {
  return smoothedHands.map((hand) => ({
    indexTip: hand.indexTip,
    palmCenter: hand.palmCenter,
    indexWorld: normalizedToWorld(hand.indexTip),
    palmWorld: hand.palmWorld
  }));
}

function getPointerFallback() {
  if (!pointerTarget) {
    return null;
  }

  return {
    ...pointerTarget,
    world: normalizedToWorld(pointerTarget)
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

function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  detectHands(now);
  if (ENABLE_BOOK_MAPPING) {
    bookMappingExperience?.update({
      input: createHandInput({
        hands: getInteractionHands(),
        pointer: smoothedHands.length ? null : getPointerFallback()
      }),
      cameraActive,
      trackedHandsCount: smoothedHands.length
    });
  }
  renderer.render(scene, camera);
}

async function init() {
  createRenderer();
  if (ENABLE_BOOK_MAPPING) {
    bookMappingExperience = new BookMappingExperience({ renderer, scene, camera });
    bookMappingExperience.init();
  }
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
