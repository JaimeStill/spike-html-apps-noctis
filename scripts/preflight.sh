#!/usr/bin/env bash
# Fails naming mise run install when a tool a task needs is missing: the node_modules tooling, the
# foundation at its tag, which the build and the browser tier read, and with `browser`, the pinned
# chrome-headless-shell.
# Adapted from spike-html-apps-components (9a4392e): scripts/preflight.sh, with no lit.
set -euo pipefail

fail() {
  echo "preflight: $1 isn't installed; run mise run install" >&2
  exit 1
}

for bin in eslint prettier; do
  [[ -x node_modules/.bin/$bin ]] || fail "$bin (devDependencies)"
done
# The foundation is a peer, which the repository's devDependency installs at its tag.
[[ -f node_modules/@jaimestill/spike-html-apps-foundation/package.json ]] ||
  fail "@jaimestill/spike-html-apps-foundation (devDependencies)"

[[ "${1:-}" == browser ]] || exit 0
shell=$(mise which chrome-headless-shell 2>/dev/null) || fail "chrome-headless-shell"
# mise caches downloads by checksum: a version bumped without its sha256 installs the old build.
pin=$(mise current http:chrome-headless-shell)
if [[ "$("$shell" --version)" != *" $pin" ]]; then
  echo "preflight: $shell isn't chrome-headless-shell $pin; give the pin its own sha256" >&2
  exit 1
fi
