import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz?!;:,.";

function makeLetterTexture(character, color) {
  const canvas = document.createElement("canvas");
  const size = 160;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, size, size);
  context.fillStyle = color;
  context.font = "900 104px Inter, Georgia, serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(character, size / 2, size / 2 + 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class LetterField {
  constructor({ camera, config }) {
    this.camera = camera;
    this.config = config;
    this.group = new THREE.Group();
    this.letters = [];
    this.textures = new Map();
    this.materials = [];
    this.lastPalm = null;
    this.movementAmount = 0;
    this.centerClearing = false;
    this.titleMode = false;
    this.create();
  }

  create() {
    for (let index = 0; index < this.config.count; index += 1) {
      const depth = this.pickDepth(index);
      const character = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      const color = this.config.colors[index % this.config.colors.length];
      const texture = this.getTexture(character, color);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: depth === 0 ? 0.28 : depth === 1 ? 0.56 : 0.78,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      const scale = THREE.MathUtils.lerp(this.config.minScale, this.config.maxScale, Math.random() ** 0.72);
      const layerScale = depth === 0 ? 0.68 : depth === 1 ? 0.98 : 1.26;

      sprite.scale.setScalar(scale * layerScale);
      sprite.position.copy(this.randomOrganicPosition(depth));
      sprite.rotation.z = (Math.random() - 0.5) * 0.5;
      this.group.add(sprite);
      this.materials.push(material);
      this.letters.push({
        sprite,
        depth,
        velocity: new THREE.Vector2((Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.008),
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: this.config.driftSpeed * (depth === 0 ? 0.35 : depth === 1 ? 0.72 : 0.95),
        baseOpacity: material.opacity,
        baseScale: scale * layerScale,
        rotationSpeed: (Math.random() - 0.5) * (depth === 0 ? 0.004 : 0.008)
      });
    }
  }

  pickDepth(index) {
    const ratio = index / Math.max(this.config.count - 1, 1);

    if (ratio < 0.42) {
      return 0;
    }

    if (ratio < 0.84) {
      return 1;
    }

    return 2;
  }

  getTexture(character, color) {
    const key = `${character}-${color}`;

    if (!this.textures.has(key)) {
      this.textures.set(key, makeLetterTexture(character, color));
    }

    return this.textures.get(key);
  }

  update(deltaTime, input, progress = 0) {
    const delta = Math.min(deltaTime / 1000, 0.05);
    const palm = input?.primaryHand?.palm?.world ?? null;
    const palmVelocity = this.getPalmVelocity(palm);
    const speedFactor = THREE.MathUtils.clamp(palmVelocity * 3.2, 0.35, 2.25);

    this.letters.forEach((letter, index) => {
      this.updateLetter(letter, index, delta, palm, speedFactor, progress);
    });

    this.lastPalm = palm ? { x: palm.x, y: palm.y } : null;
  }

  updateLetter(letter, index, delta, palm, speedFactor, progress) {
    const sprite = letter.sprite;
    letter.driftAngle += delta * letter.driftSpeed;
    letter.velocity.x += Math.cos(letter.driftAngle + index) * 0.0032 * delta;
    letter.velocity.y += Math.sin(letter.driftAngle * 0.9 + index) * 0.0032 * delta;

    if (palm) {
      this.applyPalmForce(letter, palm, speedFactor);
    }

    if (this.centerClearing) {
      this.applyCenterClear(letter, progress);
    }

    letter.velocity.multiplyScalar(this.config.damping);
    sprite.position.x += letter.velocity.x;
    sprite.position.y += letter.velocity.y;
    sprite.rotation.z += letter.rotationSpeed + letter.velocity.x * 0.18;

    const opacityTarget = this.titleMode ? letter.baseOpacity * 0.22 : letter.baseOpacity;
    letter.sprite.material.opacity += (opacityTarget - letter.sprite.material.opacity) * 0.045;
    const scaleTarget = this.titleMode ? letter.baseScale * 0.9 : letter.baseScale;
    sprite.scale.setScalar(THREE.MathUtils.lerp(sprite.scale.x, scaleTarget, 0.035));

    this.recycle(letter);
  }

  applyPalmForce(letter, palm, speedFactor) {
    const sprite = letter.sprite;
    const dx = sprite.position.x - palm.x;
    const dy = sprite.position.y - palm.y;
    const distance = Math.hypot(dx, dy);
    const radius = this.config.interactionRadius * (letter.depth === 0 ? 0.62 : letter.depth === 1 ? 1 : 1.18);

    if (distance <= 0.001 || distance > radius) {
      return;
    }

    const falloff = 1 - distance / radius;
    const depthForce = letter.depth === 0 ? 0.38 : letter.depth === 1 ? 1 : 1.12;
    const force = Math.min(this.config.pushStrength * falloff * speedFactor * depthForce, this.config.maxPush);
    letter.velocity.x += (dx / distance) * force;
    letter.velocity.y += (dy / distance) * force;
    letter.sprite.rotation.z += force * 0.8;
    this.movementAmount += force;
  }

  applyCenterClear(letter, progress) {
    const sprite = letter.sprite;
    const distance = Math.max(Math.hypot(sprite.position.x, sprite.position.y), 0.001);
    const centerRadius = 3.05 + progress * 1.35;

    if (distance < centerRadius) {
      const force = this.config.centerClearStrength * (1 - distance / centerRadius);
      letter.velocity.x += (sprite.position.x / distance) * force;
      letter.velocity.y += (sprite.position.y / distance) * force;
    }
  }

  getPalmVelocity(palm) {
    if (!palm || !this.lastPalm) {
      return 0;
    }

    return Math.hypot(palm.x - this.lastPalm.x, palm.y - this.lastPalm.y);
  }

  getMovementAmount() {
    return this.movementAmount;
  }

  setCenterClearing(enabled) {
    this.centerClearing = enabled;
  }

  setTitleMode(enabled) {
    this.titleMode = enabled;
    this.centerClearing = enabled;
  }

  recycle(letter) {
    const margin = 1.4;

    if (letter.sprite.position.x > this.camera.right + margin) {
      letter.sprite.position.x = this.camera.left - margin;
      letter.sprite.position.y = this.randomY();
    } else if (letter.sprite.position.x < this.camera.left - margin) {
      letter.sprite.position.x = this.camera.right + margin;
      letter.sprite.position.y = this.randomY();
    }

    if (letter.sprite.position.y > this.camera.top + margin) {
      letter.sprite.position.y = this.camera.bottom - margin;
      letter.sprite.position.x = this.randomX();
    } else if (letter.sprite.position.y < this.camera.bottom - margin) {
      letter.sprite.position.y = this.camera.top + margin;
      letter.sprite.position.x = this.randomX();
    }
  }

  randomX() {
    return THREE.MathUtils.lerp(this.camera.left, this.camera.right, Math.random());
  }

  randomY() {
    return THREE.MathUtils.lerp(this.camera.bottom, this.camera.top, Math.random());
  }

  randomOrganicPosition(depth) {
    const useCluster = Math.random() < 0.46;
    const clusterX = Math.sin(depth * 2.1 + Math.random() * 4) * (this.camera.right - this.camera.left) * 0.26;
    const clusterY = Math.cos(depth * 1.7 + Math.random() * 4) * (this.camera.top - this.camera.bottom) * 0.2;
    const spreadX = (this.camera.right - this.camera.left) * (useCluster ? 0.18 : 0.5);
    const spreadY = (this.camera.top - this.camera.bottom) * (useCluster ? 0.18 : 0.5);
    const x = useCluster ? clusterX + (Math.random() - 0.5) * spreadX : this.randomX();
    const y = useCluster ? clusterY + (Math.random() - 0.5) * spreadY : this.randomY();

    return new THREE.Vector3(
      THREE.MathUtils.clamp(x, this.camera.left, this.camera.right),
      THREE.MathUtils.clamp(y, this.camera.bottom, this.camera.top),
      -0.42 - depth * 0.18
    );
  }

  dispose() {
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.group.clear();
    this.letters = [];
    this.materials = [];
    this.textures.clear();
  }
}
