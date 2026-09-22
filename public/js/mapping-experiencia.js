import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import {
  FilesetResolver,
  HandLandmarker,
  ImageSegmenter,
  PoseLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";
import { BookMappingExperience } from "./experiences/bookMapping/BookMappingExperience.js";
import { experienceConfig } from "./experiences/bookMapping/config/experienceConfig.js";
import { ExperienceState } from "./experiences/bookMapping/core/ExperienceState.js";
import { createHandInput } from "./experiences/bookMapping/interaction/HandInput.js";
import { copyPersonMask, createPersonSegmentationInput } from "./experiences/bookMapping/interaction/PersonSegmentation.js";
import { createPoseInput } from "./experiences/bookMapping/interaction/PoseInput.js";
import { createCoverVideoDisplayTransform, normalizedVideoPointToWorld } from "./experiences/bookMapping/utils/VideoDisplayTransform.js";

const HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const POSE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
const SEGMENTER_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const DETECT_INTERVAL = 1000 / 30;
const POSE_DETECT_INTERVAL = 1000 / 24;
const SEGMENTATION_INTERVAL = 1000 / 18;
const ENABLE_BOOK_MAPPING = true;
const URL_PARAMS = new URLSearchParams(window.location.search);
const DEBUG_PARAM = URL_PARAMS.get("debug");
const DEBUG_SCENE_PARAM = URL_PARAMS.get("scene");
const DEBUG_SCENE_STATES = Object.freeze({
  submarine: ExperienceState.SUBMARINE_GAME,
  particle: ExperienceState.PARTICLE_MIRROR,
  particles: ExperienceState.PARTICLE_MIRROR,
  particleMirror: ExperienceState.PARTICLE_MIRROR
});
const DEBUG_MODE = DEBUG_PARAM === "1"
  || DEBUG_SCENE_STATES[DEBUG_PARAM] !== undefined
  || DEBUG_SCENE_STATES[DEBUG_SCENE_PARAM] !== undefined;

const canvasMount = document.querySelector("#mapping-canvas");
const video = document.querySelector("#mapping-camera");
const startButton = document.querySelector("#mapping-start-camera");
const cameraSelect = document.querySelector("#mapping-camera-select");
const statusLabel = document.querySelector("#mapping-status");
const introPanel = document.querySelector(".mapping-panel");
const debugCamera = document.querySelector("#mapping-debug-camera");
const debugVideo = document.querySelector("#mapping-debug-video");
const debugHands = document.querySelector("#mapping-debug-hands");

let renderer;
let scene;
let camera;
let worldBounds = { left: -8, right: 8, top: 4.5, bottom: -4.5, width: 16, height: 9 };
let handLandmarker;
let poseLandmarker;
let imageSegmenter;
let lastDetectAt = 0;
let lastPoseDetectAt = 0;
let lastSegmentationAt = 0;
let lastVideoTime = -1;
let lastPoseVideoTime = -1;
let lastSegmentationVideoTime = -1;
let smoothedHands = [];
let poseInput = createPoseInput();
let segmentationInput = createPersonSegmentationInput();
let pointerTarget = null;
let cameraActive = false;
let bookMappingExperience = null;
let lastHandsCount = 0;
let lastTrackingStatusAt = 0;
let visionModelReady = false;
let segmentationModelReady = false;
let segmentationCanvas;
let segmentationContext;

function getDebugEntryState() {
  return DEBUG_MODE ? DEBUG_SCENE_STATES[DEBUG_SCENE_PARAM] ?? DEBUG_SCENE_STATES[DEBUG_PARAM] ?? null : null;
}

function getVideoDisplayTransform() {
  if (!video.videoWidth || !video.videoHeight || !worldBounds.width || !worldBounds.height) {
    return null;
  }

  const config = bookMappingExperience?.config?.prince?.silhouette ?? { height: 180 };
  const displayAspect = worldBounds.width / worldBounds.height;
  const displayHeight = config.height;
  const displayWidth = Math.max(Math.round(displayHeight * displayAspect), 1);

  return createCoverVideoDisplayTransform({
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    displayWidth,
    displayHeight,
    worldBounds,
    mirrorX: true
  });
}

function setStatus(message) {
  statusLabel.textContent = message;
}

function setDebug(element, message) {
  if (DEBUG_MODE && element) {
    element.textContent = message;
  }
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

function screenNormalizedToWorld(point) {
  return {
    x: worldBounds.left + point.x * worldBounds.width,
    y: worldBounds.top - point.y * worldBounds.height,
    z: 0
  };
}

function normalizedVideoToWorld(point) {
  return normalizedVideoPointToWorld(point, getVideoDisplayTransform()) ?? normalizedToWorld(point);
}

function usesVideoAlignedHandWorld() {
  return bookMappingExperience?.isAliceGameState?.();
}

function usesScreenAlignedPointerWorld() {
  return bookMappingExperience?.isSubmarineState?.() || bookMappingExperience?.isAliceGameState?.();
}

function handPointToWorld(point) {
  return usesVideoAlignedHandWorld()
    ? normalizedVideoToWorld(point)
    : normalizedToWorld(point);
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
  setStatus("Cargando MediaPipe, manos y pose...");

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_MODEL_URL
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.28,
    minHandPresenceConfidence: 0.28,
    minTrackingConfidence: 0.28
  });
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_MODEL_URL
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.35,
    minPosePresenceConfidence: 0.35,
    minTrackingConfidence: 0.35
  });

  try {
    imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: SEGMENTER_MODEL_URL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      outputConfidenceMasks: true,
      outputCategoryMask: false
    });
    segmentationModelReady = true;
  } catch (error) {
    segmentationModelReady = false;
    console.warn("No se pudo cargar Image Segmenter. La silueta se ocultará, pero Pose seguirá activo.", error);
  }

  visionModelReady = true;
  startButton.disabled = false;
  await populateCameraOptions();
  setDebug(debugHands, "Tracking: modelo cargado");
  setStatus("Modelo listo. Elige cámara y activa la experiencia.");
}

