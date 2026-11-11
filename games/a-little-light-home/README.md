# A Little Light Home

A browser-first 3D exploration adventure about a new Wayfinder helping Mori, a lost cocoon spirit, find the scattered star-notes and bring the Hearthbell's light home.

The current chapter is **The Last Note**, set in Starwake Meadow. The title, characters, and story details remain open to feedback. See the [story foundation](docs/STORY.md) for the current premise.

## Quick play

From the repository root, start the **Play A Little Light Home** task in VS Code, or run:

```text
npm run play:web
```

When the server is ready, open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). The server must remain running while you play.

Choose **Begin the story**, then use **WASD** and the mouse to follow the path to Mori. Press **E** nearby to greet Mori and wake the star-lights. At that first story pause, you can optionally share a nickname and a few favorites; they stay in this browser and can be changed or forgotten with **Player keepsake**. Reaching and ringing the bell is not implemented yet.

## Game structure

- `index.html` — the game's browser page and chapter presentation.
- `platforms/web/` — this game's browser shell, keyboard input, player keepsake, and CSS.
- `src/game/` — this game's discovery rules and session state.
- `src/rendering/babylon/` — this game's procedural meadow and Babylon.js scene.
- `assets/` — art, audio, and other resources unique to this game.
- `docs/` — this game's brief, story, architecture, and progress.
- `tests/` — tests that belong to this game's behavior.

The reusable TheCocoon engine and shared workspace tools remain at the repository root. See the root [workspace guide](../../README.md) and [architecture](../../docs/ARCHITECTURE.md).

## Current limits

The prototype targets desktop browsers with keyboard and mouse. The hilltop bell and three lights are story landmarks, not a completed collection or ringing system. There is no co-op service, progression save, mobile control scheme, or production art pipeline yet. Movement has basic game-tuned acceleration, gravity, grounding, and obstacle collisions; it is not a full rigid-body simulation.
