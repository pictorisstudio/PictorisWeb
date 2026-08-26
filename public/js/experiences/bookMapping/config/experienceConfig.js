import { ExperienceState } from "../core/ExperienceState.js";

export const experienceConfig = {
  debug: false,

  idle: {
    title: "DEL LIBRO A LA PANTALLA",
    instruction: "Levanta tu mano para comenzar",
    handActivationDelay: 2000,
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
      count: 110,
      minScale: 0.38,
      maxScale: 1.14,
      driftSpeed: 0.2,
      interactionRadius: 3.08,
      pushStrength: 0.052,
      maxPush: 0.118,
      handVelocityMultiplier: 4.6,
      handSpeedBase: 0.18,
      velocityClamp: 0.18,
      damping: 0.975,
      centerClearStrength: 0.022,
      layers: {
        background: {
          ratio: 0.28,
          scale: 0.62,
          opacity: 0.24,
          drift: 0.34,
          interaction: 0
        },
        midground: {
          ratio: 0.5,
          scale: 0.98,
          opacity: 0.58,
          drift: 0.72,
          interaction: 1
        },
        foreground: {
          ratio: 0.22,
          scale: 1.22,
          opacity: 0.8,
          drift: 1,
          interaction: 1.18
        }
      },
      colors: ["#f3ead2", "#c8d2e7", "#d8bd74", "#eee7d6"]
    },
    exploration: {
      minimumTime: 12000,
      movementThreshold: 1.65,
      freeInteractionTime: 0
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
      moveHandMinDuration: 12000,
      moveHandMaxDuration: 12000
    },
    title: {
      fadeIn: 800,
      readableDuration: 7000,
      fadeOut: 1000,
      transitionDuration: 1200
    },
    coverTransition: {
      duration: 1600,
      titleReactDuration: 260,
      titleScale: 1.02,
      titleLetterSpacing: "0.065em",
      crossfadeDuration: 1120
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
      duration: 8800,
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
      duration: 4000,
      next: ExperienceState.ALICE_BOOK_RECOVERED,
      title: "¡LO LOGRASTE!",
      color: "#080712"
    },
    [ExperienceState.ALICE_BOOK_RECOVERED]: {
      duration: 9600,
      next: ExperienceState.TRANSITION_TO_SUBMARINE,
      title: "ALICIA - LIBRO RECUPERADO",
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
    },
    [ExperienceState.SUBMARINE_BOOK_RECOVERED]: {
      duration: 9600,
      title: "20.000 LEGUAS - LIBRO RECUPERADO",
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
      assetPath: "assets/bookMapping/alice/alice-page.png",
      aspectRatio: 1122 / 1402,
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
      targetCount: 10,
      speed: 1.55,
      spawnInterval: 1250,
      firstSpawnDelay: 420,
      tutorialTimeout: 6500,
      zSpawn: -10.2,
      collectZMin: -3.25,
      collectZMax: -0.55,
      zDespawn: 1.35,
      types: ["CLOCK"],
      clockAssetPath: "assets/bookMapping/alice/alice-clock.png",
      clockAspectRatio: 1117 / 1408,
      clockHeight: 0.74,
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
      moveMaxVisible: 5000,
      moveDistanceToAdvance: 0.65
    },
    hud: {
      showTarget: true
    }
  },

  aliceBookRecovered: {
    assetPath: "assets/bookMapping/alice/alice-book-recovered.png",
    fadeDuration: 800
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
      assetPath: "assets/bookMapping/prince/prince-planet.png",
      aspectRatio: 1254 / 1254,
      size: 3.35,
      y: -2.18,
      torsoReaction: true,
      maxTilt: 0.12
    },
    silhouette: {
      color: { r: 0, g: 0, b: 0 },
      opacity: 1,
      width: 320,
      height: 180,
      threshold: 34,
      fade: 0.18,
      hideAfter: 950,
      z: -0.66
    },
    segmentation: {
      enabled: true,
      fps: 18
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
      assetPath: "assets/bookMapping/prince/prince-rose.png",
      aspectRatio: 1254 / 1254,
      width: 0.82,
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
    background: {
      assetPath: "assets/bookMapping/submarine/submarine-background.png",
      aspectRatio: 1672 / 941,
      opacity: 1,
      z: -1.25,
      renderOrder: -20
    },
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
    darkness: {
      color: "#020B18",
      opacity: 0.82,
      radius: 2.65,
      softness: 0.72,
      z: -0.42,
      renderOrder: 5
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
        x: 4.25,
        y: 2.2,
        radius: 0.9,
        scale: 1.08,
        assetPath: "assets/bookMapping/submarine/submarine-jellyfish.png",
        aspectRatio: 1254 / 1254,
        width: 1.85
      },
      {
        id: "nautilus",
        name: "Nautilus",
        x: -4.15,
        y: 1.15,
        radius: 0.95,
        scale: 1,
        assetPath: "assets/bookMapping/submarine/submarine-nautilus.png",
        aspectRatio: 1254 / 1254,
        width: 2.65
      },
      {
        id: "squid",
        name: "Calamar gigante",
        x: -7.2,
        y: -2.65,
        radius: 0.92,
        scale: 1.12,
        assetPath: "assets/bookMapping/submarine/submarine-kraken.png",
        aspectRatio: 1254 / 1254,
        width: 2.55
      },
      {
        id: "treasure",
        name: "Tesoro",
        x: 5.25,
        y: -2.7,
        radius: 0.82,
        scale: 1.05,
        assetPath: "assets/bookMapping/submarine/submarine-treasure-chest.png",
        aspectRatio: 1254 / 1254,
        width: 1.75,
        ambientMotion: false
      }
    ]
  },

  submarineBookRecovered: {
    assetPath: "assets/bookMapping/submarine/submarine-book-recovered.png",
    fadeDuration: 800
  }
};
