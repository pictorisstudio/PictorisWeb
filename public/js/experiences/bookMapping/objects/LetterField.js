import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz?!;:,.";
const GLYPH_TEXTURES = new Map();

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

function acquireGlyphTexture(character, color) {
  const key = `${character}-${color}`;
  const cached = GLYPH_TEXTURES.get(key);

  if (cached) {
    cached.refs += 1;
    return cached.texture;
  }

  const texture = makeLetterTexture(character, color);
  GLYPH_TEXTURES.set(key, { texture, refs: 1 });
  return texture;
}

function releaseGlyphTexture(character, color) {
  const key = `${character}-${color}`;
  const cached = GLYPH_TEXTURES.get(key);

  if (!cached) {
    return;
  }

  cached.refs -= 1;
  if (cached.refs <= 0) {
    cached.texture.dispose();
    GLYPH_TEXTURES.delete(key);
  }
}

export class LetterField {
  constructor({ camera, config }) {
    this.camera = camera;
    this.config = config;
    this.group = new THREE.Group();
    this.letters = [];
    this.materials = [];
    this.lastPalm = { x: 0, y: 0 };
    this.hasLastPalm = false;
    this.handSpeed = 0;
    this.activeInteractions = 0;
    this.movementAmount = 0;
    this.centerClearing = false;
    this.titleMode = false;
    this.opacity = 1;
    this.interactionEnabled = true;
    this.create();
  }

  create() {
    for (let index = 0; index < this.config.count; index += 1) {
      const layer = this.pickLayer(index);
      const character = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      const color = this.config.colors[index % this.config.colors.length];
      const texture = acquireGlyphTexture(character, color);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      const scale = THREE.MathUtils.lerp(this.config.minScale, this.config.maxScale, Math.random() ** 0.72);

      sprite.scale.setScalar(scale * layer.scale);
      sprite.position.copy(this.randomOrganicPosition(layer.depth));
      sprite.rotation.z = (Math.random() - 0.5) * 0.5;
      this.group.add(sprite);
      this.materials.push(material);
      this.letters.push({
        sprite,
        depth: layer.depth,
        layer,
        character,
        color,
        velocity: new THREE.Vector2((Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.008),
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: this.config.driftSpeed * layer.drift,
        baseOpacity: material.opacity,
        baseScale: scale * layer.scale,
        rotationSpeed: (Math.random() - 0.5) * (layer.depth === 0 ? 0.0035 : 0.0075)
      });
    }
  }

  pickLayer(index) {
    const layers = this.config.layers;
    const ratio = index / Math.max(this.config.count - 1, 1);

    if (ratio < layers.background.ratio) {
      return { ...layers.background, depth: 0 };
    }

    if (ratio < layers.background.ratio + layers.midground.ratio) {
      return { ...layers.midground, depth: 1 };
    }

    return { ...layers.foreground, depth: 2 };
  }

  update(deltaTime, input, progress = 0) {
    const delta = Math.min(deltaTime / 1000, 0.05);
    const palm = input?.primaryHand?.palm?.world ?? null;
    this.activeInteractions = 0;
    this.handSpeed = this.getPalmVelocity(palm);
    const speedFactor = THREE.MathUtils.clamp(
      this.config.handSpeedBase + this.handSpeed * this.config.handVelocityMultiplier,
      this.config.handSpeedBase,
      2.65
    );

    this.letters.forEach((letter, index) => {
      this.updateLetter(letter, index, delta, palm, speedFactor, progress);
    });

    if (palm) {
      this.lastPalm.x = palm.x;
      this.lastPalm.y = palm.y;
      this.hasLastPalm = true;
    } else {
      this.hasLastPalm = false;
    }
  }

  updateLetter(letter, index, delta, palm, speedFactor, progress) {
    const sprite = letter.sprite;
    letter.driftAngle += delta * letter.driftSpeed;
    letter.velocity.x += Math.cos(letter.driftAngle + index) * 0.0032 * delta;
    letter.velocity.y += Math.sin(letter.driftAngle * 0.9 + index) * 0.0032 * delta;

    if (palm && this.interactionEnabled) {
      this.applyPalmForce(letter, palm, speedFactor);
    }

    if (this.centerClearing) {
      this.applyCenterClear(letter, progress);
    }

    letter.velocity.multiplyScalar(this.config.damping);
    this.clampVelocity(letter);
    sprite.position.x += letter.velocity.x;
    sprite.position.y += letter.velocity.y;
    sprite.rotation.z += letter.rotationSpeed + letter.velocity.x * 0.18;

    const opacityTarget = (this.titleMode ? letter.baseOpacity * 0.22 : letter.baseOpacity) * this.opacity;
    letter.sprite.material.opacity += (opacityTarget - letter.sprite.material.opacity) * 0.045;
    const scaleTarget = this.titleMode ? letter.baseScale * 0.9 : letter.baseScale;
    sprite.scale.setScalar(THREE.MathUtils.lerp(sprite.scale.x, scaleTarget, 0.035));

    this.recycle(letter);
  }

  applyPalmForce(letter, palm, speedFactor) {
    const interactionFactor = letter.layer.interaction;

    if (interactionFactor <= 0) {
      return;
    }

    const sprite = letter.sprite;
    const dx = sprite.position.x - palm.x;
    const dy = sprite.position.y - palm.y;
    const radius = this.config.interactionRadius * interactionFactor;
    const radiusSq = radius * radius;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq <= 0.000001 || distanceSq > radiusSq) {
      return;
    }

    const distance = Math.sqrt(distanceSq);
    const falloff = 1 - distance / radius;
    const force = Math.min(this.config.pushStrength * falloff * speedFactor * interactionFactor, this.config.maxPush);
    letter.velocity.x += (dx / distance) * force;
    letter.velocity.y += (dy / distance) * force;
    letter.sprite.rotation.z += force * 0.8;
    this.movementAmount += force;
    this.activeInteractions += 1;
  }

