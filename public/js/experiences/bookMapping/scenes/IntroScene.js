import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class IntroScene {
  constructor({ scene, camera, config }) {
    this.scene = scene;
    this.camera = camera;
    this.config = config.intro;
    this.group = new THREE.Group();
    this.pages = [];
    this.words = [];
    this.geometries = [];
    this.materials = [];
    this.textures = [];
    this.clock = 0;
    this.previousBackground = null;
    this.isActive = false;
    this.debugStats = { pages: 0, words: 0 };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.clock = 0;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.buildPages();
    this.buildWords();
    this.scene.add(this.group);
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    const delta = deltaTime / 1000;
    this.clock += delta;
    const handWorld = this.toWorld(input?.primaryHand?.palm, input?.source);

    this.pages.forEach((page, index) => {
      const reveal = this.smoothstep(0.05 + index * 0.04, 0.36 + index * 0.04, progress);
      page.mesh.material.opacity = reveal * 0.22;
      page.mesh.rotation.z = page.baseRotation + Math.sin(this.clock * 0.55 + page.seed) * 0.05;
      page.mesh.position.y = page.baseY + Math.sin(this.clock * 0.42 + page.seed) * 0.08;
    });

    this.words.forEach((word, index) => {
      const reveal = this.smoothstep(0.12 + index * 0.012, 0.58, progress);
      word.sprite.material.opacity = reveal * (0.38 + Math.sin(this.clock + word.seed) * 0.14);
      word.sprite.position.y += delta * this.config.driftSpeed * word.speed;
      word.sprite.position.x += Math.sin(this.clock * 0.7 + word.seed) * delta * 0.08;
      word.sprite.rotation.z = word.baseRotation + Math.sin(this.clock * 0.8 + word.seed) * 0.09;

      if (handWorld) {
        const distance = word.sprite.position.distanceTo(handWorld);
        if (distance < 1.4 && distance > 0.001) {
          word.sprite.position.add(word.sprite.position.clone().sub(handWorld).normalize().multiplyScalar((1 - distance / 1.4) * 0.025));
        }
      }

      if (word.sprite.position.y > 3.7) {
        word.sprite.position.y = -3.7;
      }
    });
  }

  exit() {
    this.isActive = false;

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.group.clear();
    this.pages = [];
    this.words = [];
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

    this.debugStats.pages = 0;
    this.debugStats.words = 0;
  }

  destroy() {
    this.exit();
  }

  buildPages() {
    const geometry = new THREE.PlaneGeometry(1.25, 1.78);
    this.geometries.push(geometry);

    for (let index = 0; index < this.config.pages; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: this.config.colors.paper,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      const x = (index - (this.config.pages - 1) / 2) * 0.58;
      const y = -0.25 + Math.sin(index * 0.9) * 0.28;
      mesh.position.set(x, y, -3.8 - index * 0.03);
      mesh.rotation.z = (index - 3) * 0.08;
      mesh.scale.setScalar(0.9 + index * 0.025);
      this.materials.push(material);
      this.group.add(mesh);
      this.pages.push({ mesh, baseY: y, baseRotation: mesh.rotation.z, seed: index * 0.7 });
    }

    this.debugStats.pages = this.pages.length;
  }

  buildWords() {
    for (let index = 0; index < this.config.wordSprites; index += 1) {
      const word = this.config.words[index % this.config.words.length];
      const texture = this.makeTextTexture(word, index % 3 === 0 ? this.config.colors.accent : this.config.colors.ink);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(-4.5 + Math.random() * 9, -3.2 + Math.random() * 6.2, -2.1 - Math.random() * 2.4);
      sprite.scale.set(0.8 + Math.random() * 0.45, 0.24 + Math.random() * 0.1, 1);
      sprite.rotation.z = (Math.random() - 0.5) * 0.35;
      this.materials.push(material);
      this.group.add(sprite);
      this.words.push({
        sprite,
        seed: Math.random() * Math.PI * 2,
        speed: 0.45 + Math.random() * 0.65,
        baseRotation: sprite.rotation.z
      });
    }

    this.debugStats.words = this.words.length;
  }

  makeTextTexture(text, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "900 54px Inter, Arial, sans-serif";
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 256, 68);
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
