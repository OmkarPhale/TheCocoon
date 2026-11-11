/**
 * Browser entry point for the current single-player exploration prototype.
 *
 * This module is the composition root: it connects DOM elements, the Babylon.js
 * engine, the scene, keyboard movement, and the one temporary discovery
 * interaction. Keeping these connections here makes the prototype easy to
 * trace, but it is intentionally not yet a full game/application architecture.
 * In particular, discovery is local to this browser tab; the only persisted
 * data is the optional browser-local player keepsake. There is no game server,
 * progression save, touch input, or multiplayer synchronization.
 */
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import {
  clearPlayerProfile,
  emptyPlayerProfile,
  favoriteActivities,
  favoriteColors,
  favoriteCompanions,
  loadPlayerProfile,
  normalizePlayerProfile,
  savePlayerProfile,
  type FavoriteColor,
  type PlayerProfile,
} from "./playerProfile";
import {
  createDiscoveryState,
  discoverIfInRange,
  isWithinInteractionRange,
} from "../../src/game/discovery/discovery";
import { createKeyboardMovement } from "./input/keyboardMovement";
import { createWorld } from "../../src/rendering/babylon/createWorld";
import "./style.css";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`The game page is missing the required element ${selector}.`);
  }
  return element;
}

const canvas = requireElement<HTMLCanvasElement>("#game-canvas");
const statusTitle = requireElement<HTMLElement>("#status-title");
const statusCopy = requireElement<HTMLElement>("#status-copy");
const storyEyebrow = requireElement<HTMLElement>("#story-eyebrow");
const proximityHint = requireElement<HTMLElement>("#proximity-hint");
const welcomeScreen = requireElement<HTMLElement>("#welcome-screen");
const startButton = requireElement<HTMLButtonElement>("#start-game");
const keepsakeDialog = requireElement<HTMLElement>("#keepsake-dialog");
const keepsakeForm = requireElement<HTMLFormElement>("#keepsake-form");
const keepsakeMessage = requireElement<HTMLElement>("#keepsake-message");
const nicknameInput = requireElement<HTMLInputElement>("#player-nickname");
const favoriteColorInput =
  requireElement<HTMLSelectElement>("#favorite-color");
const favoriteCompanionInput = requireElement<HTMLSelectElement>(
  "#favorite-companion",
);
const favoriteActivityInput = requireElement<HTMLSelectElement>(
  "#favorite-activity",
);
const openKeepsakeButton =
  requireElement<HTMLButtonElement>("#open-keepsake");
const skipKeepsakeButton =
  requireElement<HTMLButtonElement>("#skip-keepsake");
const clearKeepsakeButton =
  requireElement<HTMLButtonElement>("#clear-keepsake");

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
let discoveryState = createDiscoveryState();
let hasStarted = false;
let keepsakeIsOpen = false;
let hasSavedProfile = false;
let profileStorageIssue: string | null = null;
let profileReturnFocus: HTMLElement | null = null;

const savedProfile = loadPlayerProfile();
let playerProfile: PlayerProfile = emptyPlayerProfile;
if (savedProfile.ok) {
  if (savedProfile.profile) {
    playerProfile = savedProfile.profile;
    hasSavedProfile = true;
  }
} else {
  profileStorageIssue = savedProfile.message;
}

const glowColors: Record<FavoriteColor, Color3> = {
  gold: new Color3(0.95, 0.7, 0.24),
  mint: new Color3(0.35, 0.94, 0.67),
  sky: new Color3(0.35, 0.72, 1),
  violet: new Color3(0.73, 0.48, 1),
  coral: new Color3(1, 0.48, 0.39),
};

const updateMovement = createKeyboardMovement(
  world.camera,
  () => hasStarted && !keepsakeIsOpen,
);

function showDiscoveryStory(profile: PlayerProfile): void {
  statusTitle.textContent = profile.nickname
    ? `Mori is glad you're here, ${profile.nickname}.`
    : "Mori remembers the Hearthbell.";

  const personalLines: string[] = [];

  if (profile.nickname) {
    personalLines.push("Mori gives you a happy wiggle.");
  }
  const favoriteColor = profile.favoriteColor;
  if (favoriteColor) {
    personalLines.push(
      `The path glows ${favoriteColors[favoriteColor]}, just like your favorite color.`,
    );
  }
  const pathGlow = favoriteColor ? glowColors[favoriteColor] : glowColors.gold;
  world.wayfinderMaterials.forEach((material) => {
    material.emissiveColor = pathGlow;
  });
  if (profile.favoriteCompanion) {
    personalLines.push(
      `Mori is delighted to hear you love ${favoriteCompanions[profile.favoriteCompanion]}.`,
    );
  }
  if (profile.favoriteActivity) {
    personalLines.push(
      `Mori is ready to spend a day ${favoriteActivities[profile.favoriteActivity]} with you.`,
    );
  }

  personalLines.push(
    "Three star-notes are waiting up the hill. Shall we find them together?",
  );
  statusCopy.textContent = personalLines.join(" ");
}

function fillKeepsakeForm(profile: PlayerProfile): void {
  nicknameInput.value = profile.nickname;
  favoriteColorInput.value = profile.favoriteColor;
  favoriteCompanionInput.value = profile.favoriteCompanion;
  favoriteActivityInput.value = profile.favoriteActivity;
}

