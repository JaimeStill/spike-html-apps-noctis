// mise run screenshots' description, which the tooling's spike-html-apps-screenshots captures:
// demo/noctis.html in three states, the whole page and the theme menu open wide and narrow, in
// noctis, in light and in dark. The bin sets data-palette and the scheme on the page's root, as a
// stored choice would, so the demo page itself names no profile. The server serves the repository
// root, whose demo page loads dist/ and the installed foundation by their paths.
// Adapted from spike-html-apps-noctis (5208630): scripts/screenshots.js, as a description.

import { until } from "@jaimestill/spike-html-apps-tooling/browser.js";

/** Opens the theme menu, as a click on the Theme button sends command="--open" to it. */
async function openThemeMenu(page) {
  await page.evaluate(`document.querySelector("button[commandfor=theme]").click()`);
  await until(page, `document.querySelector("sl-theme-menu dialog")?.open`);
}

/** @type {import("@jaimestill/spike-html-apps-tooling/screenshots.js").Description} */
export default {
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
  server: { root: ".." },
};
