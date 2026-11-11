/**
 * Desktop keyboard movement for the first exploration slice.
 *
 * This module owns movement-key state and a small character-motion model.
 * Babylon's camera remains responsible for pointer look and collision-aware
 * position updates. The physical units are deliberately game-tuned rather
 * than presented as a measured real-world simulation.
 */
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

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

const movementSpeed = 5.5;
const acceleration = 18;
const braking = 24;
const gravity = 22;
const maximumFallSpeed = 20;

export function createKeyboardMovement(
  camera: FreeCamera,
  isEnabled: () => boolean,
): (deltaMs: number) => void {
  const pressedKeys = new Set<string>();
  const horizontalVelocity = Vector3.Zero();
  let verticalVelocity = 0;

  // A downward collision is the landing signal for this camera-sized body.
  camera.onCollide = () => {
    if (verticalVelocity < 0) {
      verticalVelocity = 0;
    }
  };

  // Listen on window so keys still work after clicking the canvas. Ignore
  // movement while a modal or another blocking game state is active.
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (movementKeys.has(key) && isEnabled()) {
      pressedKeys.add(key);
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key.toLowerCase());
  });

  // Clear movement if the browser loses focus so a key cannot remain held.
  window.addEventListener("blur", () => {
    pressedKeys.clear();
    horizontalVelocity.set(0, 0, 0);
    verticalVelocity = 0;
    camera.cameraDirection.set(0, 0, 0);
  });

  return (deltaMs) => {
    if (!isEnabled()) {
      pressedKeys.clear();
      horizontalVelocity.set(0, 0, 0);
      verticalVelocity = 0;
      camera.cameraDirection.set(0, 0, 0);
      return;
    }

    // Flatten the view direction so looking up or down never changes the
    // player's height while walking.
    const forward = camera.getDirection(Vector3.Forward());
    forward.y = 0;
    forward.normalize();

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

    // Cap elapsed time so a paused tab cannot accumulate a large movement or
    // fall step. Normalizing the input keeps diagonal walking at the same pace.
    const elapsedSeconds = Math.min(deltaMs / 1000, 0.05);
    const targetVelocity =
      movement.lengthSquared() > 0
        ? movement.normalize().scale(movementSpeed)
        : Vector3.Zero();
    const velocityChange = targetVelocity.subtract(horizontalVelocity);
    const maximumChange =
      (targetVelocity.lengthSquared() > 0 ? acceleration : braking) *
      elapsedSeconds;

    if (velocityChange.length() <= maximumChange) {
      horizontalVelocity.copyFrom(targetVelocity);
    } else {
      horizontalVelocity.addInPlace(
        velocityChange.normalize().scale(maximumChange),
      );
    }

    verticalVelocity = Math.max(
      verticalVelocity - gravity * elapsedSeconds,
      -maximumFallSpeed,
    );
    camera.cameraDirection.set(
      horizontalVelocity.x * elapsedSeconds,
      verticalVelocity * elapsedSeconds,
      horizontalVelocity.z * elapsedSeconds,
    );
  };
}
