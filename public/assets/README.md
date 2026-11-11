# Shared engine assets

Store only assets reused across multiple games here, such as a shared engine mark or common runtime resource. Keep a short provenance/license note with third-party assets and use descriptive, stable filenames.

Put game-specific art, audio, and other content in that game's `assets/` folder so one game's content does not accidentally end up in another game's build. Import game assets from the game code; the root Vite setup serves this directory for intentionally shared static assets.

Asset attribution and licensing must be reviewed before a public release.
