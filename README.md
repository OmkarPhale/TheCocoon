# TheCocoon

TheCocoon is a shared game-engine workspace for building multiple games. Reusable engine code, tools, platform guidance, and shared assets live at the repository root. Every game's story, rendering, interface, and other game-specific content belongs in its own folder under [`games/`](games/).

## Games

- [A Little Light Home](games/a-little-light-home/README.md) — a browser-first exploration adventure about helping Mori bring the stars home.

## Quick test launch

While the local **Play A Little Light Home** task is running in VS Code, click:

[Open A Little Light Home in your browser](http://127.0.0.1:5173/)

The link opens the game when the server is available. If it is not running, start **Play A Little Light Home** from VS Code's **Terminal → Run Task…** menu. The browser cannot start a local server by itself, so leave the task running while you play.

## Workspace structure

```text
docs/                         Shared engine and offline-development guides
games/
  a-little-light-home/        Current game's story, client, rendering, and tests
platforms/                    Shared platform integration notes and OS entry points
public/assets/                Assets reused across games
src/                          Reusable engine code only
tests/                        Tests for components shared by multiple games
package.json                  Shared tools and workspace commands
vite.config.ts                Browser build configuration for the selected game
```

### Keep game ownership clear

- Put a feature in the game folder first when it exists to serve that game's story, world, interface, or rules.
- Promote code to root [`src/`](src/README.md) only after it has a clear reusable contract and is needed by more than one game. Avoid premature abstractions.
- Put shared platform contracts and future OS-level implementations in root [`platforms/`](platforms/README.md). A game's browser UI and controls stay with that game.
- Put shared engine assets in root `public/assets/`; import game-specific art and audio from that game's `assets/` folder.
- Keep each game's story notes, architecture, and progress tracker beside the game they describe.

See [the workspace architecture](docs/ARCHITECTURE.md) for boundaries, and [the platform and offline guide](docs/PLATFORMS_AND_OFFLINE.md) for build and compatibility notes.

## Run and build

From the repository root, install the locked dependencies with `npm ci`. Start the configured browser game with `npm run dev:web` or `npm run play:web`, check all TypeScript with `npm run typecheck`, and create a production build with `npm run build:web`.

The browser build currently targets [A Little Light Home](games/a-little-light-home/). When another game is added, its build entry should be an explicit workspace command rather than moving its files into shared engine folders.

For offline development after the dependency packages have been cached on this machine, use `npm ci --offline` and then the same scripts. A first-time offline setup requires a pre-populated npm cache or an approved offline dependency bundle; the lockfile alone does not contain package files. See [the offline setup guide](docs/PLATFORMS_AND_OFFLINE.md) before preparing a disconnected machine.
