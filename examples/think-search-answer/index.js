import { Node, Runtime } from "../../src/index.js";

const think = new Node(async (state) => {
  return state.searchResults ? "answer" : "search";
});

const search = new Node(async (state) => {
  state.searchResults = `Search results for: ${state.question}`;
  return "default";
});

const answer = new Node(async (state) => {
  state.answer = `Answer based on: ${state.searchResults}`;
  return null;
});

think.on("search", search);
search.next(think);
think.on("answer", answer);

const runtime = new Runtime(think);
const state = { question: "What is TinyFlow.js?" };

await runtime.run(state);
console.log(state);