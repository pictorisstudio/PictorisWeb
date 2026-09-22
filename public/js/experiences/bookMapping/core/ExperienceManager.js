import { ExperienceState } from "./ExperienceState.js";

export class ExperienceManager {
  constructor({ timeline, initialState = ExperienceState.IDLE } = {}) {
    this.timeline = timeline;
    this.state = initialState;
    this.elapsed = 0;
    this.loopCount = 0;
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(nextState, { force = false } = {}) {
    if (!Object.values(ExperienceState).includes(nextState) || (!force && this.state === nextState)) {
      return;
    }

    const previousState = this.state;
    this.state = nextState;
    this.elapsed = 0;

    this.listeners.forEach((listener) => {
      listener(this.state, previousState);
    });
  }

  update(deltaTime) {
    const stateConfig = this.timeline[this.state];

    if (!stateConfig?.duration) {
      return;
    }

    this.elapsed += deltaTime;

    if (this.elapsed >= stateConfig.duration) {
      this.advance();
    }
  }

  advance() {
    const stateConfig = this.timeline[this.state];
    const nextState = stateConfig?.next;

    if (nextState) {
      this.setState(nextState);
      return;
    }

    this.reset();
  }

  onChange(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  reset() {
    this.loopCount += this.state === ExperienceState.IDLE ? 0 : 1;
    this.setState(ExperienceState.IDLE);
    this.elapsed = 0;
  }

  getSnapshot() {
    const stateConfig = this.timeline[this.state] ?? {};
    const duration = stateConfig.duration ?? 0;

    return {
      state: this.state,
      elapsed: this.elapsed,
      duration,
      progress: duration ? Math.min(this.elapsed / duration, 1) : 0,
      loopCount: this.loopCount
    };
  }

  destroy() {
    this.listeners.clear();
  }
}
