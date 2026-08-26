import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class PlayerSilhouette {
  constructor({ camera, config }) {
    this.camera = camera;
    this.config = config;
    this.group = new THREE.Group();
    this.canvas = document.createElement("canvas");
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.imageData = this.context.createImageData(config.width, config.height);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.renderOrder = 4;
    this.group.add(this.mesh);
    this.fadeOpacity = 0;
    this.lastMaskAt = 0;
  }

  update(segmentationInput = null) {
    this.fitToCamera();

    if (segmentationInput?.mask && segmentationInput.width && segmentationInput.height) {
      this.resizeCanvas(segmentationInput.width, segmentationInput.height);
      this.drawMask(segmentationInput);
      this.lastMaskAt = segmentationInput.timestamp || performance.now();
    }

    const maskAge = this.lastMaskAt ? performance.now() - this.lastMaskAt : Infinity;
    const shouldShow = maskAge <= this.config.hideAfter;
    const targetOpacity = shouldShow ? this.config.opacity : 0;
    this.fadeOpacity += (targetOpacity - this.fadeOpacity) * this.config.fade;
    this.material.opacity = this.fadeOpacity;
  }

  fitToCamera() {
    const width = this.camera.right - this.camera.left;
    const height = this.camera.top - this.camera.bottom;
    this.mesh.scale.set(width, height, 1);
    this.mesh.position.set(
      (this.camera.left + this.camera.right) / 2,
      (this.camera.top + this.camera.bottom) / 2,
      this.config.z
    );
  }

  resizeCanvas(width, height) {
    if (this.canvas.width === width && this.canvas.height === height) {
      return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.imageData = this.context.createImageData(width, height);
  }

  drawMask({ mask, width, height }) {
    const targetWidth = this.canvas.width;
    const targetHeight = this.canvas.height;
    const pixels = this.imageData.data;
    const color = this.config.color;
    const threshold = this.config.threshold;

    for (let y = 0; y < targetHeight; y += 1) {
      const sourceY = Math.min(Math.floor((y / targetHeight) * height), height - 1);

      for (let x = 0; x < targetWidth; x += 1) {
        const sourceX = Math.min(Math.floor((x / targetWidth) * width), width - 1);
        const sourceIndex = sourceY * width + sourceX;
        const targetIndex = (y * targetWidth + x) * 4;
        const alpha = mask[sourceIndex] >= threshold ? 255 : 0;

        pixels[targetIndex] = color.r;
        pixels[targetIndex + 1] = color.g;
        pixels[targetIndex + 2] = color.b;
        pixels[targetIndex + 3] = alpha;
      }
    }

    this.context.putImageData(this.imageData, 0, 0);
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.group.clear();
  }
}
