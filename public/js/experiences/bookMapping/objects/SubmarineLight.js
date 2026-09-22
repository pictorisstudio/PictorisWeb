import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

function makeLightTexture() {
  const canvas = document.createElement("canvas");
  const size = 256;
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(216,243,255,0.72)");
  gradient.addColorStop(0.42, "rgba(216,243,255,0.26)");
  gradient.addColorStop(1, "rgba(216,243,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSelectorTexture() {
  const canvas = document.createElement("canvas");
  const size = 128;
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, size, size);
  context.beginPath();
  context.arc(center, center, 30, 0, Math.PI * 2);
  context.strokeStyle = "rgba(216,243,255,0.92)";
  context.lineWidth = 5;
  context.stroke();
  context.beginPath();
  context.arc(center, center, 5, 0, Math.PI * 2);
  context.fillStyle = "rgba(216,243,255,0.8)";
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class SubmarineLight {
  constructor({ config, camera }) {
    this.config = config;
    this.camera = camera;
    this.group = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, -0.5);
    this.target = new THREE.Vector3(0, 0, -0.5);
    this.texture = makeLightTexture();
    this.selectorTexture = makeSelectorTexture();
    this.material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    this.selectorMaterial = new THREE.SpriteMaterial({
      map: this.selectorTexture,
      transparent: true,
      opacity: 0.86,
      depthWrite: false
    });
    this.sprite = new THREE.Sprite(this.material);
    this.selector = new THREE.Sprite(this.selectorMaterial);
    this.sprite.scale.setScalar(this.config.radius * 2.65);
    this.selector.scale.setScalar(this.config.radius * 0.42);
    this.sprite.renderOrder = 8;
    this.selector.renderOrder = 9;
    this.group.add(this.sprite, this.selector);
  }

  update(input) {
    const palmWorld = input?.primaryHand?.palm?.world;

    if (palmWorld) {
      this.target.set(palmWorld.x, palmWorld.y, -0.46);
    }

    this.position.lerp(this.target, this.config.smoothing);
    this.sprite.position.copy(this.position);
    this.selector.position.copy(this.position);
  }

  getPosition() {
    return this.position;
  }

  getRadius() {
    return this.config.radius;
  }

  dispose() {
    this.texture.dispose();
    this.selectorTexture.dispose();
    this.material.dispose();
    this.selectorMaterial.dispose();
    this.group.clear();
  }
}
