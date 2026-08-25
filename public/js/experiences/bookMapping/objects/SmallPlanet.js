import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class SmallPlanet {
  constructor({ config }) {
    this.config = config;
    this.group = new THREE.Group();
    this.materials = [];
    this.geometries = [];
    this.baseRotation = 0;
    this.create();
  }

  create() {
    const radius = this.config.size / 2;
    const planetGeometry = new THREE.CircleGeometry(radius, 72);
    const capGeometry = new THREE.CircleGeometry(radius * 0.72, 72);
    const planetMaterial = new THREE.MeshBasicMaterial({
      color: 0x273f8f,
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    });
    const capMaterial = new THREE.MeshBasicMaterial({
      color: 0x62e7ff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(-radius * 0.28, radius * 0.22, 0.02);
    cap.scale.set(1, 0.45, 1);

    this.group.add(planet, cap);
    this.group.position.set(0, this.config.y, -0.8);
    this.geometries.push(planetGeometry, capGeometry);
    this.materials.push(planetMaterial, capMaterial);
  }

  update({ torsoTilt = 0, progress = 1 } = {}) {
    const targetTilt = this.config.torsoReaction ? torsoTilt * this.config.maxTilt : 0;
    this.baseRotation += (targetTilt - this.baseRotation) * 0.08;
    this.group.rotation.z = this.baseRotation;
    this.group.scale.setScalar(progress);
  }

  getOrbitCenter() {
    return this.group.position.clone();
  }

  getSurfaceY() {
    return this.group.position.y + this.config.size / 2;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
  }
}
