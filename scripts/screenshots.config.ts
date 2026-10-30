// mise run screenshots' description, which the tooling's spike-html-apps-screenshots captures:
// demo/noctis.html in three states, the whole page and the theme menu open wide and narrow, in
// noctis, in light and in dark. The bin sets data-palette and the scheme on the page's root, as a
// stored choice would, so the demo page itself names no profile. A palette --palette names is
// checked against the color profiles the page registers, read from the foundation's registry. The
// server serves the repository root, whose demo page loads dist/ and the installed foundation by
// their paths.
// Adapted from spike-html-apps-noctis (5208630): scripts/screenshots.js, as a description.

import { until } from "@jaimestill/spike-html-apps-tooling/browser.js";
import type { Page } from "@jaimestill/spike-html-apps-tooling/browser.js";
import type { Description } from "@jaimestill/spike-html-apps-tooling/screenshots.js";

/** Opens the theme menu, as a click on the Theme button sends command="--open" to it. */
async function openThemeMenu(page: Page): Promise<void> {
  await page.evaluate(`document.querySelector("button[commandfor=theme]").click()`);
  await until(page, `document.querySelector("sl-theme-menu dialog")?.open`);
}

/** The page's registered palettes, read from the foundation's store at its well-known global key,
 * so noctis, which this package's module registers there, counts beside the foundation's own;
 * the store's color facet is palette's, and this description has no other facet. */
const REGISTRY = `(() => {
  const store = globalThis[Symbol.for("spike-html-apps-foundation.registry")] ?? {};
  return { palette: store.color ?? [] };
})()`;

const description: Description = {
  pages: [
    {
      name: "demo",
      caption: "the demo page",
      path: "demo/noctis.html",
      states: [
        { full: true },
        {
          name: "theme-menu-wide",
          caption: "the theme menu open, wide",
          full: false,
          open: openThemeMenu,
        },
        {
          name: "theme-menu-narrow",
          caption: "the theme menu open, narrow",
          // Below the theme menu's 48rem breakpoint: a phone's width.
          viewport: { width: 390, height: 844 },
          full: false,
          open: openThemeMenu,
        },
      ],
    },
  ],
  facets: [{ flag: "palette", attribute: "data-palette", default: "noctis" }],
  profiles: (page) => page.evaluate(REGISTRY),
  server: { root: ".." },
};

export default description;
