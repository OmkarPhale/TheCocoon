# Games

Every game in TheCocoon gets its own folder and owns its story, rules, renderer setup, interface, assets, and progress notes. Use a short, descriptive, stable, lowercase slug.

## Current game

- [A Little Light Home](a-little-light-home/README.md) — a gentle browser-first exploration game set in Starwake Meadow.

## Suggested game layout

```text
<game-slug>/
  README.md
  index.html               Browser entry page, when the game has a web build
  docs/                    Story, game brief, architecture, progress
  assets/                  Art, audio, and other game-only content
  platforms/web/            Browser host, input, and interface
  src/game/                 Game-owned rules and state
  src/rendering/<engine>/   Game-owned scene and renderer setup
  tests/                    Tests specific to this game
```

Do not copy root package/build configuration into a game without a reason. The root workspace owns shared tools; add an explicit per-game command or config when more than one game needs a separate build.
