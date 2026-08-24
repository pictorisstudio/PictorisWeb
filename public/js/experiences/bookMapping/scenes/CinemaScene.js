import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class CinemaScene {
  constructor({ scene, camera, config }) {
    this.scene = scene;
    this.camera = camera;
    this.config = config.cinema;
    this.group = new THREE.Group();
    this.frames = [];
    this.bursts = [];
    this.geometries = [];
    this.materials = [];
    this.clock = 0;
    this.cooldown = 0;
    this.previousBackground = null;
    this.isActive = false;
    this.debugStats = { frames: 0, activeBursts: 0, palmDistortion: false };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.clock = 0;
    this.cooldown = 0;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.buildScreen();
    this.buildFrames();
    this.buildBurstPool();
    this.scene.add(this.group);
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const delta = deltaTime / 1000;
    this.clock += delta;
    this.cooldown = Math.max(this.cooldown - deltaTime, 0);
    const palmWorld = this.toWorld(input?.primaryHand?.palm, input?.source);
    const indexWorld = this.toWorld(input?.primaryHand?.index, input?.source);
    this.updateFrames(palmWorld, progress);

    if (indexWorld && this.cooldown <= 0) {
      this.emitBurst(indexWorld);
      this.cooldown = this.config.indexCooldown;
    }

    this.updateBursts(delta);
  }

  exit() {
    this.isActive = false;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.frames = [];
    this.bursts = [];
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.geometries = [];
    this.materials = [];

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }

    this.debugStats = { frames: 0, activeBursts: 0, palmDistortion: false };
  }

  destroy() {
    this.exit();
  }

  buildScreen() {
    const glowGeometry = new THREE.PlaneGeometry(3.6, 2.0);
    const screenGeometry = new THREE.PlaneGeometry(2.9, 1.55);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.config.colors.light,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const screenMaterial = new THREE.MeshBasicMaterial({
      color: this.config.colors.darkScreen,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    glow.position.set(0, 0.25, -4.2);
    screen.position.set(0, 0.25, -4.1);
    this.geometries.push(glowGeometry, screenGeometry);
    this.materials.push(glowMaterial, screenMaterial);
    this.group.add(glow, screen);
  }

  buildFrames() {
    const geometry = new THREE.PlaneGeometry(0.62, 0.38);
    this.geometries.push(geometry);

    for (let index = 0; index < this.config.frames; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 4 === 0 ? this.config.colors.pink : this.config.colors.screen,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      const angle = (index / this.config.frames) * Math.PI * 2;
      const radius = 2.5 + (index % 3) * 0.28;
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, -2.3 - (index % 4) * 0.2);
      this.materials.push(material);
      this.group.add(mesh);
      this.frames.push({ mesh, material, angle, radius, seed: index * 0.57 });
    }

    this.debugStats.frames = this.frames.length;
  }

  buildBurstPool() {
    for (let index = 0; index < this.config.bursts; index += 1) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: index % 2 ? this.config.colors.light : this.config.colors.blue,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      this.geometries.push(geometry);
      this.materials.push(material);
      this.group.add(line);
      this.bursts.push({ line, material, age: 1, lifetime: 0.42, velocity: new THREE.Vector3() });
    }
  }

  updateFrames(palmWorld, progress) {
    this.debugStats.palmDistortion = false;
    const screenPull = this.smoothstep(0.48, 1, progress);

    this.frames.forEach((frame, index) => {
      const orbit = frame.angle + this.clock * 0.16 + index * 0.02;
      const orbitPosition = new THREE.Vector3(
        Math.cos(orbit) * frame.radius,
        Math.sin(orbit) * frame.radius * 0.72,
        -2.3 - (index % 4) * 0.2
      );
      const screenPosition = new THREE.Vector3((index % 7 - 3) * 0.44, 0.25 + (Math.floor(index / 7) - 1) * 0.34, -3.05);
      frame.mesh.position.copy(orbitPosition).lerp(screenPosition, screenPull * 0.72);

      if (palmWorld) {
        const distance = frame.mesh.position.distanceTo(palmWorld);
        if (distance < this.config.palmRadius && distance > 0.001) {
          frame.mesh.position.add(frame.mesh.position.clone().sub(palmWorld).normalize().multiplyScalar((1 - distance / this.config.palmRadius) * this.config.palmStrength));
          frame.mesh.rotation.z += (1 - distance / this.config.palmRadius) * 0.08;
          this.debugStats.palmDistortion = true;
        }
      }

      frame.mesh.rotation.z += Math.sin(this.clock + frame.seed) * 0.004;
      frame.material.opacity = 0.44 + screenPull * 0.28;
    });
  }

  emitBurst(position) {
    for (let index = 0; index < 6; index += 1) {
      const burst = this.bursts.find((item) => item.age >= item.lifetime) ?? this.bursts[index % this.bursts.length];
      const angle = (index / 6) * Math.PI * 2 + Math.random() * 0.2;
      const end = position.clone().add(new THREE.Vector3(Math.cos(angle) * (0.55 + Math.random() * 0.5), Math.sin(angle) * (0.55 + Math.random() * 0.5), 0));
      burst.line.geometry.setFromPoints([position.clone(), end]);
      burst.line.visible = true;
      burst.age = 0;
      burst.lifetime = 0.26 + Math.random() * 0.24;
    }
  }

  updateBursts(delta) {
    let activeBursts = 0;
    this.bursts.forEach((burst) => {
      if (burst.age >= burst.lifetime) {
        burst.line.visible = false;
        burst.material.opacity = 0;
        return;
      }

      burst.age += delta;
      burst.material.opacity = Math.max(1 - burst.age / burst.lifetime, 0) * 0.82;
      activeBursts += burst.material.opacity > 0.01 ? 1 : 0;
    });
    this.debugStats.activeBursts = activeBursts;
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
