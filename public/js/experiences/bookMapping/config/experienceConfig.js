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
    [ExperienceState.INTRO]: {
      duration: 3000,
      next: ExperienceState.ALICE,
      title: "DEL LIBRO A LA PANTALLA",
      subtitle: "Un recorrido automático por historias, imagen y pantalla.",
      color: "#10173a"
    },
    [ExperienceState.ALICE]: {
      duration: 8000,
      next: ExperienceState.TRANSITION_ALICE_OZ,
      title: "ALICIA EN EL PAIS DE LAS MARAVILLAS",
      subtitle: "Escena provisional",
      color: "#315C8C"
    },
    [ExperienceState.TRANSITION_ALICE_OZ]: {
      duration: 3200,
      next: ExperienceState.OZ,
      title: "TRANSICION",
      subtitle: "Alicia a Oz",
      color: "#243f70"
    },
    [ExperienceState.OZ]: {
      duration: 8000,
      next: ExperienceState.TRANSITION_OZ_FRANKENSTEIN,
      title: "EL MARAVILLOSO MAGO DE OZ",
      subtitle: "Escena provisional",
      color: "#3E7B55"
    },
    [ExperienceState.TRANSITION_OZ_FRANKENSTEIN]: {
      duration: 2500,
      next: ExperienceState.FRANKENSTEIN,
      title: "TRANSICION",
      subtitle: "Oz a Frankenstein",
      color: "#2f594f"
    },
    [ExperienceState.FRANKENSTEIN]: {
      duration: 8000,
      next: ExperienceState.TRANSITION_FRANKENSTEIN_CINEMA,
      title: "FRANKENSTEIN",
      subtitle: "Electricidad, materia y memoria",
      color: "#3C4046"
    },
    [ExperienceState.TRANSITION_FRANKENSTEIN_CINEMA]: {
      duration: 3000,
      next: ExperienceState.CINEMA,
      title: "TRANSICION",
      subtitle: "Frankenstein a Cinema",
      color: "#182037"
    },
    [ExperienceState.CINEMA]: {
      duration: 6000,
      next: ExperienceState.END,
      title: "CINEMA",
      subtitle: "La historia se transforma en imagen en movimiento.",
      color: "#3650CF"
    },
    [ExperienceState.END]: {
      duration: 5000,
      title: "DEL LIBRO A LA PANTALLA",
      subtitle: "Las historias cambian de forma.",
      color: "#EA45BE"
    }
  },

  intro: {
    colors: {
      background: "#080712",
      paper: "#EEE6D7",
      ink: "#F8F5FF",
      accent: "#EA45BE",
      blue: "#3650CF"
    },
    words: ["LIBRO", "PAGINA", "VOZ", "IMAGEN", "HISTORIA", "PANTALLA", "LUZ", "RELATO", "MEMORIA"],
    pages: 7,
    wordSprites: 18,
    driftSpeed: 0.22
  },

  alice: {
    colors: {
      background: "#05070B",
      text: "#F2F2F2",
      red: "#B92732",
      gold: "#C49A4A",
      darkBlue: "#091326"
    },
    typography: {
      count: 12,
      words: ["ALICIA", "TIEMPO", "CURIOSIDAD", "SUEÑO", "CAER", "MAS", "MENOS", "AQUI", "ALLA"]
    },
    cards: {
      count: 10,
      suits: ["♥", "♦", "♣", "♠"]
    },
    clocks: {
      count: 3
    },
    symbols: {
      count: 6
    },
    interaction: {
      palmRadius: 1.8,
      palmStrength: 0.35
    },
    trail: {
      maxParticles: 40,
      lifetime: 1.2,
      minDistance: 0.24
    },
    motion: {
      fallSpeed: 0.15,
      rotationSpeed: 0.08
    },
    title: {
      duration: 2200
    }
  },

  aliceToOz: {
    phases: {
      convergenceEnd: 0.3,
      transformationEnd: 0.7
    },
    colors: {
      start: "#05070B",
      end: "#092b28",
      yellowRoad: "#E3B72F",
      roadShadow: "#7c5f16"
    },
    road: {
      pieces: 22,
      width: 1.0,
      height: 0.32,
      depthSpacing: 0.65,
      curveAmplitude: 0.45,
      curveFrequency: 0.7
    },
    interaction: {
      initialStrength: 0.25,
      radius: 1.55
    },
    title: {
      revealAt: 0.82
    }
  },

  oz: {
    colors: {
      background: "#061417",
      yellow: "#E3B72F",
      yellowDark: "#8A691B",
      emerald: "#18A77B",
      emeraldDark: "#0B3D35",
      light: "#F2E8C9"
    },
    road: {
      pieces: 24,
      speed: 0.18,
      curveAmplitude: 0.5,
      curveFrequency: 0.65,
      nearY: -3.25,
      farY: 2.55,
      nearScale: 1.35,
      farScale: 0.28,
      waveRadius: 1.8,
      waveStrength: 0.25,
      waveFrequency: 4.2,
      waveSpeed: 4.6
    },
    wind: {
      count: 28,
      speed: 0.7
    },
    vortex: {
      count: 22,
      rotationSpeed: 0.6
    },
    city: {
      pulseSpeed: 0.5
    },
    trail: {
      maxParticles: 40,
      lifetime: 1.3,
      minDistance: 0.2
    }
  },

  ozToFrankenstein: {
    colors: {
      start: "#061417",
      end: "#101622",
      yellow: "#E3B72F",
      wire: "#A9C7DE",
      electric: "#62E7FF",
      dark: "#070A10"
    },
    pieces: 24,
    cables: 18,
    sparks: 32,
    interaction: {
      radius: 1.65,
      strength: 0.32
    }
  },

  frankenstein: {
    colors: {
      background: "#070A10",
      steel: "#A9C7DE",
      electric: "#62E7FF",
      violet: "#EA45BE",
      blue: "#3650CF",
      core: "#DDEBFF"
    },
    nodes: 9,
    cables: 13,
    bolts: 22,
    sparks: 36,
    indexCooldown: 180,
    autoPulseEvery: 900,
    palmRadius: 2.1,
    palmStrength: 0.34
  },

  frankensteinToCinema: {
    colors: {
      start: "#070A10",
      end: "#050409",
      electric: "#62E7FF",
      frame: "#F8F5FF",
      pink: "#EA45BE",
      blue: "#3650CF"
    },
    lines: 20,
    frames: 18,
    strips: 2
  },

  cinema: {
    colors: {
      background: "#050409",
      screen: "#F8F5FF",
      darkScreen: "#101018",
      light: "#FFECC2",
      pink: "#EA45BE",
      blue: "#3650CF"
    },
    frames: 22,
    bursts: 30,
    palmRadius: 2.0,
    palmStrength: 0.46,
    indexCooldown: 220
  }
};
