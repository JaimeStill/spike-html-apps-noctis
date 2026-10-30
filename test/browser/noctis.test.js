// The Noctis unit from dist/ on test/fixtures/noctis.html, beside the installed foundation's lean
// entry, as a consumer loads it: it registers under color, the theme menu lists it, data-palette
// and a stored choice apply it, the foundation's check passes it and fails it with a token dropped,
// and each token resolves in each scheme to the upstream swatch SWATCHES and its comment name.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, afterEach, before, describe, test } from "node:test";

import { launch } from "@jaimestill/spike-html-apps-tooling/browser.js";
import { serve } from "@jaimestill/spike-html-apps-tooling/server.js";

const FOUNDATION = "@jaimestill/spike-html-apps-foundation";
/** The foundation's preferences key, under which every page on an origin shares one choice. */
const KEY = "spike-html-apps-foundation.preferences";
const SCHEMES = ["light", "dark"];

/** Noctis's two themes, light and dark, as upstream wrote them. */
const UPSTREAM = Object.fromEntries(
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
const SWATCHES = {
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
function swatch(scheme, name) {
  const theme = UPSTREAM[scheme];
  const token = name.match(/^tokenColors (.+)$/)?.[1];
  const hex = token
    ? theme.tokenColors.find((entry) => entry.name === token)?.settings.foreground
    : theme.colors[name];
  assert.match(hex ?? "", /^#[0-9a-f]{6}$/i, `${scheme} ${name} is an opaque swatch`);
  return hex;
}

/** A #rrggbb hex as the rgb() a computed color serializes to. */
function rgb(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

let server;
let browser;
const pages = [];
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
async function open() {
  const page = await browser.open(fixture());
  pages.push(page);
  return page;
}

/** Sets the attributes on the page's root. */
const root = (page, attributes) =>
  page.evaluate(`(() => {
    for (const [name, value] of Object.entries(${JSON.stringify(attributes)})) {
      document.documentElement.setAttribute(name, value);
    }
  })()`);

/** The root's painted background and text colors. */
const painted = (page) =>
  page.evaluate(`(() => {
    const style = getComputedStyle(document.documentElement);
    return { background: style.backgroundColor, text: style.color };
  })()`);

/** What check("color", "noctis") reports on the page, with the system in the scheme. */
async function checked(page, scheme) {
  await page.cdp("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: scheme }],
  });
  return page.evaluate(`import("${FOUNDATION}/conformance.js")
    .then(({ check }) => check("color", "noctis"))`);
}

describe("noctis", { timeout: 60_000 }, () => {
  test("the registration module registers noctis under color, after the default", async () => {
    const page = await open();
    const colors = await page.evaluate(`
      import("${FOUNDATION}/registry.js").then(({ profiles }) => profiles("color"))`);
    assert.deepEqual(colors, ["flexoki", "noctis"]);
  });

  test("the theme menu's color row lists flexoki and noctis", async () => {
    const page = await open();
    await page.evaluate(`document.querySelector("button[commandfor=theme]").click()`);
    const colors = await page.evaluate(`new Promise((resolve, reject) => {
      const end = performance.now() + 2000;
      const poll = () => {
        const radios = document.querySelectorAll('sl-theme-menu [data-section="color"] input');
        if (document.querySelector("sl-theme-menu dialog")?.open && radios.length) {
          resolve([...radios].map((radio) => radio.value));
        } else if (performance.now() > end) reject(new Error("the theme menu didn't open"));
        else setTimeout(poll, 10);
      };
      poll();
    })`);
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
    const dropped = await page.evaluate(`(async () => {
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
      const resolved = await page.evaluate(`(() => {
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
