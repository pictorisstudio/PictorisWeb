import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class TransitionAliceOzScene {
  constructor({ scene, camera, root, config }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.aliceToOz;
    this.group = new THREE.Group();
    this.geometry = null;
    this.materials = [];
    this.pieces = [];
    this.titleNode = null;
    this.startColor = new THREE.Color(this.config.colors.start);
    this.endColor = new THREE.Color(this.config.colors.end);
    this.currentColor = new THREE.Color();
    this.tempVector = new THREE.Vector3();
    this.debugStats = {
      phase: "IDLE",
      roadPieces: 0
    };
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.buildRoad();
    this.scene.add(this.group);
    this.showTitle();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    this.updateBackground(progress);
    this.updateRoad(deltaTime / 1000, input, progress);
    this.updateTitle(progress);
    this.debugStats.phase = this.getPhase(progress);
  }

  exit() {
    this.titleNode?.remove();
    this.titleNode = null;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.geometry?.dispose();
    this.geometry = null;
    this.materials.forEach((material) => material.dispose());
    this.materials = [];
    this.pieces = [];
    this.debugStats.phase = "IDLE";
    this.debugStats.roadPieces = 0;
    this.isActive = false;
  }

  destroy() {
    this.exit();
  }

  buildRoad() {
    const { road } = this.config;
    this.geometry = new THREE.PlaneGeometry(road.width, road.height);

    for (let index = 0; index < road.pieces; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 ? this.config.colors.yellowRoad : this.config.colors.roadShadow,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(this.geometry, material);
      const t = index / Math.max(road.pieces - 1, 1);
      const finalScale = 1.25 - t * 0.82;
      const finalX = Math.sin(t * Math.PI * 2 * road.curveFrequency) * road.curveAmplitude * (1 - t * 0.25);
      const finalY = -3.05 + t * 5.35;
      const finalZ = -1.2 - t * road.depthSpacing * 4.6;

      mesh.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.8,
        -2.2 - Math.random() * 1.6
      );
      mesh.rotation.z = (Math.random() - 0.5) * 0.6;
      mesh.scale.setScalar(0.35);

      this.materials.push(material);
      this.group.add(mesh);
      this.pieces.push({
        mesh,
        material,
        seed: index * 0.71,
        start: mesh.position.clone(),
        final: new THREE.Vector3(finalX, finalY, finalZ),
        finalScale,
        finalRotation: Math.sin(t * Math.PI) * 0.18
      });
    }

    this.debugStats.roadPieces = this.pieces.length;
  }

  updateRoad(delta, input, progress) {
    const appear = this.smoothstep(this.config.phases.convergenceEnd, this.config.phases.transformationEnd, progress);
    const organize = this.smoothstep(this.config.phases.transformationEnd, 1, progress);
    const palmWorld = this.toWorld(input?.primaryHand?.palm, input?.source);
    const interactionStrength = this.config.interaction.initialStrength * (1 - this.smoothstep(0.2, 0.72, progress));

    this.pieces.forEach((piece, index) => {
      const swirlAngle = progress * Math.PI * 5 + piece.seed;
      const swirlRadius = (1 - appear) * (1.3 + (index % 4) * 0.12);
      this.tempVector.set(
        Math.cos(swirlAngle) * swirlRadius,
        Math.sin(swirlAngle) * swirlRadius * 0.55,
        -2.4 - progress * 0.8
      );

      const target = this.tempVector.lerp(piece.final, organize);
      piece.mesh.position.lerp(target, 0.08 + organize * 0.12);

      if (palmWorld && interactionStrength > 0) {
        const direction = piece.mesh.position.clone().sub(palmWorld);
        const distance = direction.length();

        if (distance > 0 && distance < this.config.interaction.radius) {
          piece.mesh.position.add(direction.normalize().multiplyScalar((1 - distance / this.config.interaction.radius) * interactionStrength));
        }
      }

      const roadMotion = Math.sin(performance.now() * 0.0005 + index * 0.35) * 0.025 * organize;
      piece.mesh.position.y += roadMotion;
      piece.mesh.rotation.z += (piece.finalRotation - piece.mesh.rotation.z) * (0.06 + organize * 0.12);
      piece.mesh.scale.setScalar(THREE.MathUtils.lerp(0.4, piece.finalScale, organize));
      piece.material.opacity = Math.min(appear * 0.88, 0.88);
    });
  }

  updateBackground(progress) {
    this.currentColor.copy(this.startColor).lerp(this.endColor, this.smoothstep(0, 1, progress));
    this.scene.background = this.currentColor;
  }

  showTitle() {
    this.titleNode = document.createElement("div");
    this.titleNode.className = "oz-transition-title";
    this.titleNode.innerHTML = "<h1>EL MARAVILLOSO MAGO DE OZ</h1>";
    this.root.appendChild(this.titleNode);
  }

  updateTitle(progress) {
    this.titleNode?.classList.toggle("is-visible", progress >= this.config.title.revealAt);
  }

  getPhase(progress) {
    if (progress < this.config.phases.convergenceEnd) {
      return "CONVERGENCE";
    }

    if (progress < this.config.phases.transformationEnd) {
      return "TRANSFORMATION";
    }

    return "ROAD";
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
