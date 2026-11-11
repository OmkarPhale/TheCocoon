# Runtime architecture

> **Status:** architecture of the current browser prototype, not a claim that the project is production-ready. Dashed modules in the diagram are future work and are not present in the running application.

![A Little Light Home browser prototype architecture](architecture.svg)

## What runs today

The prototype is a single-page browser application. Its web entry point creates the Babylon.js engine and a Havok-backed scene, connects desktop movement to a capsule character controller, and coordinates a one-shot discovery transition supplied by the platform-independent game layer. The procedural storybook meadow includes static scenery colliders and three dynamic, pushable seed stones. A chapter-specific illustrated splash screen introduces the Wayfinder, Mori, Starwake Meadow, and the silent Hearthbell before the player chooses “Begin the story.” Greeting Mori wakes three star-lights along the path to the visible hilltop bell and offers one optional, non-blocking, fixed-choice question for that milestone. The separate keepsake form can ask for a nickname and playful preferences. Babylon renders the scene continuously while the browser tab is active.

| Layer | Responsibility | Current implementation |
|---|---|---|
| Browser shell | Supplies the render canvas, status text, interaction hint, and controls display. | `index.html`, `platforms/web/style.css` |
| Web composition root | Checks required DOM elements, creates runtime objects, connects systems, updates discovery UI, and starts the render loop. | `platforms/web/main.ts` |
| Web input adapter | Tracks WASD/arrow keys, Shift, and Space; computes camera-relative walk/run velocity and jumps only while supported; advances the Havok character controller with frame-scaled gravity and collision response. | `platforms/web/input/keyboardMovement.ts` |
| Browser keepsake | Validates an optional nickname, fixed-choice favorites, and milestone answers; edits or removes a versioned profile stored only in this browser. | `platforms/web/playerProfile.ts`, `platforms/web/main.ts` |
| Milestone question registry | Defines the first achievement's optional fixed-choice question and the typed answer identifiers used by the browser profile. | `src/game/progress/achievementQuestions.ts` |
| Platform-independent game rules | Owns discovery range and the one-shot discovery state transition without browser or rendering dependencies. | `src/game/discovery/discovery.ts` |
| Babylon.js world adapter | Loads Havok, creates the character controller, static scenery colliders, pushable seeds, camera, lights, placeholder environment, and beacon animation. | `src/rendering/babylon/createWorld.ts` |
| Browser renderer | Uses Babylon's engine to draw the scene to the canvas through the browser's graphics stack. | `@babylonjs/core` |

## Frame and interaction flow

1. A browser key event updates the web input adapter's set of currently pressed movement keys.
2. Each render frame, the web entry point asks the input adapter to update the capsule controller. Havok resolves support, gravity, static-scene contacts, and pushes against the dynamic seeds.
3. Before rendering, the entry point calls the platform-independent game rule to check character-to-Mori range and show the interaction hint.
4. When **E** is pressed in range, the entry point asks the game rule for a discovery state transition, then updates local story text, dims Mori, and lights the three waypoint objects and distant bell. A non-blocking question offers an optional thought for the “Mori found” achievement; the player may answer or skip it once. Saved preferences and answers personalize Mori's response, and the favorite color changes the waypoint-light color.
5. Babylon renders the updated scene and the browser presents the resulting frame.

Mori and the discovery state exist only in the current page runtime. Reloading resets the discovery and returns the star-lights to their inactive state, while the optional keepsake and milestone answer remain in browser storage. The profile button opens the keepsake for editing, and the forget action removes both preferences and milestone answers. No profile data is sent to a server or shared with other players. Storage parsing, validation, save, and clear failures are shown in the keepsake form rather than silently ignored. Version-1 keepsakes migrate in memory by adding an empty answer map; the version-2 profile is written on the next save.

## Movement and physical rules

The browser prototype uses Havok's physics-v2 character controller with a capsule-shaped player, gravity, grounded support checks, camera-relative walking, running, jumping, and collision response against the meadow, rocks, trunks, bell supports, and a shallow approach ramp. Three 2.2-mass seed stones use dynamic sphere bodies and can be pushed. Path stones and tree canopies remain decorative. These are game-tuned scene units, not calibrated real-world units; static set dressing uses simplified colliders, and the full scene is not a rigid-body simulation. Art is assembled from procedural primitive meshes, not production character or environment assets. The prototype has not been tuned or performance-tested across target devices.

## Design boundaries

- **Game rules stay platform-neutral.** `src/game` must not import browser APIs, OS APIs, or Babylon.js. Platform and rendering adapters may call these rules, but should not copy them.
- **Input is not gameplay authority.** The web adapter maps keyboard input to the Havok character controller; a future player-controller layer can replace this without making the renderer responsible for input policy.
- **The scene factory does not own the engine.** The entry point creates the engine; `createWorld` creates a scene attached to it and returns the references needed by movement and discovery.
- **Discovery is a prototype interaction, not a reusable system.** The current range check is a local three-dimensional distance check; it has no line-of-sight test, server validation, or persistence.
- **Rendering is not networking.** There is no session service, remote player, shared state, or network traffic in this build. Real-time co-op needs a separately designed session protocol and authoritative state rules.
- **A private source repository does not hide shipped browser code.** Treat browser-delivered code and assets as publicly inspectable. Do not put credentials in the client; a future service must validate important shared game-state changes on the server.

## Not yet implemented

- Online co-op, session creation/joining, remote-player replication, and authoritative validation.
- Accounts, game progression saves, analytics, moderation, or an online backend. The optional profile is browser-local and is not shared.
- Touch controls, mobile usability validation, or a supported browser/device matrix.
- Full-scene rigid-body simulation, production character art/animation, mobile controls, or terrain streaming.
- Persistent chapter progression; discovery still resets on reload even though keepsake answers persist.
- Static hosting, automated deployment, release operations, or cloud game streaming.
- Verified WebGL/WebGPU compatibility and measured performance targets.

The repository visibility and licensing decision should be revisited during release preparation, as tracked in [the game brief](GAME_BRIEF.md).

Platform folder ownership and disconnected-development setup are described in [the workspace platform guide](../../../docs/PLATFORMS_AND_OFFLINE.md). OS-specific folders are placeholders; there are no native apps or packaging workflows yet.

The current narrative beats, characters, tone, and playtesting questions are recorded in [STORY.md](STORY.md).

## Source map

- [Web application entry point](../platforms/web/main.ts)
- [Web keyboard movement](../platforms/web/input/keyboardMovement.ts)
- [Optional player keepsake](../platforms/web/playerProfile.ts)
- [Platform-independent discovery rules](../src/game/discovery/discovery.ts)
- [Babylon.js world and scene construction](../src/rendering/babylon/createWorld.ts)
- [Project progress](PROGRESS.md)
