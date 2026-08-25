import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const STAR_POSITIONS = [
  { x: -0.95, y: 1.05 },
  { x: 1.12, y: 1.12 },
  { x: -2.2, y: 0.55 },
  { x: 2.22, y: 0.58 },
  { x: -1.5, y: 1.92 },
  { x: 1.62, y: 1.88 }
];

function makeStarShape(radius) {
  const shape = new THREE.Shape();
  const points = 10;

  for (let index = 0; index < points; index += 1) {
    const angle = (index / points) * Math.PI * 2 - Math.PI / 2;
    const r = index % 2 === 0 ? radius : radius * 0.45;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
}

export class StarField {
  constructor({ config, colors }) {
    this.config = config;
    this.colors = colors;
    this.group = new THREE.Group();
    this.stars = [];
    this.materials = [];
    this.geometries = [];
    this.recovered = 0;
    this.create();
  }

  create() {
    const shape = makeStarShape(0.22);
    const geometry = new THREE.ShapeGeometry(shape);
    this.geometries.push(geometry);

    for (let index = 0; index < this.config.count; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: this.colors.star,
        transparent: true,
        opacity: index === 0 ? 1 : 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      const position = STAR_POSITIONS[index] ?? { x: 0, y: 1.4 };
      const scale = index === 0 ? this.config.firstStarScale : 1;

      mesh.position.set(position.x, position.y, -0.58);
      mesh.scale.setScalar(scale);
      this.group.add(mesh);
      this.materials.push(material);
      this.stars.push({
        mesh,
        material,
        start: new THREE.Vector3(position.x, position.y, -0.58),
        state: index === 0 ? "available" : "hidden",
        collectedAt: 0,
        orbitAngle: index * 0.8,
        orbitRadius: this.config.orbitRadius + index * 0.08
      });
    }
  }

  revealNextBatch() {
    this.stars.forEach((star, index) => {
      if (index > 0 && star.state === "hidden") {
        star.state = "available";
      }
    });
  }

  update({ deltaTime, now, wristPositions, planetCenter }) {
    this.stars.forEach((star, index) => {
      if (star.state === "hidden") {
        star.material.opacity += (0 - star.material.opacity) * 0.08;
        return;
      }

      if (star.state === "available") {
        star.material.opacity += (1 - star.material.opacity) * 0.08;
        star.mesh.rotation.z += 0.018;
        star.mesh.scale.setScalar((index === 0 ? this.config.firstStarScale : 1) + Math.sin(now * 0.004 + index) * 0.08);
        this.checkCollision(star, wristPositions, now);
        return;
      }

      if (star.state === "collecting") {
        const progress = Math.min((now - star.collectedAt) / this.config.collectTravelDuration, 1);
        star.mesh.scale.setScalar(1.35 - progress * 0.45);
        star.mesh.position.lerpVectors(star.start, planetCenter, progress);
        star.material.opacity = 1;

        if (progress >= 1) {
          star.state = "orbiting";
        }
        return;
      }

      star.orbitAngle += (deltaTime / 1000) * this.config.orbitSpeed * (1 + index * 0.05);
      star.mesh.position.set(
        planetCenter.x + Math.cos(star.orbitAngle) * star.orbitRadius,
        planetCenter.y + Math.sin(star.orbitAngle) * (star.orbitRadius * 0.36),
        -0.54
      );
      star.mesh.scale.setScalar(0.82);
      star.mesh.rotation.z += 0.015;
    });
  }

  checkCollision(star, wristPositions, now) {
    if (!wristPositions?.left || !wristPositions?.right) {
      return;
    }

    const radius = this.recovered === 0 ? this.config.tutorialRadius : this.config.collisionRadius;
    const leftDistance = star.mesh.position.distanceTo(wristPositions.left);
    const rightDistance = star.mesh.position.distanceTo(wristPositions.right);

    if (Math.min(leftDistance, rightDistance) <= radius) {
      this.collectStar(star, now);
    }
  }

  collectStar(star, now) {
    if (star.state !== "available") {
      return;
    }

    star.state = "collecting";
    star.collectedAt = now;
    star.start.copy(star.mesh.position);
    this.recovered += 1;

    if (this.recovered === 1) {
      this.revealNextBatch();
    }
  }

  getRecoveredCount() {
    return this.recovered;
  }

  isComplete() {
    return this.recovered >= this.config.count;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
    this.stars = [];
  }
}
