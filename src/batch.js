export async function runBatch(node, items) {
  const results = [];
  for (const item of items) {
    results.push(await node.exec(item));
  }
  return results;
}

export async function runParallelBatch(node, items) {
  return Promise.all(items.map((item) => node.exec(item)));
}