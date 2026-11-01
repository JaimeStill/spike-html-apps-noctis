// The Noctis unit's registration module, beside its sheet, noctis.css: importing it registers
// noctis under the color facet, in the foundation's registry by package name, and that is all. It
// loads no CSS: the page links the sheet.
// Adapted from spike-html-apps-foundation (679e550): src/profiles/color/primer.ts, renamed and
// importing the registry as a consumer does.
import { register } from "@jaimestill/spike-html-apps-foundation/registry.js";
register("color", "noctis");
