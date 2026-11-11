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

## Planned

- [ ] Choose a temporary setting and define one concrete discovery objective.
- [ ] Define the first playable scope, including session flow and a small co-op player count.
- [ ] Confirm WebGL 2 support and the intended fallback behavior across target browsers.
- [ ] Playtest the discovery loop and refine movement, camera feel, and interaction feedback.
- [ ] Get feedback on the welcome screen, tone, and companion from children and their parents/guardians before finalizing the art direction.
- [ ] Revisit code splitting and load performance before broader release; the Babylon.js bundle is about 1.08 MB uncompressed (264 KB gzip).
- [ ] Add a minimal real-time co-op session and test solo and co-op paths.
- [ ] Gather feedback from players and prioritize the next gameplay increment.
- [ ] Revisit repository visibility and licensing during release preparation.

## Pending decisions

- [ ] Confirm game title, setting, visual direction, and discovery objective.
- [ ] Decide exact browser/device support and initial performance targets.
- [ ] Confirm engine and rendering fallback after a prototype.
- [ ] Choose multiplayer session and hosting architecture.
- [ ] Define save/account needs and any privacy or moderation requirements.
- [ ] Revisit mobile, native desktop, console, and cloud-streaming targets after browser validation.
- [ ] Select Windows/macOS/Linux desktop and Android/iOS integration strategies before adding native project files.
- [ ] Verify offline installation from a clean checkout on every machine intended for disconnected development.

## Status key

- **Completed**: implemented or explicitly decided.
- **Planned**: agreed next work, not yet implemented.
- **Pending**: needs a decision or validation before it can be scheduled confidently.
