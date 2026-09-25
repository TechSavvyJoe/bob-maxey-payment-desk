import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";

let revision = process.env.GITHUB_SHA?.slice(0, 8) || 'development';
if (revision === 'development') {
  try {
    revision = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
    if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) revision += '-modified';
  } catch { /* A source archive may have no Git metadata. */ }
}

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: { __BUILD_ID__: JSON.stringify(revision) },
});
