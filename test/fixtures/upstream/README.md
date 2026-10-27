# Upstream themes

`hibernus.json` and `obscuro.json` are Noctis's `themes/hibernus.json` and `themes/obscuro.json`,
byte for byte, from https://github.com/liviuschera/noctis at commit
4a82370b2c064e36726c23e94f27ed3782bd6ecd (MIT, Copyright (c) 2018 Liviu Schera). The browser tier
reads them to pin `src/noctis.css`'s values to their swatches; Prettier leaves them as upstream
wrote them. `LICENSE.md` is upstream's, at the same commit, which the copies carry. Each was
fetched as:

```
gh api 'repos/liviuschera/noctis/contents/themes/hibernus.json?ref=4a82370b2c064e36726c23e94f27ed3782bd6ecd' -q .content | base64 -d
```
