import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class AliceScene {
  constructor({ scene, camera, root, config }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.alice;
    this.group = new THREE.Group();
    this.objects = [];
    this.trailPool = [];
    this.trailCursor = 0;
    this.textures = [];
    this.materials = [];
    this.geometries = [];
    this.titleNode = null;
    this.clock = 0;
    this.lastTrailWorld = null;
    this.previousBackground = null;
    this.zeroVector = new THREE.Vector3();
    this.transitionTarget = new THREE.Vector3();
    this.transitionScale = new THREE.Vector3();
    this.isActive = false;
    this.isTransitioning = false;
    this.debugStats = {
      objects: 0,
      activeTrail: 0,
      maxTrail: this.config.trail.maxParticles,
      palmForceActive: false
    };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.isTransitioning = false;
    this.clock = 0;
    this.lastTrailWorld = null;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.build();
    this.scene.add(this.group);
    this.showTitle();
  }

  update(deltaTime, input) {
    if (!this.isActive) {
      return;
    }

    const delta = deltaTime / 1000;
    this.clock += delta;
    const indexWorld = this.toWorld(input?.primaryHand?.index, input?.source);
    const palmWorld = this.toWorld(input?.primaryHand?.palm, input?.source);
    this.debugStats.palmForceActive = false;

    this.objects.forEach((item) => {
      this.updateFloatingObject(item, delta, palmWorld);
    });

    if (!this.isTransitioning) {
      this.updateTrail(delta, indexWorld);
    } else {
      this.fadeTrail(delta);
    }
    this.updateTitle();
  }

  beginTransition() {
    if (!this.isActive) {
      return;
    }

    this.isTransitioning = true;
    this.titleNode?.remove();
    this.titleNode = null;
    this.lastTrailWorld = null;
  }

  updateTransition(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const delta = deltaTime / 1000;
    this.clock += delta;
    const palmWorld = this.toWorld(input?.primaryHand?.palm, input?.source);
    const convergence = this.smoothstep(0, 0.3, progress);
    const fade = this.smoothstep(0.26, 0.72, progress);
    const interactionStrength = Math.max(1 - this.smoothstep(0.18, 0.62, progress), 0);
    this.debugStats.palmForceActive = false;

    this.objects.forEach((item, index) => {
      const angle = this.clock * (1.2 + progress * 2.2) + item.phase;
      const radius = (1 - convergence) * (1.8 + (index % 5) * 0.16);
      this.transitionTarget.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.58,
        -2.2 - progress * 1.8 - (index % 4) * 0.12
      );

      if (palmWorld && interactionStrength > 0) {
        const direction = item.object.position.clone().sub(palmWorld);
        const distance = direction.length();

        if (distance > 0 && distance < this.config.interaction.palmRadius) {
          const force = (1 - distance / this.config.interaction.palmRadius)
            * this.config.interaction.palmStrength
            * interactionStrength;
          item.offset.add(direction.normalize().multiplyScalar(force));
          this.debugStats.palmForceActive = true;
        }
      }

      item.offset.lerp(this.zeroVector, 0.08);
      item.object.position.lerp(this.transitionTarget, 0.07 + convergence * 0.08);
      item.object.position.add(item.offset);
      item.object.rotation.z += delta * (0.45 + progress * 1.1);
      this.transitionScale.copy(item.baseScale).multiplyScalar(1 - progress * 0.38);
      item.object.scale.lerp(this.transitionScale, 0.08);

      if (item.object.material) {
        item.object.material.opacity = item.baseOpacity * (1 - fade);
      }
    });

    this.fadeTrail(delta);
  }

  exit() {
    this.isActive = false;
    this.titleNode?.remove();
    this.titleNode = null;
    this.lastTrailWorld = null;
    this.isTransitioning = false;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.objects = [];
    this.trailPool = [];
    this.trailCursor = 0;
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.geometries = [];
    this.materials = [];
    this.textures = [];

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }

    this.debugStats.objects = 0;
    this.debugStats.activeTrail = 0;
    this.debugStats.palmForceActive = false;
  }

  destroy() {
    this.exit();
  }

  build() {
    this.buildTypography();
    this.buildCards();
    this.buildClocks();
    this.buildSymbols();
    this.buildSpiral();
    this.buildTrailPool();
    this.debugStats.objects = this.objects.length;
  }

  buildTypography() {
    const words = this.config.typography.words;

    for (let index = 0; index < this.config.typography.count; index += 1) {
      const word = words[index % words.length];
      const texture = this.makeTextTexture(word, {
        color: this.config.colors.text,
        width: 512,
        height: 160,
        font: "900 54px Arial"
      });
      const sprite = this.makeSprite(texture, 1.35, 0.42, 0.72);
      this.addFloating(sprite, index, "text");
    }
  }

  buildCards() {
    const suits = this.config.cards.suits;

    for (let index = 0; index < this.config.cards.count; index += 1) {
      const suit = suits[index % suits.length];
      const isRed = suit === "♥" || suit === "♦";
      const texture = this.makeCardTexture(suit, isRed ? this.config.colors.red : "#111111");
      const sprite = this.makeSprite(texture, 0.72, 1.0, 0.86);
      this.addFloating(sprite, index + 20, "card");
    }
  }

  buildClocks() {
    for (let index = 0; index < this.config.clocks.count; index += 1) {
      const texture = this.makeClockTexture();
      const sprite = this.makeSprite(texture, 0.9, 0.9, 0.55);
      this.addFloating(sprite, index + 40, "clock");
    }
  }

  buildSymbols() {
    const symbols = ["KEY", "♥", "○", "DOOR", "♦", "LOCK"];

    for (let index = 0; index < this.config.symbols.count; index += 1) {
      const texture = this.makeTextTexture(symbols[index % symbols.length], {
        color: index % 2 ? this.config.colors.gold : this.config.colors.red,
        width: 384,
        height: 160,
        font: "900 46px Arial"
      });
      const sprite = this.makeSprite(texture, 0.9, 0.38, 0.56);
      this.addFloating(sprite, index + 60, "symbol");
    }
  }

  buildSpiral() {
    const points = [];
    const turns = 5.5;
    const count = 96;

    for (let index = 0; index < count; index += 1) {
      const t = index / (count - 1);
      const angle = t * Math.PI * 2 * turns;
      const radius = 0.25 + t * 2.65;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -4.2 - t * 4.2
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.config.colors.gold,
      transparent: true,
      opacity: 0.18
    });
    const line = new THREE.Line(geometry, material);
    line.position.z = -2.5;
    this.geometries.push(geometry);
    this.materials.push(material);
    this.group.add(line);
    this.objects.push({
      object: line,
      basePosition: line.position.clone(),
      offset: new THREE.Vector3(),
      phase: 0,
      speed: 0.12,
      type: "spiral",
      baseScale: line.scale.clone(),
      baseOpacity: material.opacity
    });
  }

  buildTrailPool() {
    const trailTextures = [
      this.makeTextTexture("A", { color: this.config.colors.text, width: 128, height: 128, font: "900 70px Arial" }),
      this.makeTextTexture("♥", { color: this.config.colors.red, width: 128, height: 128, font: "900 70px Arial" }),
      this.makeTextTexture("♦", { color: this.config.colors.gold, width: 128, height: 128, font: "900 70px Arial" })
    ];

    for (let index = 0; index < this.config.trail.maxParticles; index += 1) {
      const material = new THREE.SpriteMaterial({
        map: trailTextures[index % trailTextures.length],
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.scale.setScalar(0.18);
      this.materials.push(material);
      this.group.add(sprite);
      this.trailPool.push({
        sprite,
        age: this.config.trail.lifetime,
        lifetime: this.config.trail.lifetime,
        velocity: new THREE.Vector3()
      });
    }
  }

  addFloating(object, seed, type) {
    const z = -2 - (seed % 9) * 0.72;
    const x = ((seed * 1.73) % 8) - 4;
    const y = ((seed * 2.19) % 5.8) - 2.9;
    object.position.set(x, y, z);
    this.group.add(object);
    this.objects.push({
      object,
      basePosition: object.position.clone(),
      offset: new THREE.Vector3(),
      phase: seed * 0.61,
      speed: 0.65 + (seed % 5) * 0.08,
      type,
      baseScale: object.scale.clone(),
      baseOpacity: object.material?.opacity ?? 1
    });
  }

  updateFloatingObject(item, delta, palmWorld) {
    const object = item.object;
    const fall = this.config.motion.fallSpeed * this.clock;
    const baseY = item.basePosition.y + ((fall + item.phase) % 6.5) - 3.25;
    const driftX = Math.sin(this.clock * item.speed + item.phase) * 0.28;
    const driftZ = Math.cos(this.clock * 0.42 + item.phase) * 0.18;
    const procedural = new THREE.Vector3(
      item.basePosition.x + driftX,
      baseY,
      item.basePosition.z + driftZ
    );

    if (palmWorld) {
      const direction = procedural.clone().add(item.offset).sub(palmWorld);
      const distance = direction.length();

      if (distance > 0 && distance < this.config.interaction.palmRadius) {
        const force = (1 - distance / this.config.interaction.palmRadius) * this.config.interaction.palmStrength;
        item.offset.add(direction.normalize().multiplyScalar(force));
        this.debugStats.palmForceActive = true;
      }
    }

    item.offset.lerp(this.zeroVector, 0.045);
    object.position.copy(procedural).add(item.offset);
    object.rotation.z += delta * this.config.motion.rotationSpeed * (item.type === "card" ? 1.8 : 1);

    if (item.type === "clock") {
      object.rotation.z += delta * 0.18;
    }

    if (item.type === "spiral") {
      object.rotation.z += delta * 0.08;
    }
  }

  updateTrail(delta, indexWorld) {
    let activeTrail = 0;

    if (indexWorld) {
      const shouldEmit = !this.lastTrailWorld
        || this.lastTrailWorld.distanceTo(indexWorld) >= this.config.trail.minDistance;

      if (shouldEmit) {
        this.emitTrail(indexWorld);
        this.lastTrailWorld = indexWorld.clone();
      }
    }

    this.trailPool.forEach((particle) => {
      if (particle.age >= particle.lifetime) {
        return;
      }

      particle.age += delta;
      const progress = particle.age / particle.lifetime;
      particle.sprite.position.addScaledVector(particle.velocity, delta);
      particle.sprite.material.opacity = Math.max(1 - progress, 0) * 0.82;
      particle.sprite.scale.setScalar(0.18 + progress * 0.24);
      activeTrail += particle.sprite.material.opacity > 0.01 ? 1 : 0;

      if (particle.age >= particle.lifetime) {
        particle.sprite.visible = false;
      }
    });

    this.debugStats.activeTrail = activeTrail;
  }

  fadeTrail(delta) {
    let activeTrail = 0;

    this.trailPool.forEach((particle) => {
      if (particle.age >= particle.lifetime) {
        return;
      }

      particle.age += delta * 1.8;
      const progress = particle.age / particle.lifetime;
      particle.sprite.material.opacity = Math.max(1 - progress, 0) * 0.82;
      particle.sprite.scale.setScalar(0.18 + progress * 0.24);
      activeTrail += particle.sprite.material.opacity > 0.01 ? 1 : 0;

      if (particle.age >= particle.lifetime) {
        particle.sprite.visible = false;
      }
    });

    this.debugStats.activeTrail = activeTrail;
  }

  emitTrail(position) {
    const particle = this.trailPool[this.trailCursor];
    this.trailCursor = (this.trailCursor + 1) % this.trailPool.length;
    particle.age = 0;
    particle.sprite.visible = true;
    particle.sprite.position.copy(position);
    particle.sprite.position.z = -1.2;
    particle.velocity.set((Math.random() - 0.5) * 0.25, 0.35 + Math.random() * 0.2, -0.18);
  }

  showTitle() {
    this.titleNode = document.createElement("div");
    this.titleNode.className = "alice-title";
    this.titleNode.innerHTML = `
      <h1>ALICIA EN EL PAIS<br>DE LAS MARAVILLAS</h1>
    `;
    this.root.appendChild(this.titleNode);
  }

  updateTitle() {
    if (!this.titleNode) {
      return;
    }

    const age = this.clock * 1000;
    this.titleNode.classList.toggle("is-hidden", age > this.config.title.duration);
  }

  makeSprite(texture, width, height, opacity) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, height, 1);
    this.materials.push(material);
    return sprite;
  }

  makeTextTexture(text, { color, width, height, font }) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;
    context.font = font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, width / 2, height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(texture);
    return texture;
  }

  makeCardTexture(suit, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 360;
    const context = canvas.getContext("2d");
    context.fillStyle = "rgba(242,242,242,0.92)";
    this.roundRect(context, 18, 18, 220, 324, 18);
    context.fill();
    context.strokeStyle = "rgba(0,0,0,0.22)";
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = color;
    context.font = "900 96px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(suit, 128, 180);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(texture);
    return texture;
  }

  makeClockTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    context.strokeStyle = this.config.colors.gold;
    context.lineWidth = 10;
    context.beginPath();
    context.arc(128, 128, 88, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(128, 128);
    context.lineTo(128, 62);
    context.moveTo(128, 128);
    context.lineTo(176, 128);
    context.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(texture);
    return texture;
  }

  roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  toWorld(point, source) {
    if (!point) {
      return null;
    }

    const normalizedX = source === "hand" ? 1 - point.x : point.x;
    return new THREE.Vector3(
      this.camera.left + normalizedX * (this.camera.right - this.camera.left),
      this.camera.top - point.y * (this.camera.top - this.camera.bottom),
      -1.2
    );
  }

  smoothstep(edge0, edge1, value) {
    const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
    return x * x * (3 - 2 * x);
  }

  getDebugStats() {
    return this.debugStats;
  }
}
