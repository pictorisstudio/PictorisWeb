import { ExperienceState } from "../core/ExperienceState.js";

export const experienceConfig = {
  debug: true,

  idle: {
    title: "DEL LIBRO A LA PANTALLA",
    instruction: "Levanta tu mano para comenzar",
    handActivationDelay: 700,
    absenceResetDelay: 7000
  },

  cursor: {
    enabled: true,
    size: 28,
    smoothing: 0.18,
    hideDelay: 150,
    mirrorX: true
  },

  timeline: {
    [ExperienceState.IDLE]: {
      title: "DEL LIBRO A LA PANTALLA",
      subtitle: "Levanta tu mano para comenzar",
      color: "#07050d"
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
      title: "HISTORIA DESCUBIERTA",
      color: "#080712"
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
  }
};
