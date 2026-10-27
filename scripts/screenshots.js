// screenshots.sh's capture half: demo/noctis.html in three states, in noctis, in light and in
// dark, through the browser tier's driver, one PNG per capture into the directory its argument
// names, printing `<path>\t<caption>` for each. A capture sets data-palette="noctis" and the
// scheme on the page's root, as a stored choice would, so the demo page itself names no profile.
// Adapted from spike-html-apps-foundation (679e550): scripts/screenshots.js, on the one demo page
// and the one profile, over the lean entry the page links.

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { launch } from "../test/browser/support/browser-pipe.js";
import { serve } from "../test/browser/support/server.js";

const [dir] = process.argv.slice(2);
if (!dir) throw new Error("usage: node scripts/screenshots.js <directory>");

const PROFILE = "noctis";
const SCHEMES = ["light", "dark"];

const WIDE = { width: 1280, height: 800 };
// Below the theme menu's 48rem breakpoint: a phone's width.
const NARROW = { width: 390, height: 844 };

/** Resolves once the expression is truthy, polling for up to 5 s. */
async function waitFor(page, expression) {
  for (let tries = 0; tries < 100; tries++) {
    if (await page.evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`timed out waiting for ${expression}`);
}

/** The states, in the order they're named: each viewport, how it opens, and whether the capture
 * takes the whole page or the viewport. */
const STATES = [
  { name: "1-demo", caption: "the demo page", size: WIDE, full: true },
  ...[
    ["2-theme-menu-wide", "the theme menu open, wide", WIDE],
    ["3-theme-menu-narrow", "the theme menu open, narrow", NARROW],
  ].map(([name, caption, size]) => ({
    name,
    caption,
    size,
    async open(page) {
      // The Theme button's command="--open", as a click sends it to <sl-theme-menu>.
      await page.evaluate(`document.querySelector("button[commandfor=theme]").click()`);
      await waitFor(page, `document.querySelector("sl-theme-menu dialog")?.open`);
    },
  })),
];

/** Resolves once the fonts are ready and two frames have painted. */
const SETTLED = `document.fonts.ready.then(() => new Promise((resolve) =>
  requestAnimationFrame(() => requestAnimationFrame(resolve))))`;

const server = await serve();
const browser = await launch();
try {
  for (const state of STATES) {
    for (const scheme of SCHEMES) {
      const page = await browser.open(`${server.origin}/demo/noctis.html`);
      try {
        await page.cdp("Emulation.setDeviceMetricsOverride", {
          ...state.size,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await page.cdp("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-color-scheme", value: scheme }],
        });
        const attributes = { "data-palette": PROFILE, "data-scheme": scheme };
        await page.evaluate(`(() => {
          const root = document.documentElement;
          for (const [name, value] of Object.entries(${JSON.stringify(attributes)})) {
            root.setAttribute(name, value);
          }
        })()`);
        await state.open?.(page);
        await page.evaluate(SETTLED);
        let clip;
        if (state.full) {
          const { cssContentSize } = await page.cdp("Page.getLayoutMetrics");
          clip = { x: 0, y: 0, width: state.size.width, height: cssContentSize.height, scale: 1 };
        }
        const { data } = await page.cdp("Page.captureScreenshot", {
          format: "png",
          ...(clip && { clip, captureBeyondViewport: true }),
        });
        const path = join(dir, `${state.name}--${PROFILE}-${scheme}.png`);
        writeFileSync(path, Buffer.from(data, "base64"));
        console.log(`${path}\t${state.caption}: ${PROFILE}, ${scheme}`);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
  await server.stop();
}
