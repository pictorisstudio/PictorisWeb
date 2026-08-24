export class LinearScene {
  constructor({ root, config }) {
    this.root = root;
    this.config = config;
    this.node = null;
    this.handOrb = null;
    this.state = null;
  }

  enter(state, options = {}) {
    this.exit();
    this.state = state;
    const stateConfig = this.config.timeline[state];

    this.node = document.createElement("section");
    this.node.className = `book-linear-scene${options.suppressTitle ? " is-title-suppressed" : ""}`;
    this.node.style.setProperty("--scene-color", stateConfig.color);
    this.node.innerHTML = `
      <div class="book-linear-bg"></div>
      <div class="book-linear-content">
        <p>${state}</p>
        <h1>${stateConfig.title}</h1>
        <span>${stateConfig.subtitle ?? ""}</span>
      </div>
      <div class="book-linear-hand-orb" aria-hidden="true"></div>
    `;

    this.handOrb = this.node.querySelector(".book-linear-hand-orb");
    this.root.appendChild(this.node);
    requestAnimationFrame(() => {
      this.node?.classList.add("is-active");
    });
  }

  update(deltaTime, input) {
    if (!this.handOrb) {
      return;
    }

    if (input?.source === "hand" && input.primaryHand?.palm) {
      const x = (1 - input.primaryHand.palm.x) * window.innerWidth;
      const y = input.primaryHand.palm.y * window.innerHeight;
      this.handOrb.style.left = `${x}px`;
      this.handOrb.style.top = `${y}px`;
      this.handOrb.classList.add("is-visible");
    } else {
      this.handOrb.classList.remove("is-visible");
    }
  }

  exit() {
    this.node?.remove();
    this.node = null;
    this.handOrb = null;
    this.state = null;
  }

  destroy() {
    this.exit();
  }
}
