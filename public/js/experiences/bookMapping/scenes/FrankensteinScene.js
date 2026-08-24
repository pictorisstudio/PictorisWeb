import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class FrankensteinScene {
  constructor({ scene, camera, config }) {
    this.scene = scene;
    this.camera = camera;
    this.config = config.frankenstein;
    this.group = new THREE.Group();
    this.nodes = [];
    this.cables = [];
    this.bolts = [];
    this.sparks = [];
    this.geometries = [];
    this.materials = [];
    this.clock = 0;
    this.cooldown = 0;
    this.autoPulseElapsed = 0;
    this.previousBackground = null;
    this.isActive = false;
    this.debugStats = { nodes: 0, cables: 0, activeBolts: 0, palmCharge: false };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.clock = 0;
    this.cooldown = 0;
    this.autoPulseElapsed = 0;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.buildCore();
    this.buildCables();
    this.buildBoltPool();
    this.buildSparks();
    this.scene.add(this.group);
  }

  update(deltaTime, input) {
    if (!this.isActive) {
      return;
    }

    const delta = deltaTime / 1000;
    this.clock += delta;
    this.cooldown = Math.max(this.cooldown - deltaTime, 0);
    this.autoPulseElapsed += deltaTime;

    const palmWorld = this.toWorld(input?.primaryHand?.palm, input?.source);
    const indexWorld = this.toWorld(input?.primaryHand?.index, input?.source);

    this.updateNodes(palmWorld);
    this.updateCables();
    this.updateSparks(delta, palmWorld);

    if (indexWorld && this.cooldown <= 0) {
      this.emitBolt(indexWorld, this.findNearestNode(indexWorld)?.mesh.position ?? new THREE.Vector3(0, 0, -2));
      this.cooldown = this.config.indexCooldown;
    }

    if (this.autoPulseElapsed >= this.config.autoPulseEvery) {
      this.emitBolt(new THREE.Vector3(-2.8 + Math.random() * 5.6, 2.6, -2), new THREE.Vector3(0, 0, -2.2));
      this.autoPulseElapsed = 0;
    }

    this.updateBolts(delta);
  }

  exit() {
    this.isActive = false;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.nodes = [];
    this.cables = [];
    this.bolts = [];
    this.sparks = [];
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.geometries = [];
    this.materials = [];

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }

    this.debugStats = { nodes: 0, cables: 0, activeBolts: 0, palmCharge: false };
  }

  destroy() {
    this.exit();
  }

  buildCore() {
    const nodeGeometry = new THREE.CircleGeometry(0.12, 24);
    const coreGeometry = new THREE.PlaneGeometry(0.78, 1.32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: this.config.colors.core,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, 0, -2.8);
    this.geometries.push(nodeGeometry, coreGeometry);
    this.materials.push(coreMaterial);
    this.group.add(core);

    for (let index = 0; index < this.config.nodes; index += 1) {
      const angle = (index / this.config.nodes) * Math.PI * 2;
      const radius = index % 3 === 0 ? 1.35 : 2.15;
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 ? this.config.colors.electric : this.config.colors.violet,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, -2.1 - (index % 2) * 0.6);
      this.materials.push(material);
      this.group.add(mesh);
      this.nodes.push({ mesh, material, base: mesh.position.clone(), seed: index * 0.63, charge: 0 });
    }

    this.debugStats.nodes = this.nodes.length;
  }

  buildCables() {
    for (let index = 0; index < this.config.cables; index += 1) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: index % 3 === 0 ? this.config.colors.blue : this.config.colors.steel,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      this.geometries.push(geometry);
      this.materials.push(material);
      this.group.add(line);
      this.cables.push({ line, material, from: index % this.nodes.length, to: (index * 2 + 3) % this.nodes.length, seed: index * 0.51 });
    }

    this.debugStats.cables = this.cables.length;
  }

  buildBoltPool() {
    for (let index = 0; index < this.config.bolts; index += 1) {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: this.config.colors.electric,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      this.geometries.push(geometry);
      this.materials.push(material);
      this.group.add(line);
      this.bolts.push({ line, material, age: 1, lifetime: 0.26 });
    }
  }

  buildSparks() {
    const geometry = new THREE.PlaneGeometry(0.07, 0.07);
    this.geometries.push(geometry);

    for (let index = 0; index < this.config.sparks; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: this.config.colors.electric,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.materials.push(material);
      this.group.add(mesh);
      this.sparks.push({ mesh, material, seed: Math.random() * Math.PI * 2 });
    }
  }

  updateNodes(palmWorld) {
    this.debugStats.palmCharge = false;

    this.nodes.forEach((node) => {
      node.mesh.position.copy(node.base);
      node.mesh.position.x += Math.sin(this.clock * 1.5 + node.seed) * 0.035;
      node.mesh.position.y += Math.cos(this.clock * 1.3 + node.seed) * 0.035;
      node.charge *= 0.9;

      if (palmWorld) {
        const distance = node.mesh.position.distanceTo(palmWorld);
        if (distance < this.config.palmRadius) {
          node.charge = Math.max(node.charge, 1 - distance / this.config.palmRadius);
          node.mesh.position.add(node.mesh.position.clone().sub(palmWorld).normalize().multiplyScalar(node.charge * this.config.palmStrength));
          this.debugStats.palmCharge = true;
        }
      }

      const pulse = 1 + Math.sin(this.clock * 3 + node.seed) * 0.18 + node.charge * 0.9;
      node.mesh.scale.setScalar(pulse);
      node.material.opacity = 0.48 + node.charge * 0.5;
    });
  }

  updateCables() {
    this.cables.forEach((cable) => {
      const from = this.nodes[cable.from].mesh.position;
      const to = this.nodes[cable.to].mesh.position;
      const middle = from.clone().lerp(to, 0.5);
      middle.y += Math.sin(this.clock * 2 + cable.seed) * 0.18;
      cable.line.geometry.setFromPoints([from, middle, to]);
      cable.material.opacity = 0.24 + Math.max(this.nodes[cable.from].charge, this.nodes[cable.to].charge) * 0.52;
    });
  }

  updateSparks(delta) {
    this.sparks.forEach((spark) => {
      spark.seed += delta * 2.1;
      const node = this.nodes[Math.floor(Math.abs(Math.sin(spark.seed)) * this.nodes.length) % this.nodes.length];
      spark.mesh.position.copy(node.mesh.position);
      spark.mesh.position.x += Math.sin(spark.seed * 4) * 0.34;
      spark.mesh.position.y += Math.cos(spark.seed * 3) * 0.25;
      spark.material.opacity = Math.max(Math.sin(spark.seed * 5), 0) * 0.54;
    });
  }

  emitBolt(from, to) {
    const bolt = this.bolts.find((item) => item.age >= item.lifetime) ?? this.bolts[0];
    const points = [from.clone()];
    for (let index = 1; index < 5; index += 1) {
      const t = index / 5;
      points.push(from.clone().lerp(to, t).add(new THREE.Vector3((Math.random() - 0.5) * 0.42, (Math.random() - 0.5) * 0.42, 0)));
    }
    points.push(to.clone());
    bolt.line.geometry.setFromPoints(points);
    bolt.line.visible = true;
    bolt.age = 0;
    bolt.lifetime = 0.18 + Math.random() * 0.12;
  }

  updateBolts(delta) {
    let activeBolts = 0;
    this.bolts.forEach((bolt) => {
      if (bolt.age >= bolt.lifetime) {
        bolt.line.visible = false;
        bolt.material.opacity = 0;
        return;
      }

      bolt.age += delta;
      bolt.material.opacity = Math.max(1 - bolt.age / bolt.lifetime, 0);
      activeBolts += bolt.material.opacity > 0.01 ? 1 : 0;
    });
    this.debugStats.activeBolts = activeBolts;
  }

  findNearestNode(position) {
    return this.nodes.reduce((nearest, node) => {
      const distance = node.mesh.position.distanceTo(position);
      return !nearest || distance < nearest.distance ? { node, distance, mesh: node.mesh } : nearest;
    }, null);
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

  getDebugStats() {
    return this.debugStats;
  }
}
