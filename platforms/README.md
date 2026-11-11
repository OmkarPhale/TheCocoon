# Shared platform integration points

The current executable browser game is configured under `games/a-little-light-home/platforms/web/`. The root `platforms/` folder contains shared integration rules and future OS extension points; the OS folders do not contain native projects or indicate verified support.

## Ownership rule

- Keep a game's gameplay decisions and state transitions under `games/<game-slug>/src/game/`. Move a component to root `src/` only when it has a clear reusable contract and multiple games need it.
- Keep a game's engine-specific scene and graphics code under `games/<game-slug>/src/rendering/<engine>/`.
- Keep browser UI, browser input, browser lifecycle, and browser persistence adapters with the game under `games/<game-slug>/platforms/web/`.
- Keep reusable cross-game platform contracts and generic operating-system integrations under this root `platforms/` folder.
- Keep native shell projects, operating-system lifecycle hooks, packaging metadata, permissions, signing configuration, and store integration in the matching OS folder.
- Do not duplicate shared game rules in a platform folder. If an OS needs a different implementation, define a small interface in shared code and implement that interface in its platform adapter.

Before adding an OS project, decide whether it will host a game's web build in a WebView or use a native renderer. That choice determines whether the game's browser renderer is reusable. Record the decision and test matrix in [`docs/PLATFORMS_AND_OFFLINE.md`](../docs/PLATFORMS_AND_OFFLINE.md).
