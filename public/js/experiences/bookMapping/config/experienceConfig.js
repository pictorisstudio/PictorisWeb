import { ExperienceState } from "../core/ExperienceState.js";

export const experienceConfig = {
  debug: true,

  idle: {
    title: "DEL LIBRO A LA PANTALLA",
    instruction: "Levanta tu mano para comenzar",
    handActivationDelay: 700,
    absenceResetDelay: 7000,
    gesture: {
      enterThreshold: 0.32,
      exitThreshold: 0.39,
      holdDuration: 1050,
      lostTrackingGrace: 260
    }
  },

  cursor: {
    enabled: true,
    size: 28,
    smoothing: 0.18,
    hideDelay: 150,
    mirrorX: true
  },

  audio: {
    cover: {
      id: "coverAmbience",
      src: "audio/cover/cover-ambience.mp3",
      volume: 0.32,
      fadeIn: 1300,
      fadeOut: 900,
      resetOnStop: true
    },
    coverConfirm: {
      id: "coverConfirm",
      src: "audio/cover/cover-confirm.mp3",
      volume: 0.45
    }
  },

  literaryIntro: {
    activationStableTime: 700,
    audio: {
      id: "literaryWind",
      src: "audio/literary/SonidoViento-Letras.mp3",
      volume: 0.8,
      fadeIn: 1400,
      fadeOut: 1600
    },
    letters: {
      count: 72,
      minScale: 0.38,
      maxScale: 1.14,
      driftSpeed: 0.26,
      interactionRadius: 2.18,
      pushStrength: 0.038,
      maxPush: 0.095,
      damping: 0.962,
      centerClearStrength: 0.022,
      colors: ["#f3ead2", "#c8d2e7", "#d8bd74", "#eee7d6"]
    },
    exploration: {
      minimumTime: 3600,
      movementThreshold: 1.65,
      freeInteractionTime: 1200
    },
    continueGesture: {
      enabled: true,
      enterThreshold: 0.32,
      exitThreshold: 0.39,
      holdDuration: 1050,
      lostTrackingGrace: 260,
      fallbackTimeout: 13000
    },
    tutorial: {
      moveHandMinDuration: 2800,
      moveHandMaxDuration: 6200
    },
    title: {
      fadeIn: 800,
      readableDuration: 5400,
      fadeOut: 1000,
      transitionDuration: 1200
    }
  },

  timeline: {
    [ExperienceState.IDLE]: {
      title: "DEL LIBRO A LA PANTALLA",
      subtitle: "Levanta tu mano para comenzar",
      color: "#07050d"
    },
    [ExperienceState.LITERARY_INTRO]: {
      duration: 26000,
      title: "MUEVE TU MANO",
      color: "#080b1d"
    },
    [ExperienceState.LITERARY_TITLE]: {
      duration: 7200,
      next: ExperienceState.ALICE_INTRO,
      title: "VAMOS A RECONSTRUIR GRANDES HISTORIAS DE LA LITERATURA",
      color: "#080b1d"
    },
    [ExperienceState.ALICE_INTRO]: {
      duration: 2600,
      next: ExperienceState.ALICE_GAME,
      title: "ALICIA EN EL PAIS DE LAS MARAVILLAS",
      subtitle: "LA CAIDA",
      color: "#10173a"
    },
    [ExperienceState.ALICE_GAME]: {
      duration: 18000,
      next: ExperienceState.ALICE_RESULT,
      title: "ALICE - THE FALL",
      color: "#080712"
    },
    [ExperienceState.ALICE_RESULT]: {
      duration: 3800,
      next: ExperienceState.TRANSITION_TO_PRINCE,
      title: "HISTORIA DESCUBIERTA",
      color: "#080712"
    },
    [ExperienceState.TRANSITION_TO_PRINCE]: {
      duration: 2800,
      next: ExperienceState.PRINCE_INTRO,
      title: "HISTORIA DESCUBIERTA",
      color: "#07122d"
    },
    [ExperienceState.PRINCE_INTRO]: {
      duration: 4200,
      next: ExperienceState.PRINCE_GAME,
      title: "MI PEQUEÑO PLANETA",
      color: "#07122d"
    },
    [ExperienceState.PRINCE_GAME]: {
      duration: 28000,
      next: ExperienceState.PRINCE_RESULT,
      title: "MI PEQUEÑO PLANETA",
      color: "#07122d"
    },
    [ExperienceState.PRINCE_RESULT]: {
      duration: 5200,
      next: ExperienceState.TRANSITION_TO_SUBMARINE,
      title: "CUIDASTE TU PEQUEÑO MUNDO",
      color: "#07122d"
    },
    [ExperienceState.TRANSITION_TO_SUBMARINE]: {
      duration: 2800,
      next: ExperienceState.SUBMARINE_INTRO,
      title: "DESCUBRIR LAS PROFUNDIDADES",
      color: "#031225"
    },
    [ExperienceState.SUBMARINE_INTRO]: {
      duration: 5600,
      next: ExperienceState.SUBMARINE_GAME,
      title: "DESCUBRIR LAS PROFUNDIDADES",
      color: "#031225"
    },
    [ExperienceState.SUBMARINE_GAME]: {
      duration: 30000,
      next: ExperienceState.SUBMARINE_RESULT,
      title: "DESCUBRIR LAS PROFUNDIDADES",
      color: "#031225"
    },
    [ExperienceState.SUBMARINE_RESULT]: {
      duration: 5600,
      title: "20.000 LEGUAS DE VIAJE SUBMARINO",
      color: "#031225"
    }
  },

  aliceGame: {
    colors: {
      background: "#080712",
      paper: "#F6EBD2",
      ink: "#1C1930",
      line: "#7A5C47",
      gold: "#D7A947",
      pink: "#EA45BE",
      blue: "#3650CF",
      light: "#F8F5FF"
    },
    player: {
      smoothing: 0.22,
      returnToCenter: 0.018,
      minX: -3.1,
      maxX: 3.1,
      minY: -2.0,
      maxY: 2.05,
      collectRadius: 0.95,
      width: 0.88,
      height: 1.2,
      maxTiltZ: 0.28,
      maxTiltX: 0.14,
      opacity: 1,
      lineOpacity: 0.78,
      ornamentOpacity: 0.95,
      borderColor: "#C8B184",
      borderOpacity: 1,
      shadowColor: "#14101F",
      shadowOpacity: 0.48,
      shadowOffsetX: 0.07,
      shadowOffsetY: -0.08
    },
    collectibles: {
      poolSize: 10,
      targetCount: 5,
      speed: 1.55,
      spawnInterval: 1250,
      firstSpawnDelay: 420,
      tutorialTimeout: 6500,
      zSpawn: -10.2,
      collectZMin: -3.25,
      collectZMax: -0.55,
      zDespawn: 1.35,
      types: ["CLOCK"],
      farOpacity: 0.42,
      nearOpacity: 1,
      farScale: 0.34,
      nearScale: 1.55
    },
    book: {
      assetPath: "assets/bookMapping/alice/Libro.png",
      aspectRatio: 1496 / 501,
      position: {
        x: 0,
        y: -1.45,
        z: -2.42
      },
      widthRatio: 0.72,
      minWidth: 6.8,
      maxWidth: 11.4,
      opacity: 1,
      renderOrder: -5
    },
    feedback: {
      pagePulseDuration: 260
    },
    tutorial: {
      moveMinVisible: 1800,
      moveMaxVisible: 3600,
      moveDistanceToAdvance: 0.65
    },
    hud: {
      showTarget: true
    }
  },

  pose: {
    detectionInterval: 1000 / 24,
    smoothing: 0.32,
    minPoseDetectionConfidence: 0.35,
    minPosePresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
    stableLandmarkVisibility: 0.35
  },

  prince: {
    transitionDuration: 2800,
    intro: {
      minimumPoseTime: 1400,
      movementThreshold: 0.045,
      minimumDuration: 3200
    },
    avatar: {
      smoothing: 0.32,
      scale: 1,
      anchorY: -1.18,
      limbWidth: 0.075,
      jointRadius: 0.095
    },
    planet: {
      size: 3.35,
      y: -2.18,
      torsoReaction: true,
      maxTilt: 0.12
    },
    stars: {
      count: 6,
      collisionRadius: 0.74,
      orbitRadius: 2.18,
      orbitSpeed: 0.52,
      tutorialRadius: 0.95,
      collectTravelDuration: 760,
      firstStarScale: 1.35
    },
    rose: {
      stages: [0, 2, 4]
    },
    gameDuration: 28000,
    absenceTimeout: 9000,
    colors: {
      background: "#07122d",
      planet: "#273f8f",
      planetLight: "#62e7ff",
      avatar: "#f8f5ff",
      star: "#f3d66b",
      rose: "#ea45be",
      stem: "#5ee68a"
    }
  },

  submarine: {
    transitionDuration: 2800,
    intro: {
      moveHandMinDuration: 1800,
      detectMovementThreshold: 0.85,
      maxDuration: 5600
    },
    light: {
      radius: 1.28,
      smoothing: 0.16,
      color: "#d8f3ff"
    },
    discovery: {
      holdTime: 700,
      falloff: 0.42,
      objectCount: 4
    },
    game: {
      duration: 30000
    },
    colors: {
      background: "#031225",
      deep: "#061a33",
      water: "#0b3155",
      light: "#d8f3ff",
      revealed: "#c8f0ff",
      hidden: "#173553",
      accent: "#d8bd74"
    },
    objects: [
      {
        id: "jellyfish",
        name: "Medusa",
        x: -0.45,
        y: 0.28,
        radius: 1.05,
        scale: 1.08
      },
      {
        id: "nautilus",
        name: "Nautilus",
        x: -2.9,
        y: 0.7,
        radius: 1.1,
        scale: 1
      },
      {
        id: "squid",
        name: "Calamar gigante",
        x: -0.95,
        y: -1.48,
        radius: 1.18,
        scale: 1.12
      },
      {
        id: "treasure",
        name: "Tesoro",
        x: 2.65,
        y: -1.38,
        radius: 1.05,
        scale: 1.05
      }
    ]
  }
};
