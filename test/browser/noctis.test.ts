// The Noctis unit from dist/ on test/fixtures/noctis.html, beside the installed foundation's lean
// entry, as a consumer loads it: it registers under color, the theme menu lists it, data-palette
// and a stored choice apply it, the foundation's check passes it and fails it with a token dropped,
// and each token resolves in each scheme to the upstream swatch SWATCHES and its comment name.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, afterEach, before, describe, test } from "node:test";

import type { Failure } from "@jaimestill/spike-html-apps-foundation/conformance.js";
import { launch, until } from "@jaimestill/spike-html-apps-tooling/browser.js";
import type { Browser, Page } from "@jaimestill/spike-html-apps-tooling/browser.js";
import { serve } from "@jaimestill/spike-html-apps-tooling/server.js";
import type { Server } from "@jaimestill/spike-html-apps-tooling/server.js";

const FOUNDATION = "@jaimestill/spike-html-apps-foundation";
/** The foundation's preferences key, under which every page on an origin shares one choice. */
const KEY = "spike-html-apps-foundation.preferences";
const SCHEMES = ["light", "dark"];

/** A VS Code color theme, as far as the swatches read it. */
interface Theme {
  colors: Record<string, string>;
  tokenColors: { name?: string; settings: { foreground?: string } }[];
}

/** Noctis's two themes, light and dark, as upstream wrote them. */
const UPSTREAM: Record<string, Theme> = Object.fromEntries(
  [
    ["light", "hibernus.json"],
    ["dark", "obscuro.json"],
  ].map(([scheme, file]) => [
    scheme,
    JSON.parse(readFileSync(join(import.meta.dirname, "../fixtures/upstream", file), "utf8")),
  ]),
);

/**
 * Each token's upstream swatch, Hibernus then Obscuro: a key of the theme's colors, or
 * "tokenColors <name>" for a token color's foreground. A mapping that changes changes here.
 */
const SWATCHES: Record<string, [string, string]> = {
  "--bg": ["editor.background", "editor.background"],
  "--bg-1": ["sideBar.background", "input.background"],
  "--bg-2": ["editorWidget.background", "editorWidget.background"],
  "--border": ["editorRuler.foreground", "editorRuler.foreground"],
  "--border-2": ["editorIndentGuide.activeBackground", "editorIndentGuide.activeBackground"],
  "--fg": ["editor.foreground", "editor.foreground"],
  "--fg-2": ["sideBar.foreground", "sideBar.foreground"],
  "--fg-3": ["descriptionForeground", "descriptionForeground"],
  "--red": ["list.errorForeground", "terminal.ansiRed"],
  "--orange": ["terminal.ansiBrightYellow", "terminal.ansiBrightYellow"],
  "--yellow": ["tokenColors CONSTANT", "terminal.ansiYellow"],
  "--green": ["gitDecoration.addedResourceForeground", "terminal.ansiGreen"],
  "--cyan": ["textBlockQuote.border", "terminal.ansiCyan"],
  "--blue": ["terminal.ansiBlue", "terminal.ansiBlue"],
  "--purple": ["tokenColors NUMBER", "tokenColors NUMBER"],
  "--magenta": ["terminal.ansiMagenta", "terminal.ansiMagenta"],
};

/** The swatch's hex in the scheme's upstream theme. */
function swatch(scheme: string, name: string): string {
  const theme = UPSTREAM[scheme];
  const token = name.match(/^tokenColors (.+)$/)?.[1];
  const hex =
    (token
      ? theme.tokenColors.find((entry) => entry.name === token)?.settings.foreground
      : theme.colors[name]) ?? "";
  assert.match(hex, /^#[0-9a-f]{6}$/i, `${scheme} ${name} is an opaque swatch`);
  return hex;
}

/** A #rrggbb hex as the rgb() a computed color serializes to. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

let server: Server;
let browser: Browser;
const pages: Page[] = [];
const fixture = () => `${server.origin}/test/fixtures/noctis.html`;

before(async () => {
  // The repository root, whose fixture loads dist/ and the installed foundation by their paths.
  server = await serve({ root: join(import.meta.dirname, "../..") });
  browser = await launch();
});
// Every page shares one origin, and so the one stored choice.
afterEach(async () => {
  for (const page of pages.splice(0)) {
    await page.evaluate("localStorage.clear()").catch(() => {});
    await page.close();
  }
});
after(async () => {
  await browser?.close();
  await server?.stop();
});

/** Opens the fixture, closing it after the test. */
async function open(): Promise<Page> {
  const page = await browser.open(fixture());
  pages.push(page);
  return page;
}

/** Sets the attributes on the page's root. */
const root = (page: Page, attributes: Record<string, string>): Promise<void> =>
  page.evaluate(`(() => {
    for (const [name, value] of Object.entries(${JSON.stringify(attributes)})) {
      document.documentElement.setAttribute(name, value);
    }
  })()`);

/** The root's painted background and text colors. */
const painted = (page: Page): Promise<{ background: string; text: string }> =>
  page.evaluate(`(() => {
    const style = getComputedStyle(document.documentElement);
    return { background: style.backgroundColor, text: style.color };
  })()`);

/** What check("color", "noctis") reports on the page, with the system in the scheme. */
async function checked(page: Page, scheme: string): Promise<Failure[]> {
  await page.cdp("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: scheme }],
  });
  return page.evaluate(`import("${FOUNDATION}/conformance.js")
    .then(({ check }) => check("color", "noctis"))`);
}

