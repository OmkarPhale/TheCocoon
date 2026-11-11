# macOS target

Reserved for a future macOS desktop shell, native integration, and packaging metadata. No macOS application or installer is implemented here.

When starting this target, decide whether it can share a WebView-based client with the desktop targets or needs a native renderer. Keep macOS lifecycle, filesystem, controller, packaging, and signing code here; keep reusable gameplay in `src/game/`.
