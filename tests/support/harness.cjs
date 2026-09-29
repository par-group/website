/* eslint-disable @typescript-eslint/no-require-imports */
// Shared test setup (same approach as the app's tests). Loads the site's
// TypeScript straight from src/ (resolving the "@/" alias), stubs modules that
// only work inside Next.js, and gives each file a throwaway working directory
// with its own SQLite database.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const SRC = path.resolve(__dirname, "../../src");

require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};

// "server-only" throws outside a React Server environment; it guards bundling, not logic.
const mocks = new Map([["server-only", {}]]);
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (mocks.has(request)) return mocks.get(request);
  return originalLoad.call(this, request.startsWith("@/") ? path.join(SRC, request.slice(2)) : request, ...args);
};

/** Load site code by its "@/..." specifier. */
function load(specifier) {
  return require(path.join(SRC, specifier.replace(/^@\//, "")));
}

/**
 * Run this file's tests in a fresh temp directory, so the local database never
 * touches the developer's ./data. Call before loading any server code.
 */
function useTempWorkspace(name) {
  const originalCwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `sidekick-site-${name}-`));
  process.chdir(dir);
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.VERCEL;
  return {
    dir,
    async cleanup() {
      (await load("@/server/db").db()).close();
      process.chdir(originalCwd);
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

module.exports = { load, useTempWorkspace };
