/**
 * Minimal desktop keyboard movement for the first exploration test.
 *
 * This module owns only movement-key state and translation. Babylon's camera
 * remains responsible for pointer/mouse look in the web host. The returned function is called
 * once per render frame by main.ts, which keeps input collection separate
 * from applying movement to the scene.
 *
 * There is deliberately no physics, collision, gravity, sprint, touch input,
 * rebinding UI, or network prediction yet; the camera can pass through the
 * prototype's placeholder geometry.
 */
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

// Store normalized KeyboardEvent.key values so both letter keys and arrow
// keys share the same movement logic regardless of letter-case reporting.
const movementKeys = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowleft",
  "arrowdown",
  "arrowright",
]);

// World-space movement speed in scene units per second. A physical scale has
// not been defined, so these units are a tuning value rather than meters.
const movementSpeed = 5.5;

export function createKeyboardMovement(
  camera: FreeCamera,
): (deltaMs: number) => void {
  const pressedKeys = new Set<string>();

  // Listen on window instead of the canvas so a key continues to work after
  // the user clicks the game UI. Prevent browser scrolling for movement keys,
  // especially the arrow keys.
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (movementKeys.has(key)) {
      pressedKeys.add(key);
      event.preventDefault();
    }
  });

  // Keyup may arrive after focus has moved away from the canvas. Removing the
  // key here prevents a held movement state from surviving the normal release.
  window.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key.toLowerCase());
  });

  // Browsers can lose keyup events when a tab is backgrounded or focus changes.
  // Clearing state on blur prevents the camera from continuing to walk away.
  window.addEventListener("blur", () => pressedKeys.clear());

  return (deltaMs) => {
    // Babylon cameras face local +Z by default. Transform that direction by
    // the camera orientation, then flatten it so looking up/down does not make
    // the player fly or sink while walking.
    const forward = camera.getDirection(Vector3.Forward());
    forward.y = 0;
    forward.normalize();

    // For a Y-up world, Up x Forward yields the camera-relative right vector.
    const right = Vector3.Cross(Vector3.Up(), forward).normalize();
    const movement = Vector3.Zero();

    if (pressedKeys.has("w") || pressedKeys.has("arrowup")) {
      movement.addInPlace(forward);
    }
    if (pressedKeys.has("s") || pressedKeys.has("arrowdown")) {
      movement.subtractInPlace(forward);
    }
    if (pressedKeys.has("d") || pressedKeys.has("arrowright")) {
      movement.addInPlace(right);
    }
    if (pressedKeys.has("a") || pressedKeys.has("arrowleft")) {
      movement.subtractInPlace(right);
    }

    if (movement.lengthSquared() > 0) {
      // Combining two keys must not make diagonal travel faster. The 50 ms
      // cap also avoids a large teleport if rendering pauses and later resumes
      // after a background tab or a long frame.
      const elapsedSeconds = Math.min(deltaMs / 1000, 0.05);
      camera.position.addInPlace(
        movement.normalize().scale(movementSpeed * elapsedSeconds),
      );
    }
  };
}
