export class AliceIntroScene {
  constructor({ root, config }) {
    this.root = root;
    this.config = config;
    this.node = null;
  }

  enter() {
    this.exit();
    const stateConfig = this.config.timeline.ALICE_INTRO;
    this.node = document.createElement("div");
    this.node.className = "alice-intro-scene";
    this.node.innerHTML = `
      <div class="alice-intro-bg"></div>
      <div class="alice-intro-content">
        <h1>${stateConfig.title}</h1>
        <p>${stateConfig.subtitle}</p>
      </div>
    `;
    this.root.appendChild(this.node);
  }

  update(deltaTime, input, progress) {
    if (!this.node) {
      return;
    }

    this.node.style.setProperty("--intro-progress", progress.toFixed(3));
    this.node.querySelector(".alice-intro-content").style.opacity = `${Math.max(1 - Math.max(progress - 0.72, 0) * 3.6, 0)}`;
    this.node.querySelector(".alice-intro-content").style.transform = `translateY(${progress * -22}px)`;
  }

  exit() {
    this.node?.remove();
    this.node = null;
  }

  destroy() {
    this.exit();
  }
}
