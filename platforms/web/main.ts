/**
 * Browser entry point for the current single-player exploration prototype.
 *
 * This module is the composition root: it connects DOM elements, the Babylon.js
 * engine, the scene, keyboard movement, and the one temporary discovery
 * interaction. Keeping these connections here makes the prototype easy to
 * trace, but it is intentionally not yet a full game/application architecture.
 * In particular, discovery state is local to this browser tab and there is no
 * server, persistence, touch input, or multiplayer synchronization.
 */
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import {
  createDiscoveryState,
  discoverIfInRange,
  isWithinInteractionRange,
} from "../../src/game/discovery/discovery";
import { createKeyboardMovement } from "./input/keyboardMovement";
import { createWorld } from "../../src/rendering/babylon/createWorld";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const statusTitle = document.querySelector<HTMLElement>("#status-title");
const statusCopy = document.querySelector<HTMLElement>("#status-copy");
const proximityHint = document.querySelector<HTMLElement>("#proximity-hint");

// Fail loudly during startup if the HTML and application code drift apart.
// Continuing with a missing element would produce a broken or partially
// interactive game screen and make the original cause harder to diagnose.
if (!canvas || !statusTitle || !statusCopy || !proximityHint) {
  throw new Error("The game page is missing required interface elements.");
}

// The engine owns the WebGL rendering context associated with this canvas.
// Device-pixel-ratio adaptation keeps the image crisp on high-density screens;
// the corresponding GPU cost still needs measurement on target devices.
const engine = new Engine(canvas, true, {
  stencil: true,
  adaptToDeviceRatio: true,
});

// Scene construction and input registration are separated into modules so
// rendering setup and movement rules can be understood independently.
const world = createWorld(engine, canvas);
const updateMovement = createKeyboardMovement(world.camera);
let discoveryState = createDiscoveryState();

/**
 * The E-key interaction is intentionally local and one-shot for this
 * prototype. The distance is three-dimensional Euclidean distance between
 * the camera and beacon; there is not yet a line-of-sight test, server-side
 * validation, persistence, or a reusable interaction system.
 */
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "e") {
    return;
  }

  const result = discoverIfInRange(
    discoveryState,
    world.camera.position,
    world.beacon.position,
  );
  if (!result.discoveredNow) {
    return;
  }

  discoveryState = result.state;
  world.beaconMaterial.emissiveColor = new Color3(0.2, 0.38, 0.3);
  proximityHint.hidden = true;
  statusTitle.textContent = "Signal found.";
  statusCopy.textContent =
    "You uncovered the first trace. More of this world remains unknown.";
});

// Babylon renders continuously while the page is active. Movement is updated
// immediately before rendering so the camera and scene are drawn from the
// same frame's state. The movement module uses elapsed time, not frame count,
// to keep travel speed approximately consistent across refresh rates.
engine.runRenderLoop(() => {
  updateMovement(engine.getDeltaTime());

  // The prompt is presentation derived from current world state; discovery
  // itself is changed only by the interaction handler above.
  if (!discoveryState.isDiscovered) {
    proximityHint.hidden = !isWithinInteractionRange(
      world.camera.position,
      world.beacon.position,
    );
  }

  world.scene.render();
});

// Canvas dimensions must follow the viewport because the render surface is
// sized independently of CSS. The engine recalculates its render buffers.
window.addEventListener("resize", () => engine.resize());
