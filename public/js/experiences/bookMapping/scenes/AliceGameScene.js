import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { CollectiblePool } from "../objects/CollectiblePool.js";
import { GiantBook } from "../objects/GiantBook.js";
import { PlayerPage } from "../objects/PlayerPage.js";

export class AliceGameScene {
  constructor({ scene, camera, root, config, onComplete }) {
    this.scene = scene;
    this.camera = camera;
    this.root = root;
    this.config = config.aliceGame;
    this.onComplete = onComplete;
    this.debugEnabled = config.debug;
    this.group = new THREE.Group();
    this.book = null;
    this.player = null;
    this.collectibles = null;
    this.hudNode = null;
    this.tutorialNode = null;
    this.debugTarget = null;
    this.debugGeometry = null;
    this.debugMaterial = null;
    this.previousBackground = null;
    this.lastCollectedCount = 0;
    this.movementDistance = 0;
    this.tutorialElapsed = 0;
    this.hasAdvancedMoveTutorial = false;
    this.lastPlayerPosition = new THREE.Vector3();
    this.completed = false;
    this.isActive = false;
    this.debugStats = {
      playerX: 0,
      playerY: 0,
      collected: 0,
      target: this.config.collectibles.targetCount,
      activeItems: 0,
      poolSize: this.config.collectibles.poolSize,
      rawPalmX: null,
      rawPalmY: null,
      targetX: 0,
      targetY: 0
    };
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.completed = false;
    this.previousBackground = this.scene.background;
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.book = new GiantBook({
      camera: this.camera,
      config: this.config.book
    });
    this.player = new PlayerPage({
      camera: this.camera,
      config: this.config.player
    });
    this.collectibles = new CollectiblePool({
      config: this.config.collectibles,
      colors: this.config.colors
    });
    this.group.add(this.book.group, this.collectibles.group, this.player.group);
    this.createDebugTarget();
    this.scene.add(this.group);
    this.createHud();
    this.createTutorial();
  }

  update(deltaTime, input, progress) {
    if (!this.isActive) {
      return;
    }

    this.player.update(deltaTime, input);
    this.book.update(deltaTime);
    this.tutorialElapsed += deltaTime;
    this.movementDistance += this.player.getPosition().distanceTo(this.lastPlayerPosition);
    this.lastPlayerPosition.copy(this.player.getPosition());
    this.collectibles.update(
      deltaTime,
      this.player.getPosition(),
      this.config.player.collectRadius,
      !this.completed
    );

    const stats = this.collectibles.getStats();
    const playerDebug = this.player.getDebugState();
    if (stats.collected > this.lastCollectedCount) {
      this.player.triggerCollectFeedback(this.config.feedback.pagePulseDuration);
      this.lastCollectedCount = stats.collected;
    }

    this.debugStats = {
      playerX: this.player.getPosition().x,
      playerY: this.player.getPosition().y,
      collected: stats.collected,
      target: this.config.collectibles.targetCount,
      activeItems: stats.activeItems,
      poolSize: stats.poolSize,
      rawPalmX: playerDebug.rawPalmX,
      rawPalmY: playerDebug.rawPalmY,
      targetX: playerDebug.targetX,
      targetY: playerDebug.targetY
    };
    this.updateHud(stats);
    this.updateTutorial(stats);
    this.updateDebugTarget(playerDebug);

    if (!this.completed && stats.collected >= this.config.collectibles.targetCount) {
      this.completed = true;
      this.onComplete?.(this.getResult());
    }
  }

  exit() {
    this.isActive = false;
    this.hudNode?.remove();
    this.hudNode = null;
    this.tutorialNode?.remove();
    this.tutorialNode = null;
    this.lastCollectedCount = 0;
    this.movementDistance = 0;
    this.tutorialElapsed = 0;
    this.hasAdvancedMoveTutorial = false;
    this.completed = false;
    this.lastPlayerPosition.set(0, 0, 0);

    if (this.group.parent) {
      this.scene.remove(this.group);
    }

    this.book?.dispose();
    this.collectibles?.dispose();
    this.player?.dispose();
    this.debugGeometry?.dispose();
    this.debugMaterial?.dispose();
    this.group.clear();
    this.book = null;
    this.collectibles = null;
    this.player = null;
    this.debugTarget = null;
    this.debugGeometry = null;
    this.debugMaterial = null;

    if (this.previousBackground !== null) {
      this.scene.background = this.previousBackground;
      this.previousBackground = null;
    }
  }

  destroy() {
    this.exit();
  }

  getResult() {
    return this.collectibles?.getResult() ?? {
      collected: [],
      collectedCount: 0,
      targetCount: this.config.collectibles.targetCount
    };
  }

  getDebugStats() {
    return this.debugStats;
  }

  createHud() {
    this.hudNode = document.createElement("div");
    this.hudNode.className = "alice-game-hud";
    this.root.appendChild(this.hudNode);
    this.updateHud({ collected: 0 });
  }

  updateHud(stats) {
    if (!this.hudNode) {
      return;
    }

    const target = this.config.collectibles.targetCount;
    const collected = Math.min(stats.collected, target);
    this.hudNode.innerHTML = `
      <div class="alice-progress">
        <span>RELOJES RECUPERADOS</span>
        <strong>${collected} / ${target}</strong>
      </div>
    `;
  }

  createTutorial() {
    this.tutorialNode = document.createElement("div");
    this.tutorialNode.className = "alice-game-tutorial";
    this.tutorialNode.innerHTML = `
      <p data-role="catch">RECOGE LOS RELOJES</p>
    `;
    this.root.appendChild(this.tutorialNode);
  }

  updateTutorial(stats) {
    if (!this.tutorialNode) {
      return;
    }

    const catchNode = this.tutorialNode.querySelector('[data-role="catch"]');
    const tutorial = this.config.tutorial;
    const maxReadTimePassed = this.tutorialElapsed >= tutorial.moveMaxVisible;

    catchNode.classList.toggle("is-hidden", maxReadTimePassed);
  }

  createDebugTarget() {
    if (!this.debugEnabled) {
      return;
    }

    this.debugGeometry = new THREE.CircleGeometry(0.07, 18);
    this.debugMaterial = new THREE.MeshBasicMaterial({
      color: this.config.colors.pink,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    this.debugTarget = new THREE.Mesh(this.debugGeometry, this.debugMaterial);
    this.debugTarget.position.set(0, 0, -1.04);
    this.group.add(this.debugTarget);
  }

  updateDebugTarget(playerDebug) {
    if (!this.debugTarget) {
      return;
    }

    this.debugTarget.position.set(playerDebug.targetX, playerDebug.targetY, -1.04);
    this.debugTarget.visible = playerDebug.rawPalmX !== null;
  }
}
