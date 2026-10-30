// mise run demo: serves the repository through the tooling's static server and prints the
// demo page's URL, which loads dist/ and the installed foundation, until Ctrl-C.
// Adapted from spike-html-apps-components (9a4392e): scripts/demo.js, renamed, on the tooling's
// server.

import { join } from "node:path";

import { serve } from "@jaimestill/spike-html-apps-tooling/server.js";

const server = await serve({ root: join(import.meta.dirname, "..") });
console.log(`${server.origin}/demo/noctis.html`);
process.once("SIGINT", async () => {
  await server.stop();
  process.exit(0);
});
