# Windows target

Reserved for a future Windows desktop shell, native integration, and packaging metadata. No Windows application or installer is implemented here.

When starting this target, decide between a browser-hosted shell and a native renderer before adding dependencies. Keep Windows lifecycle, filesystem, controller, packaging, and signing code here. Game-specific rules stay under `games/<game-slug>/src/game/`; only genuinely shared engine code belongs in root `src/`.
