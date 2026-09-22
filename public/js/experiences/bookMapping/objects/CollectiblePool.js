import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { createClockGeometry, createClockMaterial, getClockTexture } from "./ClockVisual.js";

export class CollectiblePool {
  constructor({ config, colors }) {
    this.config = config;
    this.colors = colors;
    this.group = new THREE.Group();
    this.items = [];
    this.geometries = [];
    this.materials = [];
    this.spawnElapsed = 0;
    this.hasFirstSpawned = false;
    this.hasFirstCollected = false;
    this.tutorialElapsed = 0;
    this.collected = [];
    this.buildItems();
  }

  update(deltaTime, playerPosition, collectRadius, canSpawn = true) {
    const delta = deltaTime / 1000;

    this.tutorialElapsed += deltaTime;

    if (canSpawn) {
      this.spawnElapsed += deltaTime;

      if (!this.hasFirstSpawned && this.spawnElapsed >= this.config.firstSpawnDelay) {
        this.spawn(playerPosition, true);
        this.spawnElapsed = 0;
        this.hasFirstSpawned = true;
      } else if (this.canRunMainSpawn() && this.spawnElapsed >= this.config.spawnInterval) {
        this.spawn(playerPosition, false);
        this.spawnElapsed = 0;
      }
    }

    this.items.forEach((item) => {
      if (item.state === "inactive") {
        return;
      }

      if (item.state === "active") {
        item.group.position.z += this.config.speed * delta;
        item.group.rotation.z += delta * item.spin;
        const depth = THREE.MathUtils.clamp(
          (item.group.position.z - this.config.zSpawn) / (this.config.zDespawn - this.config.zSpawn),
          0,
          1
        );
        const depthScale = THREE.MathUtils.lerp(this.config.farScale, this.config.nearScale, depth);
        const depthOpacity = THREE.MathUtils.lerp(this.config.farOpacity, this.config.nearOpacity, depth);
        const tutorialBoost = item.isTutorial ? 1.38 : 1;
        item.group.scale.setScalar(Math.max(depthScale, 0.25) * tutorialBoost);
        this.setItemOpacity(item, depthOpacity);

        if (!item.isTutorial) {
          item.group.position.x += item.driftX * delta * (0.35 + depth * 0.9);
          item.group.position.y += Math.sin(item.seed + depth * Math.PI) * delta * 0.18;
        }

        if (item.isTutorial && !this.hasFirstCollected && this.tutorialElapsed > this.config.tutorialTimeout) {
          item.group.position.x += (playerPosition.x - item.group.position.x) * 0.035;
          item.group.position.y += (playerPosition.y - item.group.position.y) * 0.035;
        }

        const dx = item.group.position.x - playerPosition.x;
        const dy = item.group.position.y - playerPosition.y;
        const distance = Math.hypot(dx, dy);
        const isCollectableDepth = item.group.position.z >= this.config.collectZMin
          && item.group.position.z <= this.config.collectZMax;

        if (isCollectableDepth && distance < collectRadius) {
          this.collect(item, playerPosition);
          return;
        }

        if (item.group.position.z > this.config.zDespawn) {
          this.deactivate(item);
        }
      }

      if (item.state === "collecting") {
        item.feedback += deltaTime;
        const progress = Math.min(item.feedback / 360, 1);
        item.group.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.75);
        item.group.position.x += (-3.45 - item.group.position.x) * 0.12;
        item.group.position.y += (2.55 - item.group.position.y) * 0.12;
        item.group.position.z += (-1.1 - item.group.position.z) * 0.1;
        item.group.traverse((child) => {
          if (child.material) {
            child.material.opacity = Math.max(1 - progress, 0);
          }
        });

        if (progress >= 1) {
          this.deactivate(item);
        }
      }
    });
  }

  spawn(playerPosition, nearPlayer = false) {
    const item = this.items.find((candidate) => candidate.state === "inactive");
    if (!item) {
      return;
    }

    this.prepareType(item, "CLOCK");
    item.state = "active";
    item.isTutorial = nearPlayer;
    item.feedback = 0;
    item.spin = -1.2 + Math.random() * 2.4;
    item.seed = Math.random() * Math.PI * 2;
    item.driftX = nearPlayer ? 0 : (Math.random() > 0.5 ? -1 : 1) * -0.72;
    const side = item.driftX < 0 ? 1 : -1;
    item.group.visible = true;
    item.group.position.set(
      nearPlayer ? playerPosition.x + 0.48 : side * (2.7 + Math.random() * 1.05),
      nearPlayer ? playerPosition.y + 0.12 : -1.55 + Math.random() * 3.1,
      nearPlayer ? this.config.collectZMin - 0.35 : this.config.zSpawn
    );
    item.group.rotation.set(0, 0, Math.random() * Math.PI);
    item.group.scale.setScalar(nearPlayer ? 0.9 : 0.55);
    item.group.traverse((child) => {
      if (child.material) {
        child.material.opacity = child.material.userData.baseOpacity ?? 1;
      }
    });
  }

  collect(item, playerPosition) {
    item.state = "collecting";
    this.hasFirstCollected = true;
    item.feedback = 0;
    this.collected.push({
      type: item.type,
      x: item.group.position.x,
      y: item.group.position.y
    });
  }

  deactivate(item) {
    item.state = "inactive";
    item.isTutorial = false;
    item.group.visible = false;
    item.group.position.set(0, 0, this.config.zSpawn);
  }

  reset() {
    this.spawnElapsed = 0;
    this.hasFirstSpawned = false;
    this.hasFirstCollected = false;
    this.tutorialElapsed = 0;
    this.collected = [];
    this.items.forEach((item) => this.deactivate(item));
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
  }

  getStats() {
    return {
      collected: this.collected.length,
      activeItems: this.items.filter((item) => item.state !== "inactive").length,
      poolSize: this.items.length,
      hasFirstCollected: this.hasFirstCollected,
      tutorialElapsed: this.tutorialElapsed
    };
  }

  canRunMainSpawn() {
    return this.hasFirstCollected || this.tutorialElapsed >= this.config.tutorialTimeout;
  }

  getResult() {
    return {
      collected: this.collected.slice(),
      collectedCount: this.collected.length,
      targetCount: this.config.targetCount
    };
  }

  buildItems() {
    const shared = this.createSharedVisuals();

    for (let index = 0; index < this.config.poolSize; index += 1) {
      const itemGroup = new THREE.Group();
      const visuals = {
        CLOCK: this.createClock(shared)
      };

      Object.values(visuals).forEach((visual) => {
        visual.visible = false;
        itemGroup.add(visual);
      });

      itemGroup.visible = false;
      this.group.add(itemGroup);
      this.items.push({
        group: itemGroup,
        visuals,
        type: "CLOCK",
        state: "inactive",
        isTutorial: false,
        feedback: 0,
        spin: 0,
        seed: 0,
        driftX: 0
      });
    }
  }

  createSharedVisuals() {
    const clock = createClockGeometry(this.config);
    const texture = getClockTexture(this.config.clockAssetPath);
    this.geometries.push(clock);

    return { clock, texture };
  }

  setItemOpacity(item, opacity) {
    item.group.traverse((child) => {
      if (child.material) {
        const baseOpacity = child.material.userData.baseOpacity ?? 1;
        child.material.opacity = Math.min(baseOpacity, opacity);
      }
    });
  }

  createClock(shared) {
    const material = createClockMaterial(shared.texture, 1);
    this.materials.push(material);

    const group = new THREE.Group();
    const clock = new THREE.Mesh(shared.clock, material);
    group.add(clock);
    return group;
  }

  prepareType(item, type) {
    item.type = type;
    Object.entries(item.visuals).forEach(([key, visual]) => {
      visual.visible = key === type;
    });
  }

}
