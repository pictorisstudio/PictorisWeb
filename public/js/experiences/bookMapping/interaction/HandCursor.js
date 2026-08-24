export class HandCursor {
  constructor({ config } = {}) {
    this.config = config;
    this.node = null;
    this.visualNode = null;
    this.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.target = { ...this.current };
    this.visible = false;
    this.lastSeenAt = 0;
  }

  init() {
    if (!this.config?.enabled) {
      return;
    }

    this.node = document.createElement("div");
    this.node.className = "book-mapping-cursor-position";
    this.node.style.width = `${this.config.size}px`;
    this.node.style.height = `${this.config.size}px`;

    this.visualNode = document.createElement("div");
    this.visualNode.className = "book-mapping-cursor";
    this.node.appendChild(this.visualNode);

    document.body.appendChild(this.node);
    this.applyPosition();
  }

  update(input) {
    if (!this.node || !this.config?.enabled) {
      return this.getState();
    }

    if (input?.detected && input.primaryHand?.index) {
      const index = input.primaryHand.index;
      const normalizedX = this.config.mirrorX ? 1 - index.x : index.x;
      this.target.x = normalizedX * window.innerWidth;
      this.target.y = index.y * window.innerHeight;
      this.lastSeenAt = performance.now();
      this.setVisible(true);
    } else if (performance.now() - this.lastSeenAt > this.config.hideDelay) {
      this.setVisible(false);
    }

    const smoothing = this.config.smoothing;
    this.current.x += (this.target.x - this.current.x) * smoothing;
    this.current.y += (this.target.y - this.current.y) * smoothing;
    this.applyPosition();

    return this.getState(input);
  }

  hide() {
    this.setVisible(false);
  }

  destroy() {
    this.node?.remove();
    this.node = null;
    this.visualNode = null;
  }

  setVisible(isVisible) {
    this.visible = isVisible;
    this.node?.classList.toggle("is-visible", isVisible);
  }

  applyPosition() {
    if (!this.node) {
      return;
    }

    this.node.style.left = `${this.current.x}px`;
    this.node.style.top = `${this.current.y}px`;
  }

  getState(input = null) {
    return {
      visible: this.visible,
      x: this.current.x,
      y: this.current.y,
      indexX: input?.primaryHand?.index?.x ?? null,
      indexY: input?.primaryHand?.index?.y ?? null,
      source: input?.source ?? "none"
    };
  }
}
