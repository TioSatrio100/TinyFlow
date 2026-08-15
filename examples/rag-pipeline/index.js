import { Node, Runtime } from "../../src/index.js";
import { runBatch } from "../../src/batch.js";

function fakeEmbedding(text) {
  return text.toLowerCase().split(/\s+/);
}

function cosineSim(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const overlap = [...setA].filter((x) => setB.has(x)).length;
  return overlap / Math.sqrt(setA.size * setB.size || 1);
}

const chunkDocs = new Node(async (state) => {
  const chunkSize = 100;
  const allChunks = [];
  for (const doc of state.files) {
    for (let i = 0; i < doc.length; i += chunkSize) {
      allChunks.push(doc.slice(i, i + chunkSize));
    }
  }
  state.allChunks = allChunks;
  return "default";
});

const embedDocs = new Node(async (state) => {
  state.allEmbeds = await runBatch(
    new Node(async (chunk) => fakeEmbedding(chunk)),
    state.allChunks
  );
  return "default";
});

const storeIndex = new Node(async (state) => {
  state.index = state.allChunks.map((chunk, i) => ({
    chunk,
    embedding: state.allEmbeds[i],
  }));
  return null;
});

chunkDocs.next(embedDocs);
embedDocs.next(storeIndex);

const offlineRuntime = new Runtime(chunkDocs);

const embedQuery = new Node(async (state) => {
  state.queryEmbedding = fakeEmbedding(state.question);
  return "default";
});

const retrieveDocs = new Node(async (state) => {
  const scored = state.index.map((entry) => ({
    ...entry,
    score: cosineSim(state.queryEmbedding, entry.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  state.retrievedChunk = scored[0].chunk;
  return "default";
});

const generateAnswer = new Node(async (state) => {
  state.answer = `Jawaban untuk "${state.question}" berdasarkan konteks: "${state.retrievedChunk}"`;
  return null;
});

embedQuery.next(retrieveDocs);
retrieveDocs.next(generateAnswer);

const onlineRuntime = new Runtime(embedQuery);

const state = {
  files: [
    "TinyFlow adalah graph runtime minimal untuk membangun workflow dan AI agent tanpa dependency besar.",
    "Node menerima state dan mengembalikan action, lalu Runtime menentukan Node berikutnya lewat Edge.",
  ],
};

await offlineRuntime.run(state);
console.log("Index tersimpan:", state.index.length, "chunks");

state.question = "Apa itu TinyFlow?";
await onlineRuntime.run(state);
console.log(state.answer);