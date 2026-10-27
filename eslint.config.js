// The lint the check runs: the recommended rules over the code, with the globals each runs under.
// A profile's one module imports the foundation's registry alone, so the siblings' layer table and
// CSS module script rule have nothing here to judge.
// Adapted from spike-html-apps-foundation (679e550): eslint.config.js, cut to the recommended rules.

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const code = ["**/*.js", "**/*.ts"];

export default defineConfig([
  // The build, gitignored, which ESLint doesn't read.
  { ignores: ["dist/"] },
  { files: code, extends: [js.configs.recommended, tseslint.configs.recommended] },
  { files: code, languageOptions: { globals: globals.browser } },
  // The suite and the scripts run on node.
  { files: ["test/**/*.js", "scripts/**"], languageOptions: { globals: globals.node } },
]);
