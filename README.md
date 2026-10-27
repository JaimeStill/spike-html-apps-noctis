# spike-html-apps-noctis

The Noctis color profile for
[spike-html-apps-foundation](https://github.com/JaimeStill/spike-html-apps-foundation): Noctis
Hibernus in light and Noctis Obscuro in dark, added from outside the foundation as any extension
package adds one. It is one unit, a sheet and its registration module, that takes the foundation
as a peer, and is released by git tag.

## Install

Each release is a tag, `v<version>`, whose tree is the package as `pnpm pack` builds it:
`package.json`, this README, the LICENSE, and `dist/`; each GitHub release also carries the
tarball. It takes [the foundation](https://github.com/JaimeStill/spike-html-apps-foundation) as a
peer at `^0.2.0`: a consumer declares the foundation beside the profile, and the one copy serves
both, so the profile registers in the registry the page's own modules read. Install both by their
tags:

```
npm install --allow-git=root github:JaimeStill/spike-html-apps-noctis#v0.1.0 github:JaimeStill/spike-html-apps-foundation#v0.2.0
pnpm add github:JaimeStill/spike-html-apps-noctis#v0.1.0 github:JaimeStill/spike-html-apps-foundation#v0.2.0
bun add github:JaimeStill/spike-html-apps-noctis#v0.1.0 github:JaimeStill/spike-html-apps-foundation#v0.2.0
```

npm 12 refuses git dependencies unless `--allow-git` allows them; `root` allows the ones the
project itself declares, which both packages are.

## Use

The package is `@jaimestill/spike-html-apps-noctis`. It is a unit beside the foundation: a page
that links the foundation's lean entry, `page.css`, links `noctis.css` after it, and imports
`noctis.js` beside the foundation's `register.js`. The module imports the foundation's registry
by package name, so a page reaches it through an import map or a bundler. `data-palette="noctis"`
then names the profile on any element, and the theme menu lists it beside Flexoki. `<foundation>`
and `<noctis>` are where each package's `dist/` is served from, such as
`node_modules/@jaimestill/spike-html-apps-foundation/dist`:

```html
<script type="importmap">
  { "imports": { "@jaimestill/spike-html-apps-foundation/": "<foundation>/" } }
</script>
<link rel="stylesheet" href="<foundation>/page.css" />
<link rel="stylesheet" href="<noctis>/noctis.css" />
<script type="module" blocking="render" src="<foundation>/register.js"></script>
<script type="module" blocking="render" src="<noctis>/noctis.js"></script>
<script type="module" blocking="render" src="<foundation>/preferences.js"></script>
<html data-palette="noctis">
```

- `./noctis.css`: the profile's sheet, self-layered into `foundation.tokens.color`, after the
  foundation's own profiles.
- `./noctis.js`: the registration module, with its `.d.ts`; it registers `noctis` under color and
  loads no CSS.

The profile passes the foundation's `check("color", "noctis")` in light and in dark. Its colors
are [Noctis](https://github.com/liviuschera/noctis)'s (MIT, Liviu Schera), at commit 4a82370:
Noctis Hibernus in light and Noctis Obscuro in dark. The sheet's heading names the swatch each
token takes, and records the contrast its values carry, which this package doesn't correct.

`demo/noctis.html` is a page on the unit and the foundation, with its import map.

## Development

Tasks run through [mise](https://mise.jdx.dev):

```
mise run install      # the pinned tools, and node_modules with the foundation at its tag; reads the network
mise run check        # lint, types, build, and the unit and browser tiers; reads no network
mise run build        # src/ into dist/
mise run demo         # serve the demo page on dist/ and the installed foundation
mise run screenshots  # capture the demo page and the theme menu in noctis, light and dark, shown in kitty; --keep keeps them
mise run currency     # report every tool, package, and action pin, and the foundation's tag and peer range, behind its latest
```

A push to main whose `package.json` version has no tag yet releases it: the check, then the pack
committed and tagged, and a GitHub release from `CHANGELOG.md`.

## Provenance

The tooling is copied from spike-html-apps-components at 9a4392e and spike-html-apps-foundation
at 679e550. Each copied file that takes comments names its source in a provenance line; the JSON
files, which take none, carry no line. The browser tier's `test/fixtures/upstream/` holds Noctis's
two themes as upstream wrote them, with its LICENSE and a note naming the commit.

## License

[Apache License 2.0](LICENSE).
