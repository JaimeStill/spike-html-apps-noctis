# Standards

The judgement calls the check can't enforce, one line each, for the standards-reviewer. What
`mise run check` enforces is never restated here. They are the components' Design, Package, and
Code calls as far as they apply to a color profile, with the foundation's conformance rule.

The architecture pages that apply, in the architecture repository:

- `principles/minimal-footprint.md`
- `principles/rolling-currency.md`
- `principles/independent-releases.md`
- `principles/downward-dependencies.md`
- `principles/validation-first.md`

## Design

- The profile renders Noctis Hibernus in light and Noctis Obscuro in dark, each the upstream
  theme's colors as its sources give them, every value's source named beside it.
- The profile is finished on every page the foundation styles, in light and dark, and in each
  space and type profile.
- Focus stays visible, text stays legible on each surface, and every status color stays
  distinguishable from its neighbours, in both schemes.
- A visual change's session brief carries its screenshots per scheme; the architect's acceptance
  is the design review, and a passing check alone doesn't ship one.

## Conformance

- The profile must pass `check("color", "noctis")` from the foundation's `./conformance.js`. Its
  contract is `RULES.color`, and nothing more.

## Package

- The package is `@jaimestill/spike-html-apps-noctis`, one color unit: its sheet, `./noctis.css`,
  and its registration module, `./noctis.js`.
- It declares no runtime dependency, and the foundation is its one peer.
- It extends the foundation from outside, as any extension package does: it modifies nothing of
  the foundation's and uses only what the foundation exports.
- It resolves the foundation only through its release tag, as a consumer does: never a link,
  path alias, source condition, or project reference.
- `dist/` lives only in a release tag's tree, the pack, never on a branch.
- Releases are `v<version>` annotated tags cut by `release.yml` from `package.json`'s version,
  each with its `CHANGELOG.md` section, and never changed or re-cut.

## Code

- Code meets the bar of spike-html-conventions' `layers/` code at a88828a: a 2–4 line header, a
  one-line doc comment per export, and comments only for a non-obvious why.
- A copied file names its source repository and commit in a provenance line, which reads
  `From|Adapted from <repo> (<commit>): <path>`. It names the immediate source alone; that source
  keeps the earlier lines.
- The browser tier tests `dist/`, and no server transforms what it serves.
- Tests are TypeScript run under Node's type stripping, erasable syntax only, type-checked by
  tsconfig.test.json; browser-served fixtures stay .js.
- A mise task runs one script or one command, and `check` is a depends list.