  applyCenterClear(letter, progress) {
    const sprite = letter.sprite;
    const centerRadius = 3.05 + progress * 1.35;
    const distanceSq = sprite.position.x * sprite.position.x + sprite.position.y * sprite.position.y;
    const centerRadiusSq = centerRadius * centerRadius;

    if (distanceSq > 0.000001 && distanceSq < centerRadiusSq) {
      const distance = Math.sqrt(distanceSq);
      const force = this.config.centerClearStrength * (1 - distance / centerRadius);
      letter.velocity.x += (sprite.position.x / distance) * force;
      letter.velocity.y += (sprite.position.y / distance) * force;
    }
  }

  getPalmVelocity(palm) {
    if (!palm || !this.hasLastPalm) {
      return 0;
    }

    const dx = palm.x - this.lastPalm.x;
    const dy = palm.y - this.lastPalm.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clampVelocity(letter) {
    const maxVelocity = this.config.velocityClamp;
    const velocitySq = letter.velocity.x * letter.velocity.x + letter.velocity.y * letter.velocity.y;
    const maxVelocitySq = maxVelocity * maxVelocity;

    if (velocitySq <= maxVelocitySq) {
      return;
    }

    const scale = maxVelocity / Math.sqrt(velocitySq);
    letter.velocity.x *= scale;
    letter.velocity.y *= scale;
  }

  getMovementAmount() {
    return this.movementAmount;
  }

  getInteractionStats() {
    return {
      count: this.letters.length,
      interactionRadius: this.config.interactionRadius,
      pushStrength: this.config.pushStrength,
      maxPush: this.config.maxPush,
      handSpeed: this.handSpeed,
      activeInteractions: this.activeInteractions
    };
  }

  setCenterClearing(enabled) {
    this.centerClearing = enabled;
  }

  setTitleMode(enabled) {
    this.titleMode = enabled;
    this.centerClearing = enabled;
  }

  setOpacity(opacity) {
    this.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
    this.letters.forEach((letter) => {
      const target = (this.titleMode ? letter.baseOpacity * 0.22 : letter.baseOpacity) * this.opacity;
      letter.sprite.material.opacity = target;
    });
  }

  setInteractionEnabled(enabled) {
    this.interactionEnabled = enabled;
    if (!enabled) {
      this.hasLastPalm = false;
    }
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
    this.letters.forEach((letter) => releaseGlyphTexture(letter.character, letter.color));
    this.group.clear();
    this.letters = [];
    this.materials = [];
  }
}