function openKeepsake(isFirstStoryPause = false): void {
  profileReturnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : canvas;
  fillKeepsakeForm(playerProfile);
  keepsakeMessage.textContent = profileStorageIssue ?? "";
  clearKeepsakeButton.hidden = !hasSavedProfile && !profileStorageIssue;
  skipKeepsakeButton.textContent = isFirstStoryPause
    ? "Maybe later"
    : "Close for now";
  keepsakeIsOpen = true;
  keepsakeDialog.hidden = false;
  nicknameInput.focus({ preventScroll: true });
}

function closeKeepsake(): void {
  keepsakeIsOpen = false;
  keepsakeDialog.hidden = true;
  if (discoveryState.isDiscovered) {
    showDiscoveryStory(playerProfile);
  }
  if (profileReturnFocus?.isConnected) {
    profileReturnFocus.focus({ preventScroll: true });
  }
}

function readFormProfile(): PlayerProfile | null {
  return normalizePlayerProfile({
    nickname: nicknameInput.value,
    favoriteColor: favoriteColorInput.value,
    favoriteCompanion: favoriteCompanionInput.value,
    favoriteActivity: favoriteActivityInput.value,
  });
}

// Keep the initial welcome state separate from exploration: keyboard input
// and discovery are ignored until the player chooses to begin.
startButton.addEventListener("click", () => {
  hasStarted = true;
  welcomeScreen.classList.add("is-dismissed");
  welcomeScreen.setAttribute("aria-hidden", "true");
  canvas.removeAttribute("aria-hidden");
  canvas.tabIndex = 0;
  canvas.focus({ preventScroll: true });
});

openKeepsakeButton.addEventListener("click", () => openKeepsake());
skipKeepsakeButton.addEventListener("click", closeKeepsake);

keepsakeForm.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeKeepsake();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusableControls = Array.from(
    keepsakeForm.querySelectorAll<HTMLElement>(
      'input:not(:disabled), select:not(:disabled), button:not(:disabled):not([hidden])',
    ),
  );
  const firstControl = focusableControls[0];
  const lastControl = focusableControls[focusableControls.length - 1];
  if (
    event.shiftKey &&
    firstControl &&
    document.activeElement === firstControl
  ) {
    event.preventDefault();
    lastControl?.focus();
  } else if (
    !event.shiftKey &&
    lastControl &&
    document.activeElement === lastControl
  ) {
    event.preventDefault();
    firstControl?.focus();
  }
});

keepsakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const normalizedProfile = readFormProfile();
  if (!normalizedProfile) {
    keepsakeMessage.textContent =
      "Please use a short nickname without control characters, then try again.";
    nicknameInput.focus();
    return;
  }

  playerProfile = normalizedProfile;
  if (profileStorageIssue) {
    showDiscoveryStory(playerProfile);
    keepsakeMessage.textContent =
      "Mori can use these choices for this visit, but they could not be saved. Clear the older keepsake if you want to save new choices.";
    return;
  }

  try {
    savePlayerProfile(playerProfile);
  } catch (error) {
    profileStorageIssue =
      error instanceof Error
        ? error.message
        : "This browser could not save the keepsake on this device.";
    showDiscoveryStory(playerProfile);
    keepsakeMessage.textContent = `${profileStorageIssue} Mori can use these choices for this visit.`;
    return;
  }

  hasSavedProfile = true;
  clearKeepsakeButton.hidden = false;
  keepsakeMessage.textContent = "";
  closeKeepsake();
});

clearKeepsakeButton.addEventListener("click", () => {
  try {
    clearPlayerProfile();
  } catch (error) {
    keepsakeMessage.textContent =
      error instanceof Error
        ? error.message
        : "This browser could not clear the keepsake on this device.";
    return;
  }

  playerProfile = emptyPlayerProfile;
  hasSavedProfile = false;
  profileStorageIssue = null;
  fillKeepsakeForm(playerProfile);
  showDiscoveryStory(playerProfile);
  clearKeepsakeButton.hidden = true;
  keepsakeMessage.textContent = "Saved choices have been forgotten on this device.";
  nicknameInput.focus({ preventScroll: true });
});

/**
 * The E-key interaction is intentionally local and one-shot for this
 * prototype. The distance is three-dimensional Euclidean distance between
 * the camera and Mori; there is not yet a line-of-sight test, server-side
 * validation, persistent discovery progress, or a reusable interaction system.
 */
window.addEventListener("keydown", (event) => {
  if (
    !hasStarted ||
    keepsakeIsOpen ||
    event.key.toLowerCase() !== "e"
  ) {
    return;
  }
  event.preventDefault();

  const result = discoverIfInRange(
    discoveryState,
    world.camera.position,
    world.beacon.position,
  );
  if (!result.discoveredNow) {
    return;
  }

  discoveryState = result.state;
  world.beaconMaterial.emissiveColor = new Color3(0.3, 0.24, 0.08);
  world.bellMaterial.emissiveColor = new Color3(0.85, 0.55, 0.12);
  proximityHint.hidden = true;
  storyEyebrow.textContent = "A memory returns";
  showDiscoveryStory(playerProfile);

  // The encounter is the first quiet pause in the story, so offer optional
  // personalization here unless this browser already has a keepsake.
  if (!hasSavedProfile) {
    openKeepsake(true);
  }
});

// Babylon renders continuously while the page is active. Movement is updated
// immediately before rendering so the camera and scene are drawn from the
// same frame's state. The movement module uses elapsed time, not frame count,
// to keep travel speed approximately consistent across refresh rates.
engine.runRenderLoop(() => {
  updateMovement(engine.getDeltaTime());
  if (!hasStarted || keepsakeIsOpen) {
    world.scene.render();
    return;
  }

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
