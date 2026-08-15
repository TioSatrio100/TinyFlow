function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Node {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.maxRetries = options.maxRetries ?? 1;
    this.waitMs = options.waitMs ?? 0;
    this.successors = new Map();
    this.params = {};
    this.fallback = options.fallback;
  }

  next(node, action = "default") {
    if (this.successors.has(action)) {
      console.warn(`Overwriting successor for action "${action}"`);
    }
    this.successors.set(action, node);
    return node;
  }

  on(action, node) {
    this.next(node, action);
    return this;
  }

  setParams(params) {
    this.params = params;
  }

  getSuccessor(action) {
    return this.successors.get(action ?? "default");
  }

  hasSuccessors() {
    return this.successors.size > 0;
  }

  async exec(state) {
    const ctx = { params: this.params };
    let lastErr;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.fn(state, ctx);
      } catch (err) {
        lastErr = err;
        if (attempt === this.maxRetries - 1) {
          if (this.fallback) return await this.fallback(state, ctx, err);
          throw err;
        }
        if (this.waitMs > 0) await sleep(this.waitMs);
      }
    }
    throw lastErr;
  }

  async run(state) {
    if (this.hasSuccessors()) {
      console.warn("Node has successors but was run directly. Use Runtime instead.");
    }
    return this.exec(state);
  }
}