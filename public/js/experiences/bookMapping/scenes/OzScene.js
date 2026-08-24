import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class OzScene {
  constructor({ scene, camera, config }) {
    this.scene = scene;
    this.camera = camera;
    this.config = config.oz;
    this.group = new THREE.Group();
    this.roadPieces = [];
    this.wind = [];
    this.vortex = [];
    this.city = [];
    this.trailPool = [];
    this.trailCursor = 0;
    this.clock = 0;
    this.lastTrailWorld = null;
    this.previousBackground = null;
    this.geometries = [];
    this.materials = [];
    this.textures = [];
    this.temp = new THREE.Vector3();
    this.debugStats = {
      roadPieces: 0,
      wind: 0,
      activeTrail: 0,
      maxTrail: this.config.trail.maxParticles,
      palmWaveActive: false
    };
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.clock = 0;
    this.lastTrailWorld = null;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.build();
    this.scene.add(this.group);
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const delta = deltaTime / 1000;
    this.clock += delta;
    const palmWorld = this.toWorld(input?.primaryHand?.palm, input?.source);
    const indexWorld = this.toWorld(input?.primaryHand?.index, input?.source);
    this.debugStats.palmWaveActive = false;

    this.updateRoad(delta, palmWorld);
    this.updateWind(delta);
    this.updateVortex(delta, palmWorld, progress);
    this.updateCity(delta, progress);
    this.updateTrail(delta, indexWorld);
  }

  exit() {
    this.isActive = false;
    this.lastTrailWorld = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.roadPieces = [];
    this.wind = [];
    this.vortex = [];
    this.city = [];
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

    this.debugStats.roadPieces = 0;
    this.debugStats.wind = 0;
    this.debugStats.activeTrail = 0;
    this.debugStats.palmWaveActive = false;
  }

  destroy() {
    this.exit();
  }

  build() {
    this.buildRoad();
    this.buildWind();
    this.buildVortex();
    this.buildCity();
    this.buildTrailPool();
  }

  buildRoad() {
    const geometry = new THREE.PlaneGeometry(1, 0.32);
    const material = new THREE.MeshBasicMaterial({
      color: this.config.colors.yellow,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.geometries.push(geometry);
    this.materials.push(material);

    for (let index = 0; index < this.config.road.pieces; index += 1) {
      const mesh = new THREE.Mesh(geometry, material);
      const pathT = index / this.config.road.pieces;
      this.group.add(mesh);
      this.roadPieces.push({ mesh, pathT, wave: 0 });
      this.placeRoadPiece(this.roadPieces[index]);
    }

    this.debugStats.roadPieces = this.roadPieces.length;
  }

  buildWind() {
    const geometry = new THREE.PlaneGeometry(0.34, 0.018);
    const material = new THREE.MeshBasicMaterial({
      color: this.config.colors.light,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });
    this.geometries.push(geometry);
    this.materials.push(material);

    for (let index = 0; index < this.config.wind.count; index += 1) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        -5 + Math.random() * 10,
        -3 + Math.random() * 6,
        -1.5 - Math.random() * 5
      );
      mesh.rotation.z = -0.12 + Math.random() * 0.24;
      mesh.scale.setScalar(0.65 + Math.random() * 1.2);
      this.group.add(mesh);
      this.wind.push({ mesh, seed: Math.random() * Math.PI * 2 });
    }

    this.debugStats.wind = this.wind.length;
  }

  buildVortex() {
    const geometry = new THREE.PlaneGeometry(0.12, 0.12);
    const material = new THREE.MeshBasicMaterial({
      color: this.config.colors.light,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.geometries.push(geometry);
    this.materials.push(material);

    for (let index = 0; index < this.config.vortex.count; index += 1) {
      const mesh = new THREE.Mesh(geometry, material);
      this.group.add(mesh);
      this.vortex.push({
        mesh,
        t: index / this.config.vortex.count,
        seed: index * 0.63
      });
    }
  }

  buildCity() {
    const geometry = new THREE.BoxGeometry(0.45, 1, 0.12);
    const material = new THREE.MeshBasicMaterial({
      color: this.config.colors.emerald,
      transparent: true,
      opacity: 0.72
    });
    this.geometries.push(geometry);
    this.materials.push(material);

    const heights = [1.1, 1.8, 2.5, 1.5, 2.0, 1.2, 1.7];
    heights.forEach((height, index) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((index - 3) * 0.38, 2.15 + height * 0.22, -6.8);
      mesh.scale.set(0.72, height, 1);
      this.group.add(mesh);
      this.city.push({ mesh, baseScale: mesh.scale.clone(), seed: index * 0.5 });
    });
  }

  buildTrailPool() {
    const texture = this.makeSparkTexture();

    for (let index = 0; index < this.config.trail.maxParticles; index += 1) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.scale.setScalar(0.16);
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

  updateRoad(delta, palmWorld) {
    this.roadPieces.forEach((piece, index) => {
      piece.pathT += delta * this.config.road.speed;

      if (piece.pathT > 1) {
        piece.pathT -= 1;
      }

      this.placeRoadPiece(piece);

      if (palmWorld) {
        const dx = Math.abs(piece.mesh.position.x - palmWorld.x);
        const dy = Math.abs(piece.mesh.position.y - palmWorld.y);
        const distance = Math.hypot(dx, dy);

        if (distance < this.config.road.waveRadius) {
          const influence = 1 - distance / this.config.road.waveRadius;
          piece.wave = Math.max(piece.wave, influence);
          this.debugStats.palmWaveActive = true;
        }
      }

      piece.wave *= 0.92;
      const wave = Math.sin(this.clock * this.config.road.waveSpeed + index * this.config.road.waveFrequency)
        * piece.wave
        * this.config.road.waveStrength;
      piece.mesh.position.y += wave;
      piece.mesh.rotation.x = wave * 0.25;
      piece.mesh.rotation.z += wave * 0.08;
    });
  }

  placeRoadPiece(piece) {
    const t = piece.pathT;
    const { road } = this.config;
    const x = Math.sin(t * Math.PI * 2 * road.curveFrequency) * road.curveAmplitude * (0.7 + t * 0.3);
    const y = THREE.MathUtils.lerp(road.farY, road.nearY, t);
    const z = THREE.MathUtils.lerp(-6.8, -1.15, t);
    const scale = THREE.MathUtils.lerp(road.farScale, road.nearScale, t);
    piece.mesh.position.set(x, y, z);
    piece.mesh.scale.set(scale, scale, 1);
    piece.mesh.rotation.z = Math.sin(t * Math.PI * 2) * 0.12;
  }

  updateWind(delta) {
    this.wind.forEach((item) => {
      item.mesh.position.x += delta * this.config.wind.speed * (1.2 + Math.sin(this.clock + item.seed) * 0.25);
      item.mesh.position.y += Math.sin(this.clock * 0.8 + item.seed) * delta * 0.16;

      if (item.mesh.position.x > 5.6) {
        item.mesh.position.x = -5.6;
        item.mesh.position.y = -3 + Math.random() * 6;
      }
    });
  }

  updateVortex(delta, palmWorld, progress) {
    const visibility = this.smoothstep(0.24, 0.62, progress);
    const speedBoost = palmWorld ? 1.35 : 1;

    this.vortex.forEach((item) => {
      const angle = this.clock * this.config.vortex.rotationSpeed * speedBoost + item.seed;
      const height = (item.t - 0.5) * 2.5;
      const radius = 0.25 + item.t * 0.9;
      item.mesh.position.set(
        2.45 + Math.cos(angle) * radius,
        0.05 + height,
        -4.1 + Math.sin(angle) * radius * 0.35
      );
      item.mesh.rotation.z += delta * 1.4;
      item.mesh.material.opacity = 0.52 * visibility;
    });
  }

  updateCity(delta, progress) {
    const presence = this.smoothstep(0.62, 1, progress);
    this.city.forEach((item) => {
      const pulse = 1 + Math.sin(this.clock * this.config.city.pulseSpeed + item.seed) * 0.05 * presence;
      item.mesh.scale.copy(item.baseScale).multiplyScalar(pulse);
      item.mesh.material.opacity = 0.42 + presence * 0.42;
    });
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
      particle.velocity.x += delta * this.config.wind.speed * 0.22;
      particle.sprite.position.addScaledVector(particle.velocity, delta);
      particle.sprite.material.opacity = Math.max(1 - progress, 0) * 0.9;
      particle.sprite.scale.setScalar(0.13 + progress * 0.22);
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
    particle.sprite.position.z = -1.3;
    particle.velocity.set(0.18 + Math.random() * 0.22, (Math.random() - 0.5) * 0.18, -0.06);
  }

  makeSparkTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, this.config.colors.light);
    gradient.addColorStop(0.36, this.config.colors.yellow);
    gradient.addColorStop(1, "rgba(227,183,47,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(texture);
    return texture;
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
