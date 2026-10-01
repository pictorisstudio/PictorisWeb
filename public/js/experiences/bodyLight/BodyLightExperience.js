const ENABLE_TRAILS = true;
const ENABLE_GHOST_ECHOES = true;
const ENABLE_SHOCKWAVE = true;
const TRAIL_DURATION_MS = 850;
const TRAIL_ENERGY_THRESHOLD = 0.12;
const GHOST_ECHO_DURATION_MS = 780;
const GHOST_ECHO_ENERGY_THRESHOLD = 0.42;
const GHOST_ECHO_CAPTURE_INTERVAL_MS = 170;
const SHOCKWAVE_THRESHOLD = 0.85;
const SHOCKWAVE_REARM_THRESHOLD = 0.48;
const SHOCKWAVE_DURATION_MS = 1300;
const SHOCKWAVE_COOLDOWN_MS = 9000;
const PERSON_THRESHOLD = 96;
const PERSON_LOSS_GRACE_MS = 650;

const AMBIENT_COLORS = [0x2248ff, 0x32d9ff, 0x6d49ff, 0xb531d9];
const BODY_COLORS = [0x57f3ff, 0x8d61ff, 0xf646d0, 0xffb84d, 0xff6f59];
const GHOST_ECHO_COLORS = [
  [0x8d61ff, 0x57f3ff, 0xb531d9],
  [0xf646d0, 0x2248ff, 0x8d61ff],
  [0x32d9ff, 0x6d49ff, 0xff6f59]
];
const ENERGY_POINT_NAMES = ["leftWrist", "rightWrist", "leftShoulder", "rightShoulder", "torsoCenter"];
const ENERGY_POINT_WEIGHTS = [1.45, 1.45, 0.82, 0.82, 0.62];
const TRAIL_POINT_NAMES = ["leftWrist", "rightWrist", "leftShoulder", "rightShoulder", "torsoCenter"];

