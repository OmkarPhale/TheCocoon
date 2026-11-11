# TheCocoon workspace architecture

The repository is a multi-game workspace, not a game project. Its root owns the reusable engine layer, build tooling, platform integration guidance, shared assets, and tests for code that is genuinely used across games. A game's story, world, renderer setup, interface, input behavior, and game-only rules stay together under `games/<game-slug>/`.

```text
TheCocoon workspace
├── src/                         Reusable engine code, shared across games
├── platforms/                   Shared platform contracts and OS integrations
├── public/assets/               Assets shared by multiple games
├── tests/                       Tests for reusable root-level components
├── docs/                        Workspace and platform guidance
└── games/
    └── a-little-light-home/
        ├── docs/                Story, game decisions, architecture, progress
        ├── platforms/web/       This game's browser shell and input
        ├── src/game/            This game's rules and state
        ├── src/rendering/       This game's world and renderer setup
        ├── assets/              This game's art, audio, and other resources
        └── tests/               Tests for this game's behavior
```

## Ownership rules

1. **Start in the game.** New gameplay, story, interface, rendering, and content belong with the game they serve. This keeps changes easy to understand and prevents the root engine from accumulating single-game assumptions.
2. **Share deliberately.** Move code into root `src/` only when its API is stable, its purpose is independent of one game's story or content, and at least two games can use it. Keep shared components platform-neutral where practical.
3. **Keep host integrations separate.** Generic platform contracts and operating-system integrations belong under root `platforms/`. A game's browser document, browser input mapping, and player-facing UI live in that game's `platforms/web/`.
4. **Do not share game data by accident.** A title, player profile, save format, level, character, or game's asset is game-owned unless a deliberate cross-game decision says otherwise.
5. **Keep root tools explicit.** The root package, TypeScript configuration, and Vite configuration provide shared development tools. The current web commands target A Little Light Home; new games should receive explicit scripts and configs rather than moving their files into shared engine folders.
6. **Test at the owning boundary.** Put engine-component tests in root `tests/`. Put story, game-rule, and client tests in the corresponding game's `tests/` folder.

## Current game

[A Little Light Home](../games/a-little-light-home/README.md) is the only game configured for the current browser build. Its story and technical architecture are documented in its own [game brief](../games/a-little-light-home/docs/GAME_BRIEF.md), [story foundation](../games/a-little-light-home/docs/STORY.md), and [architecture guide](../games/a-little-light-home/docs/ARCHITECTURE.md).

The game is a browser-only prototype. Its optional player keepsake is local to the browser. There is no game-server traffic, cloud streaming, co-op service, or shared progression state yet.

## Grow the workspace safely

When adding another game, create a descriptive, stable slug beneath `games/` and keep its entry page, story, assets, renderer, platform host, and progress notes together. Confirm whether any new helper is truly cross-game before moving it into the root engine. This keeps the workspace useful for separate games without forcing every game into the same gameplay or rendering architecture.
