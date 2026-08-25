import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

function makeMaterial(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

function addTentacle(group, x, y, length, color) {
  const geometry = new THREE.PlaneGeometry(0.055, length);
  const material = makeMaterial(color, 0.78);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y - length / 2, 0.02);
  mesh.rotation.z = x * 0.16;
  group.add(mesh);
  return { geometry, material };
}

export class DiscoverableObject {
  constructor({ definition, config, colors }) {
    this.definition = definition;
    this.config = config;
    this.colors = colors;
    this.group = new THREE.Group();
    this.visual = new THREE.Group();
    this.materials = [];
    this.geometries = [];
    this.progress = 0;
    this.discovered = false;
    this.active = false;
    this.createShape();
    this.group.position.set(definition.x, definition.y, -0.6);
    this.group.scale.setScalar(definition.scale);
    this.group.add(this.visual);
  }

  update(deltaTime, lightPosition, lightRadius, elapsed) {
    this.active = false;

    if (!this.discovered && lightPosition) {
      const distance = this.group.position.distanceTo(lightPosition);
      const threshold = this.definition.radius + lightRadius * 0.58;

      if (distance <= threshold) {
        this.active = true;
        this.progress = Math.min(this.progress + deltaTime / this.config.holdTime, 1);
      } else {
        this.progress = Math.max(this.progress - deltaTime / (this.config.holdTime / this.config.falloff), 0);
      }
    }

    if (this.progress >= 1) {
      this.discovered = true;
    }

    const visibility = this.discovered ? 1 : 0.18 + this.progress * 0.72;
    const color = this.discovered || this.active ? this.colors.revealed : this.colors.hidden;
    this.materials.forEach((material) => {
      material.opacity += (visibility - material.opacity) * 0.12;
      material.color.lerp(new THREE.Color(color), 0.08);
    });
    this.visual.position.y = Math.sin(elapsed * 0.0014 + this.definition.x) * 0.055;
    this.visual.rotation.z = Math.sin(elapsed * 0.001 + this.definition.y) * 0.035;
  }

  createShape() {
    if (this.definition.id === "nautilus") {
      this.createNautilus();
    } else if (this.definition.id === "jellyfish") {
      this.createJellyfish();
    } else if (this.definition.id === "squid") {
      this.createSquid();
    } else {
      this.createTreasure();
    }
  }

  createNautilus() {
    const bodyGeometry = new THREE.CapsuleGeometry(0.38, 1.18, 8, 18);
    const bodyMaterial = makeMaterial(this.colors.hidden, 0.2);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    const windowGeometry = new THREE.CircleGeometry(0.16, 24);
    const windowMaterial = makeMaterial(this.colors.accent, 0.24);
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    windowMesh.position.set(0.16, 0.08, 0.03);
    const finGeometry = new THREE.CircleGeometry(0.24, 18);
    const finMaterial = makeMaterial(this.colors.hidden, 0.2);
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.scale.set(1.4, 0.45, 1);
    fin.position.set(-0.58, -0.28, 0.02);
    this.visual.add(body, windowMesh, fin);
    this.track(bodyGeometry, bodyMaterial, windowGeometry, windowMaterial, finGeometry, finMaterial);
  }

  createJellyfish() {
    const bellGeometry = new THREE.CircleGeometry(0.45, 32);
    const bellMaterial = makeMaterial(this.colors.hidden, 0.24);
    const bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.scale.set(1.15, 0.7, 1);
    bell.position.y = 0.22;
    this.visual.add(bell);
    this.track(bellGeometry, bellMaterial);

    [-0.28, -0.1, 0.08, 0.26].forEach((x, index) => {
      const part = addTentacle(this.visual, x, -0.14, 0.64 + index * 0.08, this.colors.hidden);
      this.track(part.geometry, part.material);
    });
  }

  createSquid() {
    const bodyGeometry = new THREE.CircleGeometry(0.44, 32);
    const bodyMaterial = makeMaterial(this.colors.hidden, 0.22);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(0.72, 1.28, 1);
    body.position.y = 0.28;
    this.visual.add(body);
    this.track(bodyGeometry, bodyMaterial);

    [-0.36, -0.18, 0, 0.18, 0.36].forEach((x, index) => {
      const part = addTentacle(this.visual, x, -0.34, 0.88 + index * 0.04, this.colors.hidden);
      this.track(part.geometry, part.material);
    });
  }

  createTreasure() {
    const baseGeometry = new THREE.BoxGeometry(0.92, 0.46, 0.02);
    const lidGeometry = new THREE.BoxGeometry(0.98, 0.24, 0.02);
    const lockGeometry = new THREE.BoxGeometry(0.14, 0.18, 0.02);
    const baseMaterial = makeMaterial(this.colors.hidden, 0.24);
    const lidMaterial = makeMaterial(this.colors.hidden, 0.24);
    const lockMaterial = makeMaterial(this.colors.accent, 0.3);
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    const lock = new THREE.Mesh(lockGeometry, lockMaterial);
    lid.position.y = 0.32;
    lock.position.set(0, 0.08, 0.03);
    this.visual.add(base, lid, lock);
    this.track(baseGeometry, baseMaterial, lidGeometry, lidMaterial, lockGeometry, lockMaterial);
  }

  track(...items) {
    items.forEach((item) => {
      if (item.isBufferGeometry) {
        this.geometries.push(item);
      } else if (item.isMaterial) {
        this.materials.push(item);
      }
    });
  }

  getDebugState() {
    return {
      id: this.definition.id,
      name: this.definition.name,
      active: this.active,
      progress: this.progress,
      discovered: this.discovered
    };
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
  }
}