export const bodyLightPerformanceProfiles = Object.freeze({
  office: Object.freeze({
    key: "office",
    label: "OFFICE",
    ambientParticles: 360,
    bodyParticles: 860,
    trailParticles: 220,
    ghostEchoes: 2,
    segmentationFps: 12,
    pixelRatioMax: 1.35
  }),
  enhanced: Object.freeze({
    key: "enhanced",
    label: "ENHANCED",
    ambientParticles: 820,
    bodyParticles: 1500,
    trailParticles: 420,
    ghostEchoes: 3,
    segmentationFps: 15,
    pixelRatioMax: 2
  })
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function seededWave(seed, time, speed = 1) {
  return Math.sin(time * speed + seed * 17.17);
}

function setColor(THREE, target, index, palette, seed = index) {
  const color = new THREE.Color(palette[Math.abs(seed) % palette.length]);
  target[index * 3] = color.r;
  target[index * 3 + 1] = color.g;
  target[index * 3 + 2] = color.b;
}

export class BodyLightExperience {
  constructor({ THREE, scene, worldBounds, debug = false, performanceProfile = bodyLightPerformanceProfiles.office } = {}) {
    this.THREE = THREE;
    this.scene = scene;
    this.worldBounds = worldBounds;
    this.debug = debug;
    this.performanceProfile = performanceProfile ?? bodyLightPerformanceProfiles.office;
    this.ambientCount = this.performanceProfile.ambientParticles;
    this.bodyCount = this.performanceProfile.bodyParticles;
    this.trailCount = this.performanceProfile.trailParticles;
    this.ghostEchoCount = this.performanceProfile.ghostEchoes;
    this.lastMaskTimestamp = 0;
    this.lastPersonAt = 0;
    this.personDetected = false;
    this.presence = 0;
    this.fps = 0;
    this.frameSamples = 0;
    this.lastFrameAt = 0;
    this.energy = 0;
    this.lastEnergyAt = 0;
    this.hasPreviousEnergyPoints = false;
    this.previousEnergyPoints = new Float32Array(ENERGY_POINT_NAMES.length * 2);
    this.enableTrails = ENABLE_TRAILS;
    this.enableGhostEchoes = ENABLE_GHOST_ECHOES;
    this.enableShockwave = ENABLE_SHOCKWAVE;
    this.trailCursor = 0;
    this.ghostEchoCursor = 0;
    this.lastGhostEchoAt = -GHOST_ECHO_CAPTURE_INTERVAL_MS;
    this.shockwaveActive = false;
    this.shockwaveArmed = true;
    this.shockwaveStartedAt = -SHOCKWAVE_COOLDOWN_MS;
    this.shockwaveLastTriggeredAt = -SHOCKWAVE_COOLDOWN_MS;
    this.shockwaveStatus = "READY";
    this.shockwaveCenter = { x: 0, y: 0 };

    this.ambientPositions = new Float32Array(this.ambientCount * 3);
    this.ambientBasePositions = new Float32Array(this.ambientCount * 3);
    this.ambientColors = new Float32Array(this.ambientCount * 3);
    this.ambientSizes = new Float32Array(this.ambientCount);
    this.ambientSeeds = new Float32Array(this.ambientCount);
    this.ambientDepth = new Float32Array(this.ambientCount);

    this.bodyPositions = new Float32Array(this.bodyCount * 3);
    this.bodyTargets = new Float32Array(this.bodyCount * 3);
    this.bodyScatter = new Float32Array(this.bodyCount * 3);
    this.bodyColors = new Float32Array(this.bodyCount * 3);
    this.bodySizes = new Float32Array(this.bodyCount);
    this.bodySeeds = new Float32Array(this.bodyCount);

    this.trailPositions = new Float32Array(this.trailCount * 3);
    this.trailColors = new Float32Array(this.trailCount * 3);
    this.trailSizes = new Float32Array(this.trailCount);
    this.trailAlphas = new Float32Array(this.trailCount);
    this.trailBirthTimes = new Float32Array(this.trailCount);
    this.trailSeeds = new Float32Array(this.trailCount);
    this.trailVelocities = new Float32Array(this.trailCount * 2);
    this.ghostEchoes = [];
  }

  init() {
    this.createGradient();
    this.createAmbientParticles();
    this.createBodyParticles();
    this.createGhostEchoes();
    this.createTrailParticles();
    this.createShockwaveVisual();
    this.resize(this.worldBounds);
  }

  createGradient() {
    const { THREE } = this;
    this.gradientUniforms = {
      uTime: { value: 0 },
      uPresence: { value: 0 }
    };

    this.gradient = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: this.gradientUniforms,
        depthTest: false,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;
          uniform float uTime;
          uniform float uPresence;
          varying vec2 vUv;

          void main() {
            vec2 p = vUv - 0.5;
            float slowA = sin(uTime * 0.07 + p.x * 4.0 + p.y * 2.0) * 0.5 + 0.5;
            float slowB = cos(uTime * 0.05 - p.x * 2.5 + p.y * 3.5) * 0.5 + 0.5;
            float vignette = smoothstep(0.86, 0.22, length(p));

            vec3 blue = vec3(0.015, 0.035, 0.15);
            vec3 violet = vec3(0.12, 0.035, 0.22);
            vec3 magenta = vec3(0.19, 0.025, 0.13);
            vec3 cyan = vec3(0.025, 0.18, 0.24);

            vec3 color = mix(blue, violet, slowA);
            color = mix(color, magenta, smoothstep(0.18, 0.76, vUv.x + slowB * 0.25));
            color = mix(color, cyan, smoothstep(0.68, 1.1, vUv.y + slowA * 0.28) * 0.32);
            color += vec3(0.035, 0.018, 0.055) * uPresence;
            color *= 0.52 + vignette * 0.72;

            gl_FragColor = vec4(color, 1.0);
          }
        `
      })
    );
    this.gradient.renderOrder = -100;
    this.scene.add(this.gradient);
  }

  createAmbientParticles() {
    const { THREE } = this;

    for (let index = 0; index < this.ambientCount; index += 1) {
      const i3 = index * 3;
      this.ambientSeeds[index] = Math.random();
      this.ambientDepth[index] = Math.random();
      this.ambientPositions[i3] = 0;
      this.ambientPositions[i3 + 1] = 0;
      this.ambientPositions[i3 + 2] = -0.16 - Math.random() * 0.22;
      this.ambientBasePositions[i3] = this.ambientPositions[i3];
      this.ambientBasePositions[i3 + 1] = this.ambientPositions[i3 + 1];
      this.ambientBasePositions[i3 + 2] = this.ambientPositions[i3 + 2];
      this.ambientSizes[index] = index % 10 < 6 ? 4.8 : index % 10 < 9 ? 6.7 : 8.6;
      setColor(THREE, this.ambientColors, index, AMBIENT_COLORS, index);
    }

    this.ambientGeometry = new THREE.BufferGeometry();
    this.ambientGeometry.setAttribute("position", new THREE.BufferAttribute(this.ambientPositions, 3));
    this.ambientGeometry.setAttribute("color", new THREE.BufferAttribute(this.ambientColors, 3));
    this.ambientGeometry.setAttribute("size", new THREE.BufferAttribute(this.ambientSizes, 1));

    this.ambientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0.58 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        uniform float uPixelRatio;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uOpacity;
        varying vec3 vColor;

        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float alpha = smoothstep(0.5, 0.08, length(p));
          gl_FragColor = vec4(vColor, alpha * uOpacity);
        }
      `,
      vertexColors: true
    });

    this.ambientPoints = new THREE.Points(this.ambientGeometry, this.ambientMaterial);
    this.ambientPoints.renderOrder = -10;
    this.scene.add(this.ambientPoints);
  }

  createBodyParticles() {
    const { THREE } = this;

    for (let index = 0; index < this.bodyCount; index += 1) {
      const i3 = index * 3;
      this.bodySeeds[index] = Math.random();
      this.bodyPositions[i3] = 0;
      this.bodyPositions[i3 + 1] = 0;
      this.bodyPositions[i3 + 2] = 0.14 + Math.random() * 0.08;
      this.bodyTargets[i3] = this.bodyPositions[i3];
      this.bodyTargets[i3 + 1] = this.bodyPositions[i3 + 1];
      this.bodyTargets[i3 + 2] = this.bodyPositions[i3 + 2];
      this.bodySizes[index] = index % 12 < 7 ? 11.5 : index % 12 < 11 ? 14 : 16.5;
      setColor(THREE, this.bodyColors, index, BODY_COLORS, Math.floor(index * 0.37));
    }

    this.bodyGeometry = new THREE.BufferGeometry();
    this.bodyGeometry.setAttribute("position", new THREE.BufferAttribute(this.bodyPositions, 3));
    this.bodyGeometry.setAttribute("color", new THREE.BufferAttribute(this.bodyColors, 3));
    this.bodyGeometry.setAttribute("size", new THREE.BufferAttribute(this.bodySizes, 1));

    this.bodyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        uniform float uPixelRatio;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uOpacity;
        varying vec3 vColor;

        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float core = smoothstep(0.42, 0.08, length(p));
          float glow = smoothstep(0.5, 0.18, length(p)) * 0.34;
          gl_FragColor = vec4(vColor, (core + glow) * uOpacity);
        }
      `,
      vertexColors: true
    });

    this.bodyPoints = new THREE.Points(this.bodyGeometry, this.bodyMaterial);
    this.bodyPoints.renderOrder = 10;
    this.scene.add(this.bodyPoints);
  }

  createGhostEchoes() {
    if (!this.enableGhostEchoes) {
      return;
    }

    const { THREE } = this;

    for (let echoIndex = 0; echoIndex < this.ghostEchoCount; echoIndex += 1) {
      const positions = new Float32Array(this.bodyCount * 3);
      const colors = new Float32Array(this.bodyCount * 3);
      const sizes = new Float32Array(this.bodyCount);
      const palette = GHOST_ECHO_COLORS[echoIndex % GHOST_ECHO_COLORS.length];

      for (let index = 0; index < this.bodyCount; index += 1) {
        const i3 = index * 3;
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0.05 - echoIndex * 0.02;
        sizes[index] = this.bodySizes[index] * (0.82 - echoIndex * 0.08);
        setColor(THREE, colors, index, palette, Math.floor(index * 0.31 + echoIndex));
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float size;
          uniform float uPixelRatio;
          varying vec3 vColor;

          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          precision mediump float;
          uniform float uOpacity;
          varying vec3 vColor;

          void main() {
            vec2 p = gl_PointCoord - 0.5;
            float alpha = smoothstep(0.5, 0.12, length(p));
            gl_FragColor = vec4(vColor, alpha * uOpacity);
          }
        `,
        vertexColors: true
      });

      const points = new THREE.Points(geometry, material);
      points.renderOrder = 4 - echoIndex;
      this.scene.add(points);

      this.ghostEchoes.push({
        positions,
        geometry,
        material,
        bornAt: -GHOST_ECHO_DURATION_MS,
        active: false
      });
    }
  }

  createTrailParticles() {
    if (!this.enableTrails) {
      return;
    }

    const { THREE } = this;

    for (let index = 0; index < this.trailCount; index += 1) {
      const i3 = index * 3;
      this.trailSeeds[index] = Math.random();
      this.trailBirthTimes[index] = -TRAIL_DURATION_MS;
      this.trailSizes[index] = index % 10 < 7 ? 8.5 : index % 10 < 9 ? 10.5 : 12.5;
      this.trailPositions[i3] = 0;
      this.trailPositions[i3 + 1] = 0;
      this.trailPositions[i3 + 2] = 0.08;
      setColor(THREE, this.trailColors, index, BODY_COLORS, Math.floor(index * 0.53));
    }

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailGeometry.setAttribute("color", new THREE.BufferAttribute(this.trailColors, 3));
    this.trailGeometry.setAttribute("size", new THREE.BufferAttribute(this.trailSizes, 1));
    this.trailGeometry.setAttribute("alpha", new THREE.BufferAttribute(this.trailAlphas, 1));

    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0.52 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        attribute float alpha;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float alpha = smoothstep(0.48, 0.1, length(p));
          gl_FragColor = vec4(vColor, alpha * vAlpha * uOpacity);
        }
      `,
      vertexColors: true
    });

    this.trailPoints = new THREE.Points(this.trailGeometry, this.trailMaterial);
    this.trailPoints.renderOrder = 6;
    this.scene.add(this.trailPoints);
  }

  createShockwaveVisual() {
    if (!this.enableShockwave) {
      return;
    }

    const { THREE } = this;
    const geometry = new THREE.RingGeometry(0.94, 1, 96);
    const material = new THREE.MeshBasicMaterial({
      color: 0x57f3ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.shockwaveRing = new THREE.Mesh(geometry, material);
    this.shockwaveRing.position.z = 0.03;
    this.shockwaveRing.renderOrder = 3;
    this.scene.add(this.shockwaveRing);
  }

  resize(worldBounds) {
    this.worldBounds = worldBounds;
    this.resetAmbientLayout();
    this.resetBodyScatter();
  }

  resetAmbientLayout() {
    const { left, bottom, width, height } = this.worldBounds;

    for (let index = 0; index < this.ambientCount; index += 1) {
      const i3 = index * 3;
      const seed = this.ambientSeeds[index] || Math.random();
      const depth = this.ambientDepth[index] || Math.random();
      this.ambientBasePositions[i3] = left + ((seed * 997.31) % 1) * width;
      this.ambientBasePositions[i3 + 1] = bottom + ((seed * 431.73) % 1) * height;
      this.ambientBasePositions[i3 + 2] = -0.14 - depth * 0.22;
      this.ambientPositions[i3] = this.ambientBasePositions[i3];
      this.ambientPositions[i3 + 1] = this.ambientBasePositions[i3 + 1];
      this.ambientPositions[i3 + 2] = this.ambientBasePositions[i3 + 2];
    }

    if (this.ambientGeometry) {
      this.ambientGeometry.attributes.position.needsUpdate = true;
    }
  }

  resetBodyScatter() {
    const { left, bottom, width, height } = this.worldBounds;

    for (let index = 0; index < this.bodyCount; index += 1) {
      const i3 = index * 3;
      const seed = this.bodySeeds[index] || Math.random();
      this.bodyScatter[i3] = left + ((seed * 613.19 + index * 0.037) % 1) * width;
      this.bodyScatter[i3 + 1] = bottom + ((seed * 271.91 + index * 0.021) % 1) * height;
      this.bodyScatter[i3 + 2] = 0.04 + (seed % 0.12);

      if (!this.personDetected) {
        this.bodyTargets[i3] = this.bodyScatter[i3];
        this.bodyTargets[i3 + 1] = this.bodyScatter[i3 + 1];
        this.bodyTargets[i3 + 2] = this.bodyScatter[i3 + 2];
      }
    }
  }

  needsPersonSegmentation() {
    return true;
  }

  needsPoseTracking() {
    return true;
  }

  update({ now = performance.now(), segmentationInput = null, poseInput = null, worldBounds = this.worldBounds } = {}) {
    this.updateFps(now);
    this.worldBounds = worldBounds;
    this.gradientUniforms.uTime.value = now * 0.001;
    this.updateEnergy(now, poseInput);
    this.updateShockwave(now, poseInput);

    this.updateAmbient(now);
    this.updateTargetsFromMask(segmentationInput, now);
    this.updateBody(now);
    this.updateGhostEchoes(now);
    this.updateTrail(now, poseInput);
  }

  updateFps(now) {
    if (this.lastFrameAt) {
      const instant = 1000 / Math.max(now - this.lastFrameAt, 1);
      this.fps = this.fps ? lerp(this.fps, instant, 0.08) : instant;
    }
    this.lastFrameAt = now;
    this.frameSamples += 1;
  }

  updateAmbient(now) {
    const time = now * 0.001;
    const { left, right, bottom, top, width, height } = this.worldBounds;
    const shock = this.getShockwaveProgress(now);
    const maxRadius = Math.hypot(width, height) * 0.58;
    const waveRadius = shock.active ? shock.progress * maxRadius : -1;
    const waveWidth = Math.max(width, height) * 0.055;

    for (let index = 0; index < this.ambientCount; index += 1) {
      const i3 = index * 3;
      const seed = this.ambientSeeds[index];
      const depth = 0.35 + this.ambientDepth[index] * 0.65;
      const driftX = 0.0012 * depth;
      const driftY = seededWave(seed, time, 0.42) * 0.0018;

      this.ambientBasePositions[i3] += driftX;
      this.ambientBasePositions[i3 + 1] += driftY;

      if (this.ambientBasePositions[i3] > right + 0.15) this.ambientBasePositions[i3] = left - 0.15;
      if (this.ambientBasePositions[i3 + 1] > top + 0.15) this.ambientBasePositions[i3 + 1] = bottom - 0.15;
      if (this.ambientBasePositions[i3 + 1] < bottom - 0.15) this.ambientBasePositions[i3 + 1] = top + 0.15;

      const pulse = seededWave(seed, time, 0.8) * 0.018;
      this.ambientBasePositions[i3 + 2] = -0.18 - this.ambientDepth[index] * 0.22 + pulse;

      let shockX = 0;
      let shockY = 0;
      let shockZ = 0;

      if (shock.active) {
        const dx = this.ambientBasePositions[i3] - this.shockwaveCenter.x;
        const dy = this.ambientBasePositions[i3 + 1] - this.shockwaveCenter.y;
        const distance = Math.max(Math.hypot(dx, dy), 0.0001);
        const frontDistance = Math.abs(distance - waveRadius);
        const front = clamp(1 - frontDistance / waveWidth, 0, 1);
        const force = front * front * shock.fade * (0.38 + depth * 0.24);
        shockX = (dx / distance) * force;
        shockY = (dy / distance) * force;
        shockZ = front * shock.fade * 0.05;
      }

      this.ambientPositions[i3] = this.ambientBasePositions[i3] + shockX;
      this.ambientPositions[i3 + 1] = this.ambientBasePositions[i3 + 1] + shockY;
      this.ambientPositions[i3 + 2] = this.ambientBasePositions[i3 + 2] + shockZ;
    }

    this.ambientGeometry.attributes.position.needsUpdate = true;
    this.ambientMaterial.uniforms.uOpacity.value = 0.58 + this.presence * 0.1 + shock.fade * 0.22;
    this.ambientMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
  }

  updateTargetsFromMask(segmentationInput, now) {
    const hasFreshMask = Boolean(
      segmentationInput?.mask
      && segmentationInput.width
      && segmentationInput.height
      && segmentationInput.timestamp !== this.lastMaskTimestamp
    );

    if (hasFreshMask) {
      const points = this.collectMaskPoints(segmentationInput);
      if (points.length > 48) {
        this.lastMaskTimestamp = segmentationInput.timestamp;
        this.lastPersonAt = now;
        this.personDetected = true;
        this.assignBodyTargets(points);
      }
    }

    if (now - this.lastPersonAt > PERSON_LOSS_GRACE_MS) {
      this.personDetected = false;
      for (let index = 0; index < this.bodyCount; index += 1) {
        const i3 = index * 3;
        this.bodyTargets[i3] = this.bodyScatter[i3];
        this.bodyTargets[i3 + 1] = this.bodyScatter[i3 + 1];
        this.bodyTargets[i3 + 2] = this.bodyScatter[i3 + 2];
      }
    }
  }

  updateEnergy(now, poseInput) {
    const world = poseInput?.stable ? poseInput.world : null;

    if (!world) {
      this.hasPreviousEnergyPoints = false;
      this.lastEnergyAt = now;
      this.energy = lerp(this.energy, 0, 0.045);
      return;
    }

    for (let index = 0; index < ENERGY_POINT_NAMES.length; index += 1) {
      if (!world[ENERGY_POINT_NAMES[index]]) {
        this.hasPreviousEnergyPoints = false;
        this.lastEnergyAt = now;
        this.energy = lerp(this.energy, 0, 0.045);
        return;
      }
    }

    if (!this.hasPreviousEnergyPoints || !this.lastEnergyAt) {
      for (let index = 0; index < ENERGY_POINT_NAMES.length; index += 1) {
        const point = world[ENERGY_POINT_NAMES[index]];
        this.previousEnergyPoints[index * 2] = point.x;
        this.previousEnergyPoints[index * 2 + 1] = point.y;
      }
      this.hasPreviousEnergyPoints = true;
      this.lastEnergyAt = now;
      return;
    }

    const deltaSeconds = clamp((now - this.lastEnergyAt) / 1000, 0.016, 0.2);
    let distance = 0;

    for (let index = 0; index < ENERGY_POINT_NAMES.length; index += 1) {
      const point = world[ENERGY_POINT_NAMES[index]];
      const xIndex = index * 2;
      const yIndex = xIndex + 1;
      distance += Math.hypot(
        point.x - this.previousEnergyPoints[xIndex],
        point.y - this.previousEnergyPoints[yIndex]
      ) * ENERGY_POINT_WEIGHTS[index];
      this.previousEnergyPoints[xIndex] = point.x;
      this.previousEnergyPoints[yIndex] = point.y;
    }

    this.lastEnergyAt = now;
    const averageVelocity = distance / ENERGY_POINT_NAMES.length / deltaSeconds;
    const targetEnergy = clamp((averageVelocity - 0.08) / 4.2, 0, 1);
    const smoothing = targetEnergy > this.energy ? 0.16 : 0.055;
    this.energy = lerp(this.energy, targetEnergy, smoothing);
  }

  updateShockwave(now, poseInput) {
    if (!this.enableShockwave) {
      this.shockwaveStatus = "OFF";
      return;
    }

    const elapsed = now - this.shockwaveStartedAt;
    this.shockwaveActive = elapsed >= 0 && elapsed <= SHOCKWAVE_DURATION_MS;

    if (this.energy < SHOCKWAVE_REARM_THRESHOLD && !this.shockwaveActive) {
      this.shockwaveArmed = true;
    }

    const inCooldown = now - this.shockwaveLastTriggeredAt < SHOCKWAVE_COOLDOWN_MS;
    const center = poseInput?.stable ? poseInput.world?.torsoCenter : null;

    if (
      this.shockwaveArmed
      && !this.shockwaveActive
      && !inCooldown
      && this.energy >= SHOCKWAVE_THRESHOLD
      && center
    ) {
      this.triggerShockwave(now, center);
    }

    this.updateShockwaveVisual(now);

    if (this.shockwaveActive) {
      this.shockwaveStatus = "ACTIVE";
    } else if (inCooldown || !this.shockwaveArmed) {
      this.shockwaveStatus = "COOLDOWN";
    } else {
      this.shockwaveStatus = "READY";
    }
  }

  triggerShockwave(now, center) {
    this.shockwaveCenter.x = center.x;
    this.shockwaveCenter.y = center.y;
    this.shockwaveStartedAt = now;
    this.shockwaveLastTriggeredAt = now;
    this.shockwaveActive = true;
    this.shockwaveArmed = false;
  }

  getShockwaveProgress(now) {
    if (!this.enableShockwave || !this.shockwaveActive) {
      return { active: false, progress: 0, fade: 0 };
    }

    const progress = clamp((now - this.shockwaveStartedAt) / SHOCKWAVE_DURATION_MS, 0, 1);
    const fade = Math.sin(progress * Math.PI);
    return { active: true, progress, fade };
  }

  updateShockwaveVisual(now) {
    if (!this.shockwaveRing) {
      return;
    }

    const shock = this.getShockwaveProgress(now);

    if (!shock.active) {
      this.shockwaveRing.material.opacity = 0;
      return;
    }

    const maxRadius = Math.hypot(this.worldBounds.width, this.worldBounds.height) * 0.58;
    const radius = Math.max(shock.progress * maxRadius, 0.001);
    this.shockwaveRing.position.x = this.shockwaveCenter.x;
    this.shockwaveRing.position.y = this.shockwaveCenter.y;
    this.shockwaveRing.scale.set(radius, radius, 1);
    this.shockwaveRing.material.opacity = shock.fade * 0.32;
    this.shockwaveRing.material.color.setHSL(0.52 + shock.progress * 0.16, 0.95, 0.62);
  }

  collectMaskPoints(segmentationInput) {
    const { mask, width, height } = segmentationInput;
    const points = [];
    const stride = Math.max(1, Math.floor(Math.sqrt((width * height) / 2600)));
    const minY = Math.floor(height * 0.03);
    const maxY = Math.floor(height * 0.98);

    for (let y = minY; y < maxY; y += stride) {
      for (let x = 0; x < width; x += stride) {
        const value = mask[y * width + x];
        if (value <= PERSON_THRESHOLD) continue;

        const nx = x / Math.max(width - 1, 1);
        const ny = y / Math.max(height - 1, 1);
        points.push({
          x: this.worldBounds.left + nx * this.worldBounds.width,
          y: this.worldBounds.top - ny * this.worldBounds.height,
          confidence: value / 255
        });
      }
    }

    return points;
  }

  assignBodyTargets(points) {
    const bands = Array.from({ length: 18 }, () => []);
    const { bottom, height } = this.worldBounds;

    points.forEach((point) => {
      const normalizedY = clamp((point.y - bottom) / Math.max(height, 1), 0, 0.999);
      const bandIndex = Math.floor((1 - normalizedY) * bands.length);
      bands[clamp(bandIndex, 0, bands.length - 1)].push(point);
    });

    const fallbackPoints = points.length ? points : [{ x: 0, y: 0, confidence: 0.5 }];

    for (let index = 0; index < this.bodyCount; index += 1) {
      const i3 = index * 3;
      const bandCursor = (index * 7 + Math.floor(this.bodySeeds[index] * bands.length)) % bands.length;
      const band = bands[bandCursor]?.length ? bands[bandCursor] : fallbackPoints;
      const pick = Math.floor(((index * 0.61803398875 + this.bodySeeds[index] * 0.37) % 1) * band.length);
      const point = band[clamp(pick, 0, band.length - 1)];
      const confidenceLift = (point.confidence - 0.42) * 0.1;

      this.bodyTargets[i3] = point.x;
      this.bodyTargets[i3 + 1] = point.y;
      this.bodyTargets[i3 + 2] = 0.15 + confidenceLift;
    }
  }

  updateBody(now) {
    const time = now * 0.001;
    const targetPresence = this.personDetected ? 1 : 0;
    this.presence = lerp(this.presence, targetPresence, targetPresence ? 0.035 : 0.028);
    this.gradientUniforms.uPresence.value = this.presence;

    for (let index = 0; index < this.bodyCount; index += 1) {
      const i3 = index * 3;
      const seed = this.bodySeeds[index];
      const jitter = this.personDetected ? 0.01 : 0.004;
      const waveX = seededWave(seed, time, 1.25) * jitter;
      const waveY = seededWave(seed + 0.33, time, 1.05) * jitter;
      const follow = this.personDetected ? 0.16 : 0.055;

      this.bodyPositions[i3] = lerp(this.bodyPositions[i3], this.bodyTargets[i3] + waveX, follow);
      this.bodyPositions[i3 + 1] = lerp(this.bodyPositions[i3 + 1], this.bodyTargets[i3 + 1] + waveY, follow);
      this.bodyPositions[i3 + 2] = lerp(this.bodyPositions[i3 + 2], this.bodyTargets[i3 + 2], follow);
    }

    this.bodyGeometry.attributes.position.needsUpdate = true;
    const shockLift = this.getShockwaveProgress(now).fade * 0.18;
    this.bodyMaterial.uniforms.uOpacity.value = clamp(0.08 + this.presence * 1.18 + shockLift, 0, 1);
    this.bodyMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
  }

  updateGhostEchoes(now) {
    if (!this.enableGhostEchoes || !this.ghostEchoes.length) {
      return;
    }

    this.captureGhostEcho(now);

    for (let index = 0; index < this.ghostEchoes.length; index += 1) {
      const echo = this.ghostEchoes[index];
      const age = now - echo.bornAt;

      if (!echo.active || age < 0 || age > GHOST_ECHO_DURATION_MS) {
        echo.active = false;
        echo.material.uniforms.uOpacity.value = 0;
        continue;
      }

      const life = 1 - age / GHOST_ECHO_DURATION_MS;
      echo.material.uniforms.uOpacity.value = life * life * (0.24 - index * 0.045);
      echo.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
    }
  }

  captureGhostEcho(now) {
    if (
      !this.personDetected
      || this.energy < GHOST_ECHO_ENERGY_THRESHOLD
      || now - this.lastGhostEchoAt < GHOST_ECHO_CAPTURE_INTERVAL_MS
    ) {
      return;
    }

    const echo = this.ghostEchoes[this.ghostEchoCursor];
    echo.positions.set(this.bodyPositions);
    echo.geometry.attributes.position.needsUpdate = true;
    echo.bornAt = now;
    echo.active = true;
    echo.material.uniforms.uOpacity.value = 0.24;

    this.lastGhostEchoAt = now;
    this.ghostEchoCursor = (this.ghostEchoCursor + 1) % this.ghostEchoes.length;
  }

  updateTrail(now, poseInput) {
    if (!this.enableTrails || !this.trailGeometry) {
      return;
    }

    this.fadeTrail(now);
    this.emitTrail(now, poseInput);

    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailGeometry.attributes.alpha.needsUpdate = true;
    this.trailMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
  }

  fadeTrail(now) {
    const time = now * 0.001;

    for (let index = 0; index < this.trailCount; index += 1) {
      const age = now - this.trailBirthTimes[index];
      const i3 = index * 3;

      if (age < 0 || age > TRAIL_DURATION_MS) {
        this.trailAlphas[index] = 0;
        continue;
      }

      const life = 1 - age / TRAIL_DURATION_MS;
      const seed = this.trailSeeds[index];
      this.trailPositions[i3] += this.trailVelocities[index * 2];
      this.trailPositions[i3 + 1] += this.trailVelocities[index * 2 + 1] + seededWave(seed, time, 1.1) * 0.0007;
      this.trailAlphas[index] = life * life * clamp(this.energy * 1.35, 0.16, 1);
    }
  }

  emitTrail(now, poseInput) {
    const world = poseInput?.stable ? poseInput.world : null;

    if (!this.personDetected || this.energy < TRAIL_ENERGY_THRESHOLD || !world) {
      return;
    }

    const emitCount = Math.max(1, Math.round(this.energy * 6));

    for (let emitted = 0; emitted < emitCount; emitted += 1) {
      const source = world[TRAIL_POINT_NAMES[(this.trailCursor + emitted) % TRAIL_POINT_NAMES.length]];
      if (!source) continue;

      const index = this.trailCursor;
      const i3 = index * 3;
      const seed = this.trailSeeds[index];
      const spread = 0.026 + this.energy * 0.042;

      this.trailPositions[i3] = source.x + seededWave(seed, now * 0.001, 2.7) * spread;
      this.trailPositions[i3 + 1] = source.y + seededWave(seed + 0.51, now * 0.001, 2.3) * spread;
      this.trailPositions[i3 + 2] = 0.1;
      this.trailVelocities[index * 2] = seededWave(seed + 0.25, now * 0.001, 1.3) * 0.0048;
      this.trailVelocities[index * 2 + 1] = seededWave(seed + 0.75, now * 0.001, 1.1) * 0.0048;
      this.trailBirthTimes[index] = now;
      this.trailAlphas[index] = clamp(0.22 + this.energy * 0.38, 0, 0.58);
      this.trailCursor = (this.trailCursor + 1) % this.trailCount;
    }
  }

  getDebugMetrics() {
    return {
      profileLabel: this.performanceProfile.label,
      fps: this.fps,
      personDetected: this.personDetected || this.presence > 0.12,
      energy: this.energy,
      trailsEnabled: this.enableTrails,
      ghostEchoesEnabled: this.enableGhostEchoes,
      shockwaveEnabled: this.enableShockwave,
      shockwaveStatus: this.shockwaveStatus,
      ambientCount: this.ambientCount,
      bodyCount: this.bodyCount,
      trailCount: this.trailCount,
      ghostEchoCount: this.ghostEchoCount
    };
  }
}
