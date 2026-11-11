# Platform structure and offline development

## Current status

The web build is the only implemented platform. The desktop and mobile folders are onboarding notes for future work, not native apps, support claims, or choices of framework.

```text
index.html
platforms/
  README.md                 Platform boundaries and contribution rules
  web/                      Implemented browser host
    main.ts                 DOM, Babylon engine startup, UI, frame loop
    input/
      keyboardMovement.ts   Browser keyboard event adapter
    style.css               Browser presentation
  windows/README.md         Future Windows desktop decision point
  macos/README.md           Future macOS desktop decision point
  linux/README.md           Future Linux desktop decision point
  android/README.md         Future Android decision point
  ios/README.md             Future iOS decision point
src/
  game/                     Shared, platform-independent rules and state
  rendering/babylon/        Babylon.js scene implementation
public/assets/              Locally stored game assets
docs/                       Architecture, decisions, and offline instructions
```

## How to add a platform without tangling code

1. **Start with a delivery decision.** A browser game packaged inside a desktop or mobile WebView can reuse the web UI and browser renderer. A native renderer or native game runtime may require a different rendering adapter. Do not assume one implementation is automatically portable to both.
2. **Keep shared rules independent.** Add gameplay state transitions to `src/game/` using plain data and deterministic functions. Do not import `window`, DOM types, operating-system libraries, or Babylon.js into this layer.
3. **Keep engine code behind its boundary.** Babylon-specific scene construction belongs under `src/rendering/babylon/`. A different rendering engine gets a sibling adapter rather than platform-specific branches scattered through game rules.
4. **Keep host integrations local to the target.** Browser events and DOM belong in `platforms/web/`; native app lifecycle, permissions, filesystem access, and packaging belong in the matching OS folder.
5. **Expose only the capabilities the game needs.** When shared gameplay requires persistence, haptics, lifecycle notifications, or networking, define a narrow shared contract and implement a platform adapter. Avoid turning the game layer into a collection of OS checks.
6. **Document support with evidence.** Record the target OS/version, device class, input method, graphics requirements, build process, and tests before calling a platform supported.

Windows, macOS, and Linux desktop packaging could share a shell, while Android and iOS could share another; that is a future architecture choice, not a current dependency. Native rendering, WebView packaging, and any engine migration must be evaluated against the actual game and target devices before choosing a framework.

## Offline development

### What works without a network after setup

- Type-checking, building, and running the local Vite development server work without a runtime service or remote font provider, as long as Node.js and the project dependencies are already available.
- The game uses local/system fonts and bundled dependencies. Keep future fonts, textures, models, audio, and other runtime assets inside the repository rather than hotlinking remote URLs.
- Run `npm run dev:web` for the local web server, `npm run typecheck` for a type check, or `npm run build:web` for a production web build.

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
5. Start `npm run dev:web` and verify the prototype using `http://127.0.0.1:5173`.
6. For a disconnected release candidate, test the actual packaged/hosted behavior with networking disabled. Local development-server success alone does not prove offline installation support.