async function populateCameraOptions() {
  if (!navigator.mediaDevices?.enumerateDevices || !cameraSelect) {
    return;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((device) => device.kind === "videoinput");
    const currentValue = cameraSelect.value;

    cameraSelect.innerHTML = '<option value="">Cámara predeterminada</option>';
    videoInputs.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Cámara ${index + 1}`;

      if (/kinect/i.test(option.textContent)) {
        option.selected = true;
      }

      cameraSelect.appendChild(option);
    });

    if (currentValue && [...cameraSelect.options].some((option) => option.value === currentValue)) {
      cameraSelect.value = currentValue;
    }
  } catch (error) {
    console.warn("No se pudo listar cámaras.", error);
  }
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Este navegador no permite acceso a cámara en esta página.");
    return;
  }

  try {
    startButton.disabled = true;
    setStatus("Solicitando permiso de cámara...");

    const selectedDeviceId = cameraSelect?.value;
    const videoConstraints = selectedDeviceId
      ? {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 960 },
          height: { ideal: 540 },
          frameRate: { ideal: 30, max: 30 }
        }
      : {
          width: { ideal: 960 },
          height: { ideal: 540 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 30 }
        };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraints
      });
    } catch (selectedCameraError) {
      if (!selectedDeviceId) {
        throw selectedCameraError;
      }

      setStatus("La cámara seleccionada falló. Probando cámara predeterminada...");
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          frameRate: { ideal: 30, max: 30 }
        }
      });
    }

    video.srcObject = stream;
    await new Promise((resolve) => {
      video.addEventListener("loadeddata", resolve, { once: true });
    });

    const [track] = stream.getVideoTracks();
    const settings = track?.getSettings?.() || {};
    setDebug(debugCamera, `Cámara: ${track?.label || "activa"}`);
    setDebug(debugVideo, `Video: ${video.videoWidth || settings.width || "-"}x${video.videoHeight || settings.height || "-"}`);

    video.classList.add("is-active");
    cameraActive = true;
    await populateCameraOptions();
    introPanel.classList.add("is-hidden");
    setStatus(
      visionModelReady
        ? "Cámara activa. Muestra la palma completa con buena luz."
        : "Cámara activa. El tracking sigue cargando o falló, pero la webcam ya funciona."
    );
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
    indexWorld: handPointToWorld(hand.indexTip),
    palmWorld: handPointToWorld(hand.palmCenter)
  }));
}

function getPointerFallback() {
  if (!pointerTarget) {
    return null;
  }

  return {
    ...pointerTarget,
    world: usesScreenAlignedPointerWorld()
      ? screenNormalizedToWorld(pointerTarget)
      : normalizedToWorld(pointerTarget)
  };
}

function detectHands(now) {
  if (!bookMappingExperience?.needsHandTracking?.()) {
    smoothedHands = [];
    return;
  }

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
      palmWorld: handPointToWorld(palmCenter)
    };
  });

  if (cameraActive && now - lastTrackingStatusAt > 900) {
    lastTrackingStatusAt = now;

    if (smoothedHands.length !== lastHandsCount) {
      lastHandsCount = smoothedHands.length;
    }

    setStatus(
      smoothedHands.length
        ? `Tracking activo: ${smoothedHands.length} mano${smoothedHands.length > 1 ? "s" : ""} detectada${smoothedHands.length > 1 ? "s" : ""}.`
        : "Cámara activa, pero sin manos detectadas. Muestra la palma completa con buena luz."
    );
    setDebug(
      debugHands,
      smoothedHands.length
        ? `Tracking: ${smoothedHands.length} mano${smoothedHands.length > 1 ? "s" : ""}`
        : "Tracking: sin manos"
    );
  }
}

function detectPose(now) {
  const shouldDetectPose = bookMappingExperience?.needsPoseTracking?.() || false;
  const pointer = getPointerFallback();

  if (!shouldDetectPose) {
    poseInput = createPoseInput({
      previous: poseInput,
      worldBounds,
      displayTransform: getVideoDisplayTransform()
    });
    return;
  }

  if (!poseLandmarker || !video.srcObject || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    poseInput = createPoseInput({
      previous: poseInput,
      worldBounds,
      displayTransform: getVideoDisplayTransform(),
      smoothing: 0.32,
      minVisibility: 0.35,
      pointer
    });
    return;
  }

  if (now - lastPoseDetectAt < POSE_DETECT_INTERVAL || video.currentTime === lastPoseVideoTime) {
    return;
  }

  lastPoseDetectAt = now;
  lastPoseVideoTime = video.currentTime;

  const result = poseLandmarker.detectForVideo(video, now);
  poseInput = createPoseInput({
    landmarks: result.landmarks?.[0] ?? null,
    previous: poseInput,
    worldBounds,
    displayTransform: getVideoDisplayTransform(),
    smoothing: 0.32,
    minVisibility: 0.35,
    pointer
  });
}

function ensureSegmentationCanvas(transform = null) {
  const config = bookMappingExperience?.config?.prince?.silhouette ?? { width: 320, height: 180 };
  const width = transform?.displayWidth ?? config.width;
  const height = transform?.displayHeight ?? config.height;

  if (segmentationCanvas) {
    if (segmentationCanvas.width !== width || segmentationCanvas.height !== height) {
      segmentationCanvas.width = width;
      segmentationCanvas.height = height;
    }
    return;
  }

  segmentationCanvas = document.createElement("canvas");
  segmentationCanvas.width = width;
  segmentationCanvas.height = height;
  segmentationContext = segmentationCanvas.getContext("2d", { willReadFrequently: true });
}

function drawMirroredVideoToSegmentationCanvas() {
  const transform = getVideoDisplayTransform();
  ensureSegmentationCanvas(transform);
  const { width, height } = segmentationCanvas;
  const scale = transform?.scale ?? 1;
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = Math.max(-(transform?.offsetX ?? 0) / scale, 0);
  const sourceY = Math.max(-(transform?.offsetY ?? 0) / scale, 0);

  segmentationContext.save();
  segmentationContext.clearRect(0, 0, width, height);
  segmentationContext.translate(width, 0);
  segmentationContext.scale(-1, 1);
  segmentationContext.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  segmentationContext.restore();
}

function detectPersonSegmentation(now) {
  const shouldSegment = bookMappingExperience?.needsPersonSegmentation?.() || false;

  if (!shouldSegment) {
    segmentationInput = createPersonSegmentationInput({
      ...segmentationInput,
      modelReady: segmentationModelReady,
      active: false
    });
    return;
  }

  if (!imageSegmenter || !video.srcObject || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    segmentationInput = createPersonSegmentationInput({
      ...segmentationInput,
      modelReady: segmentationModelReady,
      active: false,
      error: imageSegmenter ? null : "segmenter-unavailable"
    });
    return;
  }

  if (now - lastSegmentationAt < SEGMENTATION_INTERVAL || video.currentTime === lastSegmentationVideoTime) {
    segmentationInput = createPersonSegmentationInput({
      ...segmentationInput,
      modelReady: segmentationModelReady,
      active: segmentationInput.active
    });
    return;
  }

  lastSegmentationAt = now;
  lastSegmentationVideoTime = video.currentTime;
  drawMirroredVideoToSegmentationCanvas();

  try {
    let maskCopy = null;
    imageSegmenter.segmentForVideo(segmentationCanvas, now, (result) => {
      maskCopy = copyPersonMask(result);
      result?.confidenceMasks?.forEach((mask) => mask.close?.());
      result?.categoryMask?.close?.();
    });

    const elapsed = Math.max(performance.now() - now, 1);
    segmentationInput = createPersonSegmentationInput({
      mask: maskCopy?.data ?? segmentationInput.mask,
      width: maskCopy?.width ?? segmentationInput.width,
      height: maskCopy?.height ?? segmentationInput.height,
      timestamp: maskCopy ? performance.now() : segmentationInput.timestamp,
      fps: 1000 / Math.max(SEGMENTATION_INTERVAL, elapsed),
      modelReady: segmentationModelReady,
      active: Boolean(maskCopy)
    });
  } catch (error) {
    segmentationInput = createPersonSegmentationInput({
      ...segmentationInput,
      modelReady: segmentationModelReady,
      active: false,
      error: error?.message ?? "segmentation-error"
    });
  }
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  detectHands(now);
  detectPose(now);
  detectPersonSegmentation(now);
  if (ENABLE_BOOK_MAPPING) {
    bookMappingExperience?.update({
      input: createHandInput({
        hands: getInteractionHands(),
        pointer: smoothedHands.length ? null : getPointerFallback()
      }),
      poseInput,
      segmentationInput,
      cameraActive,
      coverReady: cameraActive && visionModelReady,
      trackedHandsCount: smoothedHands.length,
      trackedPose: poseInput.stable
    });
  }
  renderer.render(scene, camera);
}

async function init() {
  document.body.classList.toggle("is-debug-mode", DEBUG_MODE);
  createRenderer();
  if (ENABLE_BOOK_MAPPING) {
    bookMappingExperience = new BookMappingExperience({
      renderer,
      scene,
      camera,
      config: {
        ...experienceConfig,
        debug: DEBUG_MODE
      },
      debugEntryState: getDebugEntryState()
    });
    bookMappingExperience.init();
  }
  animate();
  startButton.addEventListener("click", startCamera);
  cameraSelect?.addEventListener("change", () => {
    setStatus("Cámara seleccionada. Activa la cámara para probar tracking.");
  });

  startButton.disabled = false;
  await populateCameraOptions();
  setStatus("Puedes activar la cámara. El tracking se cargará en paralelo.");

  loadVisionModel().catch((error) => {
    startButton.disabled = false;
    setDebug(debugHands, "Tracking: no cargó el modelo");
    setStatus("No se pudo cargar el tracking, pero puedes probar la cámara/webcam.");
    console.error(error);
  });
}

init();
