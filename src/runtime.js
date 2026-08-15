import { Node } from "./node.js";

export class Runtime extends Node {
  constructor(startNode) {
    super(async () => undefined);
    this.startNode = startNode;
  }

  start(node) {
    this.startNode = node;
    return node;
  }

  async run(state, params = {}) {
    if (!this.startNode) throw new Error("Runtime has no start node");
    let current = this.startNode;
    let lastAction;
    while (current) {
      current.setParams(params);
      lastAction = await current.exec(state);
      const nextNode = current.getSuccessor(lastAction);
      if (!nextNode && current.hasSuccessors()) {
        console.warn(`Flow ends: action "${lastAction}" has no successor`);
      }
      current = nextNode;
    }
    return lastAction;
  }
}