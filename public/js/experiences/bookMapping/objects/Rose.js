import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class Rose {
  constructor({ config, colors }) {
    this.config = config;
    this.colors = colors;
    this.group = new THREE.Group();
    this.stage = 0;
    this.materials = [];
    this.geometries = [];
    this.create();
  }

  create() {
    const stemGeometry = new THREE.PlaneGeometry(0.055, 0.58);
    const budGeometry = new THREE.CircleGeometry(0.14, 24);
    const petalGeometry = new THREE.CircleGeometry(0.16, 24);
    const leafGeometry = new THREE.CircleGeometry(0.11, 18);
    const stemMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.stem,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const roseMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.rose,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.stem = new THREE.Mesh(stemGeometry, stemMaterial);
    this.bud = new THREE.Mesh(budGeometry, roseMaterial);
    this.leftLeaf = new THREE.Mesh(leafGeometry, stemMaterial);
    this.rightLeaf = new THREE.Mesh(leafGeometry, stemMaterial);
    this.petalA = new THREE.Mesh(petalGeometry, roseMaterial);
    this.petalB = new THREE.Mesh(petalGeometry, roseMaterial);

    this.stem.position.set(0.58, 0.3, 0.04);
    this.bud.position.set(0.58, 0.68, 0.06);
    this.leftLeaf.position.set(0.47, 0.36, 0.06);
    this.leftLeaf.scale.set(1.45, 0.62, 1);
    this.leftLeaf.rotation.z = -0.45;
    this.rightLeaf.position.set(0.7, 0.42, 0.06);
    this.rightLeaf.scale.set(1.45, 0.62, 1);
    this.rightLeaf.rotation.z = 0.45;
    this.petalA.position.set(0.5, 0.72, 0.07);
    this.petalB.position.set(0.66, 0.72, 0.07);

    this.group.add(this.stem, this.bud, this.leftLeaf, this.rightLeaf, this.petalA, this.petalB);
    this.geometries.push(stemGeometry, budGeometry, petalGeometry, leafGeometry);
    this.materials.push(stemMaterial, roseMaterial);
    this.setStage(0);
  }

  setStage(stage) {
    this.stage = stage;
    this.stem.visible = stage >= 1;
    this.leftLeaf.visible = stage >= 1;
    this.rightLeaf.visible = stage >= 1;
    this.petalA.visible = stage >= 2;
    this.petalB.visible = stage >= 2;
    this.bud.scale.setScalar(stage >= 2 ? 1.2 : stage >= 1 ? 0.9 : 0.55);
  }

  update(recoveredStars) {
    const nextStage = recoveredStars >= this.config.stages[2]
      ? 2
      : recoveredStars >= this.config.stages[1]
        ? 1
        : 0;

    if (nextStage !== this.stage) {
      this.setStage(nextStage);
    }

    const pulse = 1 + Math.sin(performance.now() * 0.003) * 0.04;
    this.group.scale.setScalar(pulse);
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
  }
}
