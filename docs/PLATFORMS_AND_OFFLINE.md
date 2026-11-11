# Platform structure and offline development

## Workspace ownership

The browser build and platform notes share the engine workspace, but a game's browser app is not a shared engine component. Root `platforms/` contains cross-game platform boundaries and future operating-system integration points. Browser UI, keyboard mapping, and browser persistence belong in `games/<game-slug>/platforms/web/`. Game rules, renderer setup, story, and assets stay in that game folder unless a stable component has been intentionally shared.

```text
docs/                              Shared architecture and offline guidance
games/
  a-little-light-home/
    index.html                     Selected game entry page
    docs/                          Game brief, story, architecture, progress
    platforms/web/                 Game-owned browser host, input, and UI
    src/game/                      Game-owned gameplay rules and state
    src/rendering/babylon/         Game-owned scene and renderer setup
    assets/                        Game-owned art, audio, and other resources
    tests/                         Tests for this game's behavior
platforms/
  README.md                        Shared platform ownership rules
  windows/README.md               Future Windows integration decision point
  macos/README.md                  Future macOS integration decision point
  linux/README.md                  Future Linux integration decision point
  android/README.md                Future Android integration decision point
  ios/README.md                    Future iOS integration decision point
public/assets/                     Assets deliberately shared across games
src/                               Reusable engine code only
tests/                             Tests for root reusable components only
```

## How to add a platform without tangling code

1. **Start with a delivery decision.** A browser game packaged inside a desktop or mobile WebView can reuse that game's browser UI and renderer. A native renderer or game runtime may require another adapter. Do not assume one implementation automatically works on every platform.
2. **Keep a game's behavior with that game.** Put its state transitions and rules in `games/<game-slug>/src/game/`, using plain data and deterministic functions where practical.
3. **Promote shared code deliberately.** Move a helper into root `src/` only when it has a clear, stable API and more than one game needs it. Shared code must not import one game's content, UI, or state.
4. **Keep engine and host boundaries explicit.** Renderer-specific world construction belongs with its game. Generic OS capabilities and shared platform contracts belong under root `platforms/`; browser UI and input remain in that game's `platforms/web/`.
5. **Expose only the capabilities a game needs.** When shared gameplay requires persistence, haptics, lifecycle notifications, or networking, define a narrow shared contract and implement a platform adapter. Avoid turning a game layer into a collection of OS checks.
6. **Document support with evidence.** Record the target OS/version, device class, input method, graphics requirements, build process, and tests before calling a platform supported.

Windows, macOS, and Linux desktop packaging could share a shell, while Android and iOS could share another; that is a future architecture choice, not a current dependency. Native rendering, WebView packaging, and any engine migration must be evaluated against the actual game and target devices before choosing a framework.

## Offline development

### What works without a network after setup

- Type-checking, building, and running the local Vite development server work without a runtime service or remote font provider, as long as Node.js and the project dependencies are already available.
- The current game uses local/system fonts and bundled dependencies. Keep future fonts, textures, models, audio, and other runtime assets inside the repository rather than hotlinking remote URLs.
- From the repository root, run `npm run dev:web` for the local web server, `npm run typecheck` for a type check, or `npm run build:web` for a production web build. These current web scripts target A Little Light Home.

The deployed website is **not yet an offline-installable/PWA game**. A browser normally needs to download the page and its assets from its host. A service worker, offline cache policy, and installable manifest have not been implemented.

### Dependency cache and lockfile

- `package-lock.json` records exact dependency versions and integrity information; commit it with dependency changes.
- On a connected machine, `npm ci` installs the locked versions and populates that machine's npm cache.
- On that same machine after disconnection, `npm ci --offline` can reinstall only if every required package archive is already cached.
- A new disconnected machine cannot install from the lockfile alone. Prepare an approved package/cache bundle or install dependencies while connected first; verify the offline install before travel or field work.
- Do not copy `node_modules` between operating systems or CPU architectures. Native build tools and optional package binaries can differ.
- Native platform builds also need their platform SDKs, compilers, signing assets, emulator/device runtimes, and license acceptance prepared locally. They are not included with the web dependencies.

### Offline verification checklist

1. Confirm the selected Node.js version and package manager are installed.
2. Confirm `package-lock.json` matches `package.json`.
3. Run `npm ci --offline` in a clean checkout before relying on the machine.
4. Run `npm run typecheck` and `npm run build:web`.
5. Start `npm run dev:web` and verify the current game at `http://127.0.0.1:5173`.
6. For a disconnected release candidate, test the actual packaged/hosted behavior with networking disabled. Local development-server success alone does not prove offline installation support.