describe("noctis", { timeout: 60_000 }, () => {
  test("the registration module registers noctis under color, after the default", async () => {
    const page = await open();
    const colors: string[] = await page.evaluate(`
      import("${FOUNDATION}/registry.js").then(({ profiles }) => profiles("color"))`);
    assert.deepEqual(colors, ["flexoki", "noctis"]);
  });

  test("the theme menu's color row lists flexoki and noctis", async () => {
    const page = await open();
    await page.evaluate(`document.querySelector("button[commandfor=theme]").click()`);
    // The color row's values, once the menu is open and the row filled.
    const colors: string[] = await until(
      page,
      `(() => {
        const radios = [...document.querySelectorAll('sl-theme-menu [data-section="color"] input')];
        const open = document.querySelector("sl-theme-menu dialog")?.open;
        return open && radios.length > 0 && radios.map((radio) => radio.value);
      })()`,
    );
    assert.deepEqual(colors, ["flexoki", "noctis"]);
  });

  for (const [i, scheme] of SCHEMES.entries()) {
    test(`data-palette="noctis" paints its --bg and --fg in ${scheme}`, async () => {
      const page = await open();
      await root(page, { "data-scheme": scheme });
      const flexoki = await painted(page);
      await root(page, { "data-palette": "noctis" });
      const noctis = await painted(page);
      assert.deepEqual(noctis, {
        background: rgb(swatch(scheme, SWATCHES["--bg"][i])),
        text: rgb(swatch(scheme, SWATCHES["--fg"][i])),
      });
      assert.notDeepEqual(noctis, flexoki);
    });
  }

  test("a stored choice of noctis applies on load", async () => {
    const seed = await open();
    const choice = { color: "noctis", space: "regular", type: "mono", scheme: "dark" };
    await seed.evaluate(`localStorage.setItem(${JSON.stringify(KEY)},
      ${JSON.stringify(JSON.stringify(choice))})`);
    const page = await open();
    assert.deepEqual(
      await page.evaluate(`["data-palette", "data-scheme"]
        .map((name) => document.documentElement.getAttribute(name))`),
      ["noctis", "dark"],
    );
    assert.deepEqual(await painted(page), {
      background: rgb(swatch("dark", SWATCHES["--bg"][1])),
      text: rgb(swatch("dark", SWATCHES["--fg"][1])),
    });
  });

  for (const scheme of SCHEMES) {
    test(`noctis conforms to the color facet, with the system in ${scheme}`, async () => {
      assert.deepEqual(await checked(await open(), scheme), []);
    });
  }

  // The check can fail: the sheet served again with one declaration dropped breaks tokens alone.
  test("a copy of the sheet with --magenta dropped fails the check's tokens rule", async () => {
    const page = await open();
    const dropped: boolean = await page.evaluate(`(async () => {
      const link = document.querySelector('link[href="/dist/noctis.css"]');
      const text = await (await fetch(link.href)).text();
      const copy = text.replace(/^\\s*--magenta:.*$/m, "");
      const style = document.createElement("style");
      style.textContent = copy;
      link.replaceWith(style);
      return copy !== text;
    })()`);
    assert.ok(dropped, "the sheet declares --magenta on a line of its own");
    for (const scheme of SCHEMES) {
      const failures = await checked(page, scheme);
      assert.deepEqual(
        failures.map(({ rule }) => rule),
        ["tokens"],
        scheme,
      );
      assert.match(failures[0].message, /--magenta \(light, dark\)/, scheme);
    }
  });

  for (const [i, scheme] of SCHEMES.entries()) {
    test(`each token resolves to its upstream swatch in ${scheme}`, async () => {
      const page = await open();
      const resolved: Record<string, string> = await page.evaluate(`(() => {
        const probe = document.createElement("div");
        probe.setAttribute("data-palette", "noctis");
        probe.setAttribute("data-scheme", "${scheme}");
        document.body.append(probe);
        const colors = {};
        for (const token of ${JSON.stringify(Object.keys(SWATCHES))}) {
          probe.style.color = "var(" + token + ")";
          colors[token] = getComputedStyle(probe).color;
        }
        probe.remove();
        return colors;
      })()`);
      const expected = Object.fromEntries(
        Object.entries(SWATCHES).map(([token, names]) => [token, rgb(swatch(scheme, names[i]))]),
      );
      assert.deepEqual(resolved, expected);
    });
  }
});
