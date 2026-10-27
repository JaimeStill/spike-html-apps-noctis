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

## Development

Tasks run through [mise](https://mise.jdx.dev):

```
mise run install    # the pinned tools, and node_modules with the foundation at its tag; reads the network
mise run check      # lint, types, build, and the unit and browser tiers; reads no network
mise run build      # src/ into dist/
mise run demo       # serve the demo page on dist/ and the installed foundation
mise run currency   # report every tool, package, and action pin, and the foundation's tag and peer range, behind its latest
```

A push to main whose `package.json` version has no tag yet releases it: the check, then the pack
committed and tagged, and a GitHub release from `CHANGELOG.md`.

## Provenance

The tooling is copied from spike-html-apps-components at 9a4392e and spike-html-apps-foundation
at 679e550. Each copied file that takes comments names its source in a provenance line; the JSON
files, which take none, carry no line.

## License

[Apache License 2.0](LICENSE).
