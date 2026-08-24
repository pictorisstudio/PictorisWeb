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
        <p>${this.config.idle.instruction}</p>
      </div>
    `;
    this.root.appendChild(this.node);
  }

  update() {}

  exit() {
    this.node?.remove();
    this.node = null;
  }

  destroy() {
    this.exit();
  }
}
