// The Noctis unit from this repository's dist/, on test/fixtures/noctis.html beside the installed
// foundation's lean entry: its registration module registers noctis under the color facet, after
// the lean default, in the registry the page's own modules read.

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { launch } from "./support/browser-pipe.js";
import { serve } from "./support/server.js";

describe("noctis", { timeout: 60_000 }, () => {
  let server;
  let browser;
  before(async () => {
    server = await serve();
    browser = await launch();
  });
  after(async () => {
    await browser?.close();
    await server?.stop();
  });

  test("the registration module registers noctis under color, after the default", async () => {
    const page = await browser.open(`${server.origin}/test/fixtures/noctis.html`);
    try {
      const colors = await page.evaluate(`
        import("@jaimestill/spike-html-apps-foundation/registry.js")
          .then(({ profiles }) => profiles("color"))`);
      assert.deepEqual(colors, ["flexoki", "noctis"]);
    } finally {
      await page.close();
    }
  });
});
