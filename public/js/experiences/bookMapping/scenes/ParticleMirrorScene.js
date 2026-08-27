import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class ParticleMirrorScene {
  constructor({ scene, camera, root, config, onComplete }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.baseConfig = config.particleMirror;
    this.config = this.resolveModeConfig();
    this.gesture = config.idle.gesture;
    this.onComplete = onComplete;
    this.group = new THREE.Group();
    this.backgroundGeometry = null;
    this.backgroundMaterial = null;
    this.backgroundPoints = null;
    this.backgroundPositions = null;
    this.backgroundTargets = null;
    this.backgroundColors = null;
    this.backgroundSeeds = null;
    this.bodyGeometry = null;
    this.bodyMaterial = null;
    this.bodyPoints = null;
    this.bodyPositions = null;
    this.bodyTargets = null;
    this.bodyColors = null;
    this.bodyMixes = null;
    this.bodyEdges = null;
    this.bodySeeds = null;
    this.node = null;
    this.elapsed = 0;
    this.holdElapsed = 0;
    this.lostTrackingElapsed = 0;
    this.handRaised = false;
    this.lastMaskTimestamp = 0;
    this.isActive = false;
    this.isFadingOut = false;
    this.fadeElapsed = 0;
    this.motionIntensity = 0;
    this.lastHandWorld = null;
  }

  enter() {
    this.exit();
    this.config = this.resolveModeConfig();
    this.isActive = true;
    this.elapsed = 0;
    this.holdElapsed = 0;
    this.lostTrackingElapsed = 0;
    this.handRaised = false;
    this.lastMaskTimestamp = 0;
    this.isFadingOut = false;
    this.fadeElapsed = 0;
    this.motionIntensity = 0;
    this.lastHandWorld = null;
    this.scene.add(this.group);
    this.createParticles();
    this.createUi();
  }

  update(deltaTime, input, segmentationInput) {
    if (!this.isActive) {
      return;
    }

    this.elapsed += deltaTime;
    const now = performance.now();
    this.updateTargets(segmentationInput, now);
    this.updateParticles(deltaTime, input, now);
    this.updateUi();

    if (this.isFadingOut) {
      this.fadeElapsed += deltaTime;
      const visibility = Math.max(1 - this.fadeElapsed / this.config.fadeOutDuration, 0);
      if (this.backgroundMaterial) {
        this.backgroundMaterial.opacity = visibility * this.config.backgroundOpacity;
      }
      if (this.bodyMaterial) {
        this.bodyMaterial.opacity = visibility * this.config.bodyOpacity;
      }
      if (this.node) {
        this.node.style.opacity = String(visibility);
      }
      if (this.fadeElapsed >= this.config.fadeOutDuration) {
        this.onComplete?.();
      }
      return;
    }

    if (this.elapsed < this.config.duration) {
      return;
    }

    this.updateContinueGesture(deltaTime, input);
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.backgroundGeometry?.dispose();
    this.backgroundMaterial?.dispose();
    this.bodyGeometry?.dispose();
    this.bodyMaterial?.dispose();
    this.group.clear();
    this.backgroundGeometry = null;
    this.backgroundMaterial = null;
    this.backgroundPoints = null;
    this.backgroundPositions = null;
    this.backgroundTargets = null;
    this.backgroundColors = null;
    this.backgroundSeeds = null;
    this.bodyGeometry = null;
    this.bodyMaterial = null;
    this.bodyPoints = null;
    this.bodyPositions = null;
    this.bodyTargets = null;
    this.bodyColors = null;
    this.bodyMixes = null;
    this.bodyEdges = null;
    this.bodySeeds = null;
    this.lastHandWorld = null;
  }

  destroy() {
    this.exit();
  }

  resolveModeConfig() {
    const mode = this.baseConfig.mode ?? "base";
    const selectedMode = this.baseConfig.modes?.[mode] ?? this.baseConfig.modes?.base ?? {};

    return {
      ...this.baseConfig,
      ...selectedMode
    };
  }

  createParticles() {
    this.createBackgroundParticles();
    this.createBodyParticles();
  }

  createBackgroundParticles() {
    const count = this.config.backgroundParticleCount;
    this.backgroundPositions = new Float32Array(count * 3);
    this.backgroundTargets = new Float32Array(count * 3);
    this.backgroundColors = new Float32Array(count * 3);
    this.backgroundSeeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const x = THREE.MathUtils.lerp(this.camera.left, this.camera.right, Math.random());
      const y = THREE.MathUtils.lerp(this.camera.bottom, this.camera.top, Math.random());
      this.backgroundPositions[offset] = x;
      this.backgroundPositions[offset + 1] = y;
      this.backgroundPositions[offset + 2] = this.config.z - 0.05;
      this.backgroundTargets[offset] = x;
      this.backgroundTargets[offset + 1] = y;
      this.backgroundTargets[offset + 2] = this.config.z - 0.05;
      this.backgroundSeeds[index] = Math.random() * 1000;
      this.setBackgroundParticleColor(index, Math.random());
    }

    this.backgroundGeometry = new THREE.BufferGeometry();
    this.backgroundGeometry.setAttribute("position", new THREE.BufferAttribute(this.backgroundPositions, 3));
    this.backgroundGeometry.setAttribute("color", new THREE.BufferAttribute(this.backgroundColors, 3));
    this.backgroundMaterial = new THREE.PointsMaterial({
      size: this.config.particleSizeBackground,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: this.config.backgroundOpacity,
      depthTest: false,
      depthWrite: false,
      blending: this.config.backgroundAdditive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.backgroundPoints = new THREE.Points(this.backgroundGeometry, this.backgroundMaterial);
    this.backgroundPoints.renderOrder = 11;
    this.group.add(this.backgroundPoints);
  }

  createBodyParticles() {
    const count = this.config.bodyParticleCount;
    this.bodyPositions = new Float32Array(count * 3);
    this.bodyTargets = new Float32Array(count * 3);
    this.bodyColors = new Float32Array(count * 3);
    this.bodyMixes = new Float32Array(count);
    this.bodyEdges = new Float32Array(count);
    this.bodySeeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const angle = index * 0.31;
      const x = Math.cos(angle) * (this.camera.right - this.camera.left) * 0.12;
      const y = Math.sin(angle * 1.43) * (this.camera.top - this.camera.bottom) * 0.2;
      this.bodyPositions[offset] = x;
      this.bodyPositions[offset + 1] = y;
      this.bodyPositions[offset + 2] = this.config.z;
      this.bodyTargets[offset] = x;
      this.bodyTargets[offset + 1] = y;
      this.bodyTargets[offset + 2] = this.config.z;
      this.bodySeeds[index] = Math.random() * 1000;
      this.bodyMixes[index] = Math.random();
      this.bodyEdges[index] = 0;
      this.setBodyParticleColor(index, this.bodyMixes[index], 0, 0);
    }

    this.bodyGeometry = new THREE.BufferGeometry();
    this.bodyGeometry.setAttribute("position", new THREE.BufferAttribute(this.bodyPositions, 3));
    this.bodyGeometry.setAttribute("color", new THREE.BufferAttribute(this.bodyColors, 3));
    this.bodyMaterial = new THREE.PointsMaterial({
      size: this.config.particleSizeBody,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: this.config.bodyOpacity,
      depthTest: false,
      depthWrite: false,
      blending: this.config.bodyAdditive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.bodyPoints = new THREE.Points(this.bodyGeometry, this.bodyMaterial);
    this.bodyPoints.renderOrder = 12;
    this.group.add(this.bodyPoints);
  }

  updateTargets(segmentationInput, now) {
    if (!segmentationInput?.mask || !segmentationInput.width || !segmentationInput.height) {
      this.updateIdleTargets(now);
      return;
    }

    if (segmentationInput.timestamp === this.lastMaskTimestamp) {
      return;
    }

    this.lastMaskTimestamp = segmentationInput.timestamp;
    const { mask, width, height } = segmentationInput;
    const count = this.config.bodyParticleCount;
    const threshold = this.config.maskThreshold;
    const scanStep = this.config.maskSampleStep;
    const validPoints = [];

    for (let y = 0; y < height; y += scanStep) {
      for (let x = 0; x < width; x += scanStep) {
        if (mask[y * width + x] >= threshold) {
          const normalizedX = x / Math.max(width - 1, 1);
          const normalizedY = y / Math.max(height - 1, 1);
          const edge = this.isMaskEdge(mask, width, height, x, y, threshold, scanStep) ? 1 : 0;
          const point = { x, y, edge };
          validPoints.push(point);

          if (
            this.config.torsoDensityBoost
            && !edge
            && normalizedX > 0.22
            && normalizedX < 0.78
            && normalizedY > 0.08
            && normalizedY < 0.86
          ) {
            validPoints.push(point);
          }

          if (this.config.edgeDensityBoost && edge && Math.random() > 0.45) {
            validPoints.push(point);
          }
        }
      }
    }

    if (!validPoints.length) {
      this.updateIdleTargets(now);
      return;
    }

    const worldWidth = this.camera.right - this.camera.left;
    const worldHeight = this.camera.top - this.camera.bottom;

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const point = validPoints[(index * 37 + Math.floor(Math.random() * validPoints.length)) % validPoints.length];
      const normalizedX = point.x / Math.max(width - 1, 1);
      const normalizedY = point.y / Math.max(height - 1, 1);
      const edgeFreedom = point.edge * this.config.edgeScatter;
      const jitterX = (Math.random() - 0.5) * (this.config.bodyJitter + edgeFreedom);
      const jitterY = (Math.random() - 0.5) * (this.config.bodyJitter + edgeFreedom);

      this.bodyTargets[offset] = this.camera.left + normalizedX * worldWidth + jitterX;
      this.bodyTargets[offset + 1] = this.camera.top - normalizedY * worldHeight + jitterY;
      this.bodyTargets[offset + 2] = this.config.z;
      this.bodyMixes[index] = normalizedY;
      this.bodyEdges[index] = point.edge;
      this.setBodyParticleColor(index, normalizedY, point.edge, this.motionIntensity);
    }

    this.bodyGeometry.attributes.color.needsUpdate = true;
  }

  updateIdleTargets(now) {
    const count = this.config.bodyParticleCount;
    const radiusX = (this.camera.right - this.camera.left) * 0.16;
    const radiusY = (this.camera.top - this.camera.bottom) * 0.26;

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const angle = index * 0.23 + now * 0.00022;
      this.bodyTargets[offset] = Math.cos(angle) * radiusX;
      this.bodyTargets[offset + 1] = Math.sin(angle * 1.37) * radiusY;
      this.bodyTargets[offset + 2] = this.config.z;
      this.bodyEdges[index] = 0.25;
    }
  }

  updateParticles(deltaTime, input, now) {
    this.updateBackgroundParticles(deltaTime, now);
    this.updateBodyParticles(deltaTime, input, now);
  }

  updateBackgroundParticles(deltaTime, now) {
    const count = this.config.backgroundParticleCount;
    const lerp = 1 - Math.pow(1 - this.config.backgroundFollowStrength, deltaTime / 16.67);
    const width = this.camera.right - this.camera.left;
    const height = this.camera.top - this.camera.bottom;

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const seed = this.backgroundSeeds[index];
      const driftX = Math.sin(now * 0.00012 + seed) * width * 0.025;
      const driftY = Math.cos(now * 0.0001 + seed * 1.7) * height * 0.02;
      this.backgroundTargets[offset] += driftX * this.config.backgroundDrift;
      this.backgroundTargets[offset + 1] += driftY * this.config.backgroundDrift;

      if (this.backgroundTargets[offset] < this.camera.left - 0.2) {
        this.backgroundTargets[offset] = this.camera.right + 0.2;
      } else if (this.backgroundTargets[offset] > this.camera.right + 0.2) {
        this.backgroundTargets[offset] = this.camera.left - 0.2;
      }

      if (this.backgroundTargets[offset + 1] < this.camera.bottom - 0.2) {
        this.backgroundTargets[offset + 1] = this.camera.top + 0.2;
      } else if (this.backgroundTargets[offset + 1] > this.camera.top + 0.2) {
        this.backgroundTargets[offset + 1] = this.camera.bottom - 0.2;
      }

      this.backgroundPositions[offset] += (this.backgroundTargets[offset] - this.backgroundPositions[offset]) * lerp;
      this.backgroundPositions[offset + 1] += (this.backgroundTargets[offset + 1] - this.backgroundPositions[offset + 1]) * lerp;
      this.backgroundPositions[offset + 2] = this.config.z - 0.08 + Math.sin(now * 0.0005 + seed) * 0.02;
    }

    this.backgroundGeometry.attributes.position.needsUpdate = true;
  }

  updateBodyParticles(deltaTime, input, now) {
    const count = this.config.bodyParticleCount;
    const lerp = 1 - Math.pow(1 - this.config.followStrength, deltaTime / 16.67);
    const hands = this.getHandWorldPoints(input);
    const primaryHand = hands[0] ?? null;
    const handSpeed = this.getHandSpeed(primaryHand, deltaTime);
    this.motionIntensity = THREE.MathUtils.lerp(
      this.motionIntensity,
      Math.min(handSpeed * this.config.motionColorIntensity, 1),
      0.08
    );

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const seed = this.bodySeeds[index];
      const edge = this.bodyEdges[index];
      let targetX = this.bodyTargets[offset];
      let targetY = this.bodyTargets[offset + 1];

      const breath = this.config.bodyBreath + edge * this.config.edgeBreath;
      const pulse = 1 + Math.sin(now * 0.0016 + seed * 0.7) * this.config.bodyPulse;
      targetX += Math.sin(now * 0.00145 + seed) * breath * pulse;
      targetY += Math.cos(now * 0.0012 + seed * 1.37) * breath * pulse;

      if (hands.length && this.elapsed >= this.config.instructionDuration) {
        for (const hand of hands) {
          const dx = targetX - hand.x;
          const dy = targetY - hand.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.001 && distance < this.config.handRepulsionRadius) {
            const push = (1 - distance / this.config.handRepulsionRadius)
              * this.config.handRepulsionForce
              * (1 + this.motionIntensity * 0.75);
            const turbulence = Math.sin(now * 0.008 + seed) * this.config.handTurbulence * (1 + this.motionIntensity);
            targetX += (dx / distance) * push + (-dy / distance) * turbulence;
            targetY += (dy / distance) * push + (dx / distance) * turbulence;
          }
        }
      }

      this.bodyPositions[offset] += (targetX - this.bodyPositions[offset]) * lerp;
      this.bodyPositions[offset + 1] += (targetY - this.bodyPositions[offset + 1]) * lerp;
      this.bodyPositions[offset + 2] = this.config.z + Math.sin(now * 0.001 + index) * 0.015;

      this.setBodyParticleColor(index, this.bodyMixes[index], edge, this.motionIntensity);
    }

    this.bodyGeometry.attributes.position.needsUpdate = true;
    this.bodyGeometry.attributes.color.needsUpdate = true;
  }

  getHandWorldPoints(input) {
    const points = [];
    const primary = input?.primaryHand?.palm?.world;

    if (primary) {
      points.push(primary);
    }

    for (const hand of input?.hands ?? []) {
      const world = hand?.palm?.world;
      if (world && world !== primary) {
        points.push(world);
      }
    }

    return points;
  }

  getHandSpeed(hand, deltaTime) {
    if (!hand) {
      this.lastHandWorld = null;
      return 0;
    }

    if (!this.lastHandWorld) {
      this.lastHandWorld = { x: hand.x, y: hand.y };
      return 0;
    }

    const distance = Math.hypot(hand.x - this.lastHandWorld.x, hand.y - this.lastHandWorld.y);
    this.lastHandWorld.x = hand.x;
    this.lastHandWorld.y = hand.y;
    return distance / Math.max(deltaTime / 16.67, 1);
  }

  isMaskEdge(mask, width, height, x, y, threshold, step) {
    const neighbors = [
      [x - step, y],
      [x + step, y],
      [x, y - step],
      [x, y + step]
    ];

    return neighbors.some(([neighborX, neighborY]) => {
      if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) {
        return true;
      }

      return mask[neighborY * width + neighborX] < threshold;
    });
  }

  setBackgroundParticleColor(index, mix) {
    const palette = this.config.backgroundColors;
    const offset = index * 3;
    const color = new THREE.Color(palette[index % palette.length]);
    const accent = new THREE.Color(palette[(index + 1) % palette.length]);
    color.lerp(accent, (mix + index * 0.011) % 1);
    this.backgroundColors[offset] = color.r;
    this.backgroundColors[offset + 1] = color.g;
    this.backgroundColors[offset + 2] = color.b;
  }

  setBodyParticleColor(index, mix, edge = 0, motion = 0) {
    const palette = this.config.bodyColors;
    const offset = index * 3;
    const color = new THREE.Color(palette[index % palette.length]);
    const accent = new THREE.Color(palette[(index + 1) % palette.length]);
    const highlight = new THREE.Color("#f8f5ff");
    color.lerp(accent, (mix + index * 0.017 + motion * 0.22) % 1);
    color.lerp(new THREE.Color("#ea45be"), motion * 0.34);
    color.lerp(highlight, Math.min(motion * 0.2 + edge * 0.16, 0.34));
    this.bodyColors[offset] = color.r;
    this.bodyColors[offset + 1] = color.g;
    this.bodyColors[offset + 2] = color.b;
  }

  updateContinueGesture(deltaTime, input) {
    const palm = input?.primaryHand?.palm ?? null;
    const hasPalm = Boolean(palm);
    const y = palm?.y ?? 1;
    const raised = this.handRaised
      ? hasPalm && y < this.gesture.exitThreshold
      : hasPalm && y < this.gesture.enterThreshold;

    if (raised) {
      this.handRaised = true;
      this.holdElapsed += deltaTime;
      this.lostTrackingElapsed = 0;
    } else if (!hasPalm && this.holdElapsed > 0 && this.lostTrackingElapsed < this.gesture.lostTrackingGrace) {
      this.lostTrackingElapsed += deltaTime;
    } else {
      this.handRaised = false;
      this.holdElapsed = 0;
      this.lostTrackingElapsed = 0;
    }

    if (this.holdElapsed >= this.gesture.holdDuration) {
      this.isFadingOut = true;
      this.fadeElapsed = 0;
      this.holdElapsed = 0;
    }
  }

  createUi() {
    this.node = document.createElement("div");
    this.node.className = "particle-mirror-ui";
    this.node.innerHTML = `
      <p class="particle-mirror-intro">MUÉVETE Y DESCUBRE</p>
      <div class="particle-mirror-continue">
        <p>LEVANTA TU MANO PARA CONTINUAR</p>
        <div class="particle-mirror-hold"><span></span></div>
      </div>
    `;
    this.root.appendChild(this.node);
  }

  updateUi() {
    if (!this.node) {
      return;
    }

    const intro = this.node.querySelector(".particle-mirror-intro");
    const continueNode = this.node.querySelector(".particle-mirror-continue");
    const holdBar = this.node.querySelector(".particle-mirror-hold span");
    const showIntro = this.elapsed < this.config.instructionDuration;
    const canContinue = this.elapsed >= this.config.duration;

    intro?.classList.toggle("is-hidden", !showIntro);
    continueNode?.classList.toggle("is-visible", canContinue && !this.isFadingOut);
    if (holdBar) {
      holdBar.style.transform = `scaleX(${Math.min(this.holdElapsed / this.gesture.holdDuration, 1)})`;
    }
  }
}
