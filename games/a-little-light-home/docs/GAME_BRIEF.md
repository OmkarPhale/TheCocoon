# Game brief

_Living document: revise as decisions are tested with a playable build and player feedback._

## Project intent

Develop a polished game that can reach players across platforms over time. Begin with a browser release to make playable feedback quick and accessible. TheCocoon is the engine and workspace name; **A Little Light Home** is the current game's title.

## Current decisions

| Topic | Decision |
|---|---|
| First release focus | Browser-first playable game |
| Initial game direction | 3D exploration and discovery, framed by an original gentle story |
| Working story | A Little Light Home: The Last Note — a new Wayfinder helps Mori, a lost cocoon spirit, find the scattered star-notes of the silent Hearthbell |
| Play modes | Solo and real-time co-op |
| First gameplay scope | One compact area, a visible third-person Wayfinder, a grounded physics controller, pushable props, and one discovery |
| Feature sequence | Exploration first; then puzzles, collection/extraction, and survival gradually |
| Provisional rendering stack | TypeScript + Babylon.js |
| Rendering compatibility direction | WebGL 2 baseline; WebGPU may be an optional enhancement |
| Cloud game streaming | Not in the current scope |
| Code organization | Platform-independent game rules; separate rendering and platform-host adapters |
| Offline workflow | Local browser development/build after Node.js, dependencies, and assets are available |
| Player keepsake | Optional nickname and playful preferences, saved only in this browser; no account or game-server upload |
| Current movement model | Havok capsule controller with camera-relative walking/running, supported jumping, gravity, static scenery colliders, and three dynamic pushable seeds; game-tuned prototype physics, not a full scene simulation |

## Prototype status

The first story slice opens with a chapter-specific welcome, introduces Starwake Meadow, the Wayfinder, Mori, and the silent Hearthbell, then leads to a first encounter. Greeting Mori wakes three visible star-lights along a stepping-stone route toward the hilltop bell. Mori offers one non-blocking, optional fixed-choice question for this achievement; it can be answered or skipped and will not be asked again on that browser profile. Separately, the player can optionally save a nickname, favorite color, meadow friend, and activity. Choices remain in this browser, can be changed or forgotten from the player keepsake button, and personalize Mori's response and the path-light color. Reaching the bell, finding the notes, and ringing it remain future work. The environment and character are still procedural placeholder art, and need art-direction and player feedback. Play remains solo-only; real-time co-op is still planned.

## Design principles

- Keep the first playable build small enough to test early.
- Make the discovery loop work for a solo player and remain enjoyable in co-op.
- Add features in measured steps; use player feedback to guide expansion.
- Keep personal questions optional and playful; do not request contact details, account data, or sensitive information from young players.
- Ask one optional, story-themed question at each major achievement; never make a response required for continued play.
- Make movement feel grounded and consistent with a real physics middleware while keeping the stylized fiction clearly separate from calibrated real-world simulation.
- Keep platform-specific capabilities behind the engine and browser APIs where practical.
- Treat desktop browsers as the initial development target; evaluate mobile browser support as a separate compatibility and usability check.

## Open decisions

These are intentionally unresolved; do not treat the provisional direction as a final technical commitment.

- Whether playtesting confirms the A Little Light Home title, character designs, and visual direction.
- Whether playtesting confirms the story premise, reading level, and first-chapter objective.
- Whether the first question's timing, answer choices, and non-blocking presentation feel comfortable to children.
- Intended player count and how players join a co-op session.
- Browser/device support matrix and performance targets.
- Whether Babylon.js remains the best fit after a minimal rendering prototype.
- Whether desktop/mobile apps should use a WebView shell or a separate native rendering/runtime approach.
- Multiplayer architecture, hosting provider, and server authority model.
- Future save/account needs, co-op profile sharing, privacy, and moderation requirements. The current prototype intentionally uses browser-only keepsake storage with no account or server sync.
- Whether and when to pursue native mobile, desktop, console, or cloud-streaming releases.

## Technical notes

Real-time co-op requires online session coordination and synchronization, even when the game is browser-based. The first implementation should keep that scope small and avoid committing to a backend provider until player count, session flow, and game-state needs are clearer.

WebGPU is an enhancement target, not a requirement for the initial build. Validate the chosen engine's browser support and fallback behavior during setup rather than assuming every device supports the same graphics features.

Keep the source repository private during development by default. Revisit repository visibility, licensing, shipped client code, and server-side secret handling during the release phase. Browser-delivered code and assets should be treated as publicly inspectable even when the repository is private.
