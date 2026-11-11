# Progress tracker

Update this list when a milestone changes. Keep decisions and completed work evidence-based.

## Completed

- [x] Established a browser-first approach for an early feedback release.
- [x] Chose 3D exploration and discovery as the initial game direction.
- [x] Decided that both solo and real-time co-op play belong in the plan from the start.
- [x] Set the feature progression: exploration, then puzzles, collection/extraction, and survival.
- [x] Created the initial project folder structure and recorded the working brief.
- [x] Set up TypeScript, Vite, Babylon.js, dependency locking, and a production build command.
- [x] Added the browser app scaffold, Babylon.js scene, keyboard/mouse movement, and a temporary discovery interaction.
- [x] Built the app and smoke-tested browser rendering, movement, and the discovery interaction.
- [x] Added long-lived explanatory source comments and a current-state architecture illustration.
- [x] Separated browser host code, Babylon.js rendering, and platform-independent discovery rules.
- [x] Documented platform extension points and offline setup constraints.
- [x] Verified dependency installation with `npm ci --offline` using the existing local npm cache.
- [x] Recorded the repository visibility decision for review during release planning.
- [x] Added an illustrated, child-friendly welcome screen and a clear start-to-play flow.
- [x] Gave the first exploration slice a named story premise, character, destination, and visible next-step hook.
- [x] Added an optional, editable browser-only player keepsake and used its preferences in Mori's first milestone response.
- [x] Added a Havok-backed capsule character controller with camera-relative walking/running, supported jumping, gravity, scenery collisions, a gentle ramp, and three dynamic pushable seed stones.
- [x] Added a visible third-person Wayfinder, a more detailed procedural meadow, softer lighting, and shadows.
- [x] Added an optional, non-blocking question for the first major achievement; answers and skips are validated and saved in the versioned browser keepsake.
- [x] Confirmed version-1 keepsakes migrate to the current profile format without losing nickname or favorite choices.
- [x] Renamed the current game A Little Light Home and separated its story, browser client, rules, rendering, and tests from the shared TheCocoon workspace.
- [x] Added root-level ownership rules for future shared engine code, platform integrations, shared assets, and tests.

## Planned

- [ ] Playtest the Wayfinder, Mori, and Hearthbell story beat with children and their parents/guardians; revise based on what they understand and enjoy.
- [ ] Define the first playable scope, including session flow and a small co-op player count.
- [ ] Confirm WebGL 2 support and the intended fallback behavior across target browsers.
- [ ] Playtest the discovery loop and refine movement, camera feel, collision tuning, pushable-prop behavior, and interaction feedback.
- [ ] Get feedback on the welcome screen, tone, and companion from children and their parents/guardians before finalizing the art direction.
- [ ] Revisit code splitting and load performance before broader release; the Havok WebAssembly module increases the initial download.
- [ ] Add a question to each new major achievement as those story stages are implemented.
- [ ] Add a minimal real-time co-op session and test solo and co-op paths.
- [ ] Gather feedback from players and prioritize the next gameplay increment.
- [ ] Revisit repository visibility and licensing during release preparation.

## Pending decisions

- [ ] Validate the A Little Light Home title, setting, visual direction, and discovery objective with players.
- [ ] Decide exact browser/device support and initial performance targets.
- [ ] Confirm engine and rendering fallback after a prototype.
- [ ] Choose multiplayer session and hosting architecture.
- [ ] Define future account/co-op save needs and privacy or moderation requirements; current personal keepsake is optional, local-only, and not shared.
- [ ] Revisit mobile, native desktop, console, and cloud-streaming targets after browser validation.
- [ ] Measure Havok startup and frame performance on target desktop and mobile hardware; current validation covers only a local desktop browser.
- [ ] Select Windows/macOS/Linux desktop and Android/iOS integration strategies before adding native project files.
- [ ] Verify offline installation from a clean checkout on every machine intended for disconnected development.

## Status key

- **Completed**: implemented or explicitly decided.
- **Planned**: agreed next work, not yet implemented.
- **Pending**: needs a decision or validation before it can be scheduled confidently.
