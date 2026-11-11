# Shared engine code

Only put code here when it has a clear, stable contract that is independent of any one game's story, world, interface, or save data, and more than one game needs it.

Start new gameplay and renderer code inside the owning game. Promote a component here when actual reuse justifies it; do not create abstractions simply because another game may exist someday.

Root `tests/` is for components owned here. Game-specific behavior and its tests stay in `games/<game-slug>/`.
