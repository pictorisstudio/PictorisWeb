import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export class PrinceAvatar {
  constructor({ config, colors }) {
    this.config = config;
    this.colors = colors;
    this.group = new THREE.Group();
    this.joints = {};
    this.materials = [];
    this.geometries = [];
    this.lastPose = null;
    this.create();
  }

  create() {
    ["leftWrist", "rightWrist"].forEach((name) => {
      const geometry = new THREE.CircleGeometry(this.config.jointRadius, 24);
      const material = new THREE.MeshBasicMaterial({
        color: this.colors.star,
        transparent: true,
        opacity: 0.96,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.renderOrder = 12;
      this.joints[name] = mesh;
      this.group.add(mesh);
      this.geometries.push(geometry);
      this.materials.push(material);
    });

    this.group.position.set(0, 0, -0.64);
  }

  update(poseInput = null) {
    const pose = poseInput?.stable ? poseInput.world : null;
    this.lastPose = pose;

    if (!pose) {
      this.joints.leftWrist.visible = false;
      this.joints.rightWrist.visible = false;
      return;
    }

    this.joints.leftWrist.position.set(pose.leftWrist.x, pose.leftWrist.y, 0.04);
    this.joints.rightWrist.position.set(pose.rightWrist.x, pose.rightWrist.y, 0.04);
    this.joints.leftWrist.visible = true;
    this.joints.rightWrist.visible = true;
  }

  getWristWorldPositions() {
    if (!this.lastPose) {
      return { left: null, right: null };
    }

    const left = new THREE.Vector3();
    const right = new THREE.Vector3();
    this.joints.leftWrist.getWorldPosition(left);
    this.joints.rightWrist.getWorldPosition(right);

    return { left, right };
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
  }
}
