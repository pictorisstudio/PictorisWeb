import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class GiantBook {
  constructor({ camera, config }) {
    this.camera = camera;
    this.config = config;
    this.group = new THREE.Group();
    this.geometry = null;
    this.material = null;
    this.texture = null;
    this.mesh = null;
    this.aspectRatio = config.aspectRatio;
    this.lastCameraWidth = 0;
    this.build();
  }

  update() {
    this.updateLayout();
  }

  dispose() {
    this.geometry?.dispose();
    this.material?.dispose();
    this.texture?.dispose();
    this.group.clear();
    this.geometry = null;
    this.material = null;
    this.texture = null;
    this.mesh = null;
  }

  build() {
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.texture = new THREE.TextureLoader().load(this.config.assetPath, (texture) => {
      const imageWidth = texture.image?.naturalWidth || texture.image?.width;
      const imageHeight = texture.image?.naturalHeight || texture.image?.height;

      if (imageWidth && imageHeight) {
        this.aspectRatio = imageWidth / imageHeight;
        this.updateLayout(true);
      }
    });
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: this.config.opacity,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.renderOrder = this.config.renderOrder;
    this.group.add(this.mesh);
    this.updateLayout(true);
  }

  updateLayout(force = false) {
    if (!this.mesh || !this.camera) {
      return;
    }

    const cameraWidth = this.camera.right - this.camera.left;
    if (!force && Math.abs(cameraWidth - this.lastCameraWidth) < 0.001) {
      return;
    }

    this.lastCameraWidth = cameraWidth;
    const width = THREE.MathUtils.clamp(
      cameraWidth * this.config.widthRatio,
      this.config.minWidth,
      this.config.maxWidth
    );
    const height = width / this.aspectRatio;

    this.mesh.scale.set(width, height, 1);
    this.group.position.set(
      this.config.position.x,
      this.config.position.y,
      this.config.position.z
    );
    this.group.rotation.set(0, 0, 0);
  }
}
