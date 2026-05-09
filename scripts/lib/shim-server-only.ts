// Preload shim: prevents server-only from throwing when pipeline modules are run in CLI scripts
require.cache[require.resolve("server-only")] = {
  id: "server-only", filename: "server-only", loaded: true, exports: {},
  parent: null, children: [], paths: [], path: "", require,
} as unknown as NodeModule;
