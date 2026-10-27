// mise run demo: serves the repository through the browser tier's static server and prints the
// demo page's URL, which loads dist/ and the installed foundation, until Ctrl-C.
// Adapted from spike-html-apps-components (9a4392e): scripts/demo.js, renamed.

import { serve } from "../test/browser/support/server.js";

const server = await serve();
console.log(`${server.origin}/demo/noctis.html`);
process.once("SIGINT", async () => {
  await server.stop();
  process.exit(0);
});
