/**
 * Keyboard-to-character adapter for the browser game.
 *
 * Havok resolves the capsule against the static world and applies character
 * contact forces to the few small objects designed to be pushed. This module
 * supplies the desired walking velocity; it does not pretend the game is a
 * full physical simulation of every object in the meadow.
 */
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import {
  CharacterSupportedState,
  PhysicsCharacterController,
} from "@babylonjs/core/Physics/v2/characterController";
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
  "shift",
]);

const walkSpeed = 4.7;
const runSpeed = 7;
const gravity = new Vector3(0, -9.81, 0);
const jumpSpeed = 5.3;

export function createKeyboardMovement(
  controller: PhysicsCharacterController,
  camera: ArcRotateCamera,
  player: TransformNode,
  isEnabled: () => boolean,
): (deltaMs: number) => void {
  const pressedKeys = new Set<string>();
  const up = Vector3.Up();
  const down = new Vector3(0, -1, 0);
  let jumpQueued = false;
  let cameraForward = new Vector3(0, 0, 1);
  let cameraRight = new Vector3(1, 0, 0);
  const desiredDirection = Vector3.Zero();

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (movementKeys.has(key) && isEnabled()) {
      pressedKeys.add(key);
      event.preventDefault();
    }

    if (event.code === "Space" && isEnabled()) {
      jumpQueued = true;
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key.toLowerCase());
  });

  window.addEventListener("blur", () => {
    pressedKeys.clear();
    jumpQueued = false;
  });

  return (deltaMs) => {
    if (!isEnabled()) {
      pressedKeys.clear();
      jumpQueued = false;
    }

    // ArcRotateCamera.alpha gives a stable horizontal heading even while the
    // player looks up or down. The camera orbit therefore never tilts movement.
    cameraForward.set(-Math.cos(camera.alpha), 0, -Math.sin(camera.alpha));
    cameraForward.normalize();
    Vector3.CrossToRef(up, cameraForward, cameraRight);
    cameraRight.normalize();

    desiredDirection.set(0, 0, 0);
    if (pressedKeys.has("w") || pressedKeys.has("arrowup")) {
      desiredDirection.addInPlace(cameraForward);
    }
    if (pressedKeys.has("s") || pressedKeys.has("arrowdown")) {
      desiredDirection.subtractInPlace(cameraForward);
    }
    if (pressedKeys.has("d") || pressedKeys.has("arrowright")) {
      desiredDirection.addInPlace(cameraRight);
    }
    if (pressedKeys.has("a") || pressedKeys.has("arrowleft")) {
      desiredDirection.subtractInPlace(cameraRight);
    }

    const deltaSeconds = Math.min(deltaMs / 1000, 1 / 30);
    const support = controller.checkSupport(deltaSeconds, down);
    const currentVelocity = controller.getVelocity();

    if (
      jumpQueued &&
      support.supportedState === CharacterSupportedState.SUPPORTED
    ) {
      currentVelocity.y = jumpSpeed;
    }
    jumpQueued = false;

    const hasInput = desiredDirection.lengthSquared() > 0;
    if (hasInput) {
      desiredDirection.normalize();
      player.rotation.y = Math.atan2(desiredDirection.x, desiredDirection.z);
    }

    const speed = pressedKeys.has("shift") ? runSpeed : walkSpeed;
    const desiredVelocity = new Vector3(
      hasInput ? desiredDirection.x * speed : 0,
      currentVelocity.y,
      hasInput ? desiredDirection.z * speed : 0,
    );
    const movementVelocity = controller.calculateMovement(
      deltaSeconds,
      cameraForward,
      support.averageSurfaceNormal,
      currentVelocity,
      support.averageSurfaceVelocity,
      desiredVelocity,
      up,
    );

    controller.setVelocity(movementVelocity);
    controller.integrate(deltaSeconds, support, gravity);
    player.position.copyFrom(controller.getPosition());
  };
}
