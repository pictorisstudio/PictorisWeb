export class SubmarineBookRecoveredScene {
  constructor({ root, config }) {
    this.root = root;
    this.config = config.submarineBookRecovered;
    this.timeline = config.timeline;
    this.node = null;
    this.elapsed = 0;
    this.isActive = false;
  }

  enter() {
    this.exit();
    this.isActive = true;
    this.elapsed = 0;
    this.node = document.createElement("div");
    this.node.className = "submarine-book-recovered-scene";
    this.node.innerHTML = `
      <img src="${this.config.assetPath}" alt="20.000 leguas - libro recuperado">
    `;
    this.root.appendChild(this.node);
  }

  update(deltaTime) {
    if (!this.isActive || !this.node) {
      return;
    }

    this.elapsed += deltaTime;
    const duration = this.timeline.SUBMARINE_BOOK_RECOVERED.duration;
    const fadeDuration = this.config.fadeDuration;
    const fadeIn = Math.min(this.elapsed / fadeDuration, 1);
    const fadeOutStart = duration - fadeDuration;
    const fadeOut = this.elapsed > fadeOutStart
      ? Math.max(1 - (this.elapsed - fadeOutStart) / fadeDuration, 0)
      : 1;

    this.node.style.opacity = String(Math.min(fadeIn, fadeOut));
  }

  exit() {
    this.isActive = false;
    this.node?.remove();
    this.node = null;
    this.elapsed = 0;
  }

  destroy() {
    this.exit();
  }
}
