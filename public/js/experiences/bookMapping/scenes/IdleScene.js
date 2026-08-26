export class IdleScene {
  constructor({ root, config }) {
    this.root = root;
    this.config = config;
    this.node = null;
  }

  enter() {
    this.exit();
    this.node = document.createElement("div");
    this.node.className = "book-idle-scene is-active";
    this.node.innerHTML = `
      <div class="book-idle-bg"></div>
      <div class="book-idle-content">
        <h1>${this.config.idle.title}</h1>
        <div class="book-idle-support">EXPERIENCIA INTERACTIVA CON TUS MANOS</div>
        <div class="book-idle-gesture" aria-hidden="true">
          <p>LEVANTA TU MANO<br>PARA COMENZAR</p>
          <div class="book-idle-hold-circle" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <circle class="book-idle-hold-track" cx="32" cy="32" r="26"></circle>
              <circle class="book-idle-hold-progress" cx="32" cy="32" r="26"></circle>
            </svg>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(this.node);
  }

  update(deltaTime, input, progress, { cameraReady = false, instructionReady = false, holdProgress = 0 } = {}) {
    if (!this.node) {
      return;
    }

    const hold = this.node.querySelector(".book-idle-hold-progress");
    const circleLength = 2 * Math.PI * 26;
    this.node.classList.toggle("is-camera-ready", cameraReady);
    this.node.classList.toggle("is-instruction-ready", instructionReady);
    this.node.classList.toggle("is-hold-complete", holdProgress >= 1);

    if (hold) {
      hold.style.strokeDashoffset = String(circleLength * (1 - holdProgress));
    }
  }

  exit() {
    this.node?.remove();
    this.node = null;
  }

  destroy() {
    this.exit();
  }
}
