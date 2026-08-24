import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { clamp, handPointToWorld } from "../utils/math.js";

export class PlayerPage {
  constructor({ camera, config }) {
    this.camera = camera;
    this.config = config;
    this.group = new THREE.Group();
    this.target = new THREE.Vector3(0, 0, -1.1);
    this.velocity = new THREE.Vector3();
    this.lastPosition = new THREE.Vector3();
    this.rawPalm = { x: null, y: null };
    this.pulseElapsed = 9999;
    this.pulseDuration = 260;
    this.hasInputLock = false;
    this.geometries = [];
    this.materials = [];
    this.build();
  }

  update(deltaTime, input) {
    const delta = deltaTime / 1000;
    const palm = input?.primaryHand?.palm;
    const targetWorld = handPointToWorld(palm, input?.source, this.camera, this.config);

    if (targetWorld) {
      this.rawPalm.x = palm.x;
      this.rawPalm.y = palm.y;
      this.target.copy(targetWorld);

      if (!this.hasInputLock) {
        this.group.position.copy(this.target);
        this.hasInputLock = true;
      }
    } else {
      this.rawPalm.x = null;
      this.rawPalm.y = null;
      this.hasInputLock = false;
      this.target.x += (0 - this.target.x) * this.config.returnToCenter;
      this.target.y += (0 - this.target.y) * this.config.returnToCenter;
    }

    this.target.x = clamp(this.target.x, this.config.minX, this.config.maxX);
    this.target.y = clamp(this.target.y, this.config.minY, this.config.maxY);
    this.lastPosition.copy(this.group.position);
    this.group.position.x += (this.target.x - this.group.position.x) * this.config.smoothing;
    this.group.position.y += (this.target.y - this.group.position.y) * this.config.smoothing;
    this.group.position.z = -1.1;
    this.velocity.copy(this.group.position).sub(this.lastPosition);

    const tiltZ = clamp(-this.velocity.x * 3.6, -this.config.maxTiltZ, this.config.maxTiltZ);
    const tiltX = clamp(this.velocity.y * 1.8, -this.config.maxTiltX, this.config.maxTiltX);
    this.group.rotation.z += (tiltZ - this.group.rotation.z) * 0.16;
    this.group.rotation.x += (tiltX - this.group.rotation.x) * 0.14;
    this.group.rotation.y = Math.sin(performance.now() * 0.0018) * 0.035;

    this.pulseElapsed += deltaTime;
    const pulseProgress = Math.min(this.pulseElapsed / this.pulseDuration, 1);
    const pulse = pulseProgress < 1 ? Math.sin(pulseProgress * Math.PI) * 0.08 : 0;
    this.group.scale.setScalar(1 + pulse);
    this.glow.material.opacity = 0.08 + pulse * 2.2;
  }

  triggerCollectFeedback(duration) {
    this.pulseElapsed = 0;
    this.pulseDuration = duration || this.pulseDuration;
  }

  getPosition() {
    return this.group.position;
  }

  reset() {
    this.target.set(0, 0, -1.1);
    this.group.position.set(0, 0, -1.1);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.setScalar(1);
    this.pulseElapsed = 9999;
    this.hasInputLock = false;
  }

  getDebugState() {
    return {
      rawPalmX: this.rawPalm.x,
      rawPalmY: this.rawPalm.y,
      targetX: this.target.x,
      targetY: this.target.y,
      pageX: this.group.position.x,
      pageY: this.group.position.y
    };
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
  }

  build() {
    const pageGeometry = new THREE.PlaneGeometry(this.config.width, this.config.height);
    const borderGeometry = new THREE.PlaneGeometry(this.config.width * 1.08, this.config.height * 1.06);
    const shadowGeometry = new THREE.PlaneGeometry(this.config.width * 1.1, this.config.height * 1.08);
    const lineGeometry = new THREE.PlaneGeometry(this.config.width * 0.58, 0.018);
    const ornamentGeometry = new THREE.CircleGeometry(0.045, 18);
    const glowGeometry = new THREE.PlaneGeometry(this.config.width * 1.24, this.config.height * 1.18);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: this.config.shadowColor,
      transparent: true,
      opacity: this.config.shadowOpacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: this.config.borderColor,
      transparent: true,
      opacity: this.config.borderOpacity,
      depthWrite: true,
      side: THREE.DoubleSide
    });
    const pageMaterial = new THREE.MeshBasicMaterial({
      color: "#F6EBD2",
      transparent: false,
      opacity: this.config.opacity,
      depthWrite: true,
      side: THREE.DoubleSide
    });
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: "#7A5C47",
      transparent: true,
      opacity: this.config.lineOpacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const ornamentMaterial = new THREE.MeshBasicMaterial({
      color: "#8E6F57",
      transparent: true,
      opacity: this.config.ornamentOpacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: "#3650CF",
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.geometries.push(pageGeometry, borderGeometry, shadowGeometry, lineGeometry, ornamentGeometry, glowGeometry);
    this.materials.push(pageMaterial, borderMaterial, shadowMaterial, lineMaterial, ornamentMaterial, glowMaterial);

    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glow.position.z = -0.02;
    this.glow.renderOrder = 30;
    this.group.add(this.glow);

    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.position.set(this.config.shadowOffsetX, this.config.shadowOffsetY, -0.03);
    shadow.renderOrder = 31;
    this.group.add(shadow);

    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.z = -0.01;
    border.renderOrder = 32;
    this.group.add(border);

    const page = new THREE.Mesh(pageGeometry, pageMaterial);
    page.renderOrder = 33;
    this.group.add(page);

    for (let index = 0; index < 5; index += 1) {
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(index % 2 ? 0.02 : -0.03, 0.25 - index * 0.12, 0.01);
      line.scale.x = index === 4 ? 0.65 : 1;
      line.renderOrder = 34;
      this.group.add(line);
    }

    const ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);
    ornament.position.set(0, -0.32, 0.02);
    ornament.renderOrder = 35;
    this.group.add(ornament);
    this.reset();
  }
}
