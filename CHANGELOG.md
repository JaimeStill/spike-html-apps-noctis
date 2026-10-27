# Changelog

All notable changes to `@jaimestill/spike-html-apps-noctis` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-27

### Added

- The Noctis color profile, `noctis`: Noctis Hibernus in light and Noctis Obscuro in dark, from
  [Noctis](https://github.com/liviuschera/noctis) (MIT, Liviu Schera) at 4a82370. It is one unit:
  `noctis.css` declares the sixteen color tokens as light-dark() pairs in one zero-specificity
  `:where([data-palette="noctis"])` block in `foundation.tokens.color`, and `noctis.js` registers
  `noctis` under color. Its values are upstream's, its contrast recorded in its heading.
- The dependencies: the foundation as a peer at `^0.2.0`, which the repository installs by its
  release tag, `github:JaimeStill/spike-html-apps-foundation#v0.2.0`.
- The release by tag: `v<version>`, whose tree is the pack, with the tarball on its GitHub
  release.

[Unreleased]: https://github.com/JaimeStill/spike-html-apps-noctis/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/JaimeStill/spike-html-apps-noctis/releases/tag/v0.1.0
