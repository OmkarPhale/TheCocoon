# Platform integration points

The current executable target is `web/`. The other directories document intended extension points only; they do not contain native projects or indicate verified support.

## Ownership rule

- Keep reusable gameplay decisions and state transitions under `src/game/`. They must not depend on the browser, an operating system, or Babylon.js.
- Keep engine-specific scene and graphics code under `src/rendering/<engine>/`.
- Keep browser UI, browser input, browser lifecycle, and browser persistence adapters under `platforms/web/`.
- Keep native shell projects, operating-system lifecycle hooks, packaging metadata, permissions, signing configuration, and store integration in the matching OS folder.
- Do not duplicate shared game rules in a platform folder. If an OS needs a different implementation, define a small interface in shared code and implement that interface in its platform adapter.

Before adding an OS project, decide whether it will host the web build in a WebView or use a native renderer. That choice determines whether the Babylon.js browser renderer is reusable. Record the decision and test matrix in `docs/PLATFORMS_AND_OFFLINE.md`.
