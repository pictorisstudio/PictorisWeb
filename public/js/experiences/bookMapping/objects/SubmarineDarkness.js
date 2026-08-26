import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class SubmarineDarkness {
  constructor({ config, camera }) {
    this.config = config;
    this.camera = camera;
    this.group = new THREE.Group();
    this.geometries = [];
    this.create();
  }

  create() {
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        lightPosition: { value: new THREE.Vector2(0, 0) },
        radius: { value: this.config.radius },
        softness: { value: this.config.softness },
        opacity: { value: this.config.opacity },
        color: { value: new THREE.Color(this.config.color) }
      },
      vertexShader: `
        varying vec2 vWorldPosition;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xy;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec2 lightPosition;
        uniform float radius;
        uniform float softness;
        uniform float opacity;
        uniform vec3 color;
        varying vec2 vWorldPosition;

        void main() {
          float distanceToLight = distance(vWorldPosition, lightPosition);
          float innerRadius = radius * (1.0 - softness);
          float darkness = smoothstep(innerRadius, radius, distanceToLight);
          gl_FragColor = vec4(color, opacity * darkness);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = this.config.z;
    this.mesh.renderOrder = this.config.renderOrder;
    this.group.add(this.mesh);
    this.geometries.push(geometry);
    this.fitToCamera();
  }

  update(lightPosition) {
    if (lightPosition) {
      this.material.uniforms.lightPosition.value.set(lightPosition.x, lightPosition.y);
    }

    this.fitToCamera();
  }

  fitToCamera() {
    const width = this.camera.right - this.camera.left;
    const height = this.camera.top - this.camera.bottom;
    this.mesh.scale.set(width, height, 1);
    this.mesh.position.x = (this.camera.left + this.camera.right) / 2;
    this.mesh.position.y = (this.camera.top + this.camera.bottom) / 2;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.material.dispose();
    this.group.clear();
  }
}
