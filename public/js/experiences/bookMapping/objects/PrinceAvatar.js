import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

function makeSegment(width, color) {
  const geometry = new THREE.PlaneGeometry(1, width);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  return {
    mesh: new THREE.Mesh(geometry, material),
    geometry,
    material
  };
}

function placeSegment(mesh, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(Math.hypot(dx, dy), 0.001);

  mesh.position.set((start.x + end.x) / 2, (start.y + end.y) / 2, 0.02);
  mesh.scale.set(length, 1, 1);
  mesh.rotation.z = Math.atan2(dy, dx);
}

export class PrinceAvatar {
  constructor({ config, colors }) {
    this.config = config;
    this.colors = colors;
    this.group = new THREE.Group();
    this.segments = {};
    this.joints = {};
    this.materials = [];
    this.geometries = [];
    this.lastPose = null;
    this.create();
  }

  create() {
    ["torso", "leftUpperArm", "leftForearm", "rightUpperArm", "rightForearm", "leftLeg", "rightLeg"].forEach((name) => {
      const segment = makeSegment(this.config.limbWidth, this.colors.avatar);
      this.segments[name] = segment.mesh;
      this.group.add(segment.mesh);
      this.geometries.push(segment.geometry);
      this.materials.push(segment.material);
    });

    ["head", "leftWrist", "rightWrist"].forEach((name) => {
      const geometry = new THREE.CircleGeometry(name === "head" ? 0.18 : this.config.jointRadius, 24);
      const material = new THREE.MeshBasicMaterial({
        color: name === "head" ? 0xf3d66b : 0xf8f5ff,
        transparent: true,
        opacity: 0.96,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.joints[name] = mesh;
      this.group.add(mesh);
      this.geometries.push(geometry);
      this.materials.push(material);
    });

    this.group.position.set(0, this.config.anchorY, -0.64);
  }

  update(poseInput = null) {
    const pose = poseInput?.stable ? poseInput.world : this.createIdlePose();
    this.lastPose = pose;

    const shoulderCenter = {
      x: (pose.leftShoulder.x + pose.rightShoulder.x) / 2,
      y: (pose.leftShoulder.y + pose.rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (pose.leftHip.x + pose.rightHip.x) / 2,
      y: (pose.leftHip.y + pose.rightHip.y) / 2
    };

    const normalized = this.normalizePose(pose, shoulderCenter, hipCenter);

    placeSegment(this.segments.torso, normalized.hipCenter, normalized.shoulderCenter);
    placeSegment(this.segments.leftUpperArm, normalized.leftShoulder, normalized.leftElbow);
    placeSegment(this.segments.leftForearm, normalized.leftElbow, normalized.leftWrist);
    placeSegment(this.segments.rightUpperArm, normalized.rightShoulder, normalized.rightElbow);
    placeSegment(this.segments.rightForearm, normalized.rightElbow, normalized.rightWrist);
    placeSegment(this.segments.leftLeg, normalized.hipCenter, normalized.leftFoot);
    placeSegment(this.segments.rightLeg, normalized.hipCenter, normalized.rightFoot);

    this.joints.head.position.set(normalized.head.x, normalized.head.y, 0.03);
    this.joints.leftWrist.position.set(normalized.leftWrist.x, normalized.leftWrist.y, 0.04);
    this.joints.rightWrist.position.set(normalized.rightWrist.x, normalized.rightWrist.y, 0.04);
  }

  normalizePose(pose, shoulderCenter, hipCenter) {
    const torsoHeight = Math.max(Math.abs(shoulderCenter.y - hipCenter.y), 0.001);
    const scale = (1.28 / torsoHeight) * this.config.scale;
    const anchor = { x: 0, y: 0.72 };

    const map = (point) => ({
      x: (point.x - shoulderCenter.x) * scale + anchor.x,
      y: (point.y - shoulderCenter.y) * scale + anchor.y
    });

    return {
      head: map(pose.head),
      leftShoulder: map(pose.leftShoulder),
      rightShoulder: map(pose.rightShoulder),
      leftElbow: map(pose.leftElbow),
      rightElbow: map(pose.rightElbow),
      leftWrist: map(pose.leftWrist),
      rightWrist: map(pose.rightWrist),
      shoulderCenter: map(shoulderCenter),
      hipCenter: map(hipCenter),
      leftFoot: { x: -0.24, y: -0.2 },
      rightFoot: { x: 0.24, y: -0.2 }
    };
  }

  createIdlePose() {
    return {
      head: { x: 0, y: 1.35 },
      leftShoulder: { x: -0.34, y: 0.88 },
      rightShoulder: { x: 0.34, y: 0.88 },
      leftElbow: { x: -0.62, y: 0.48 },
      rightElbow: { x: 0.62, y: 0.48 },
      leftWrist: { x: -0.72, y: 0.12 },
      rightWrist: { x: 0.72, y: 0.12 },
      leftHip: { x: -0.24, y: 0.02 },
      rightHip: { x: 0.24, y: 0.02 }
    };
  }

  getWristWorldPositions() {
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
