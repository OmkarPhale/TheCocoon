/**
 * Browser entry point for the current single-player exploration prototype.
 *
 * This module is the composition root: it connects DOM elements, the Babylon.js
 * engine, the scene, keyboard movement, and the first story milestone.
 * Keeping these connections here makes the prototype easy to trace, but it is
 * intentionally not yet a full game/application architecture. Discovery is
 * local to this browser tab; only the optional browser-local player keepsake
 * and its milestone answer are persisted. There is no game server, chapter
 * progression save, touch input, or multiplayer synchronization.
 */
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import {
  getAchievementAnswerLabel,
  getAchievementQuestion,
  type AchievementAnswerId,
  type AchievementId,
} from "../../src/game/progress/achievementQuestions";
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
import type { GameWorld } from "../../src/rendering/babylon/createWorld";
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
const startupMessage = requireElement<HTMLElement>("#startup-message");
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
const achievementDialog =
  requireElement<HTMLElement>("#achievement-dialog");
const achievementForm =
  requireElement<HTMLFormElement>("#achievement-form");
const achievementEyebrow =
  requireElement<HTMLElement>("#achievement-eyebrow");
const achievementTitle =
  requireElement<HTMLElement>("#achievement-title");
const achievementQuestion =
  requireElement<HTMLElement>("#achievement-question");
const achievementOptions =
  requireElement<HTMLElement>("#achievement-options");
const achievementMessage =
  requireElement<HTMLElement>("#achievement-message");
const saveAchievementButton =
  requireElement<HTMLButtonElement>("#save-achievement");
const skipAchievementButton =
  requireElement<HTMLButtonElement>("#skip-achievement");

// The engine owns the WebGL rendering context associated with this canvas.
// Device-pixel-ratio adaptation keeps the image crisp on high-density screens;
// the corresponding GPU cost still needs measurement on target devices.
const engine = new Engine(canvas, true, {
  stencil: true,
  adaptToDeviceRatio: true,
});

let world: GameWorld | null = null;
let updateMovement: (deltaMs: number) => void = () => {};
let discoveryState = createDiscoveryState();
let hasStarted = false;
let keepsakeIsOpen = false;
let achievementQuestionIsOpen = false;
let pendingAchievement: AchievementId | null = null;
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
  if (world) {
    const pathGlow = favoriteColor
      ? glowColors[favoriteColor]
      : glowColors.gold;
    world.wayfinderMaterials.forEach((material) => {
      material.emissiveColor = pathGlow;
    });
    if (discoveryState.isDiscovered) {
      world.wayfinderLights.forEach((light) => {
        light.diffuse = pathGlow;
        light.intensity = 0.72;
      });
    }
  }
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
  const firstAchievementAnswer = profile.milestoneAnswers["mori-found"];
  if (firstAchievementAnswer && firstAchievementAnswer !== "skipped") {
    const answer = getAchievementAnswerLabel(
      "mori-found",
      firstAchievementAnswer,
    );
    if (answer) {
      personalLines.push(`Mori remembers you wanted to ${answer.toLowerCase()}.`);
    }
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

function openKeepsake(): void {
  if (keepsakeIsOpen) {
    return;
  }
  profileReturnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : canvas;
  fillKeepsakeForm(playerProfile);
  keepsakeMessage.textContent = profileStorageIssue ?? "";
  clearKeepsakeButton.hidden = !hasSavedProfile && !profileStorageIssue;
  skipKeepsakeButton.textContent = "Close for now";
  keepsakeIsOpen = true;
  keepsakeDialog.hidden = false;
  if (achievementQuestionIsOpen) {
    achievementDialog.hidden = true;
  }
  nicknameInput.focus({ preventScroll: true });
}

function closeKeepsake(): void {
  keepsakeIsOpen = false;
  keepsakeDialog.hidden = true;
  if (achievementQuestionIsOpen) {
    achievementDialog.hidden = false;
  }
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
    milestoneAnswers: playerProfile.milestoneAnswers,
  });
}

function openAchievementPrompt(achievementId: AchievementId): void {
  if (
    Object.prototype.hasOwnProperty.call(
      playerProfile.milestoneAnswers,
      achievementId,
    )
  ) {
    return;
  }

  const question = getAchievementQuestion(achievementId);
  pendingAchievement = achievementId;
  achievementEyebrow.textContent = question.eyebrow;
  achievementTitle.textContent = question.title;
  achievementQuestion.textContent = question.question;
  achievementMessage.textContent = "";
  achievementOptions.replaceChildren();

  for (const [index, answer] of question.answers.entries()) {
    const label = document.createElement("label");
    label.className = "achievement-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "achievement-answer";
    input.value = answer.id;
    input.id = `achievement-answer-${index}`;
    const text = document.createElement("span");
    text.textContent = answer.label;
    label.htmlFor = input.id;
    label.append(input, text);
    achievementOptions.append(label);
  }

  achievementQuestionIsOpen = true;
  achievementDialog.hidden = false;
  achievementOptions.querySelector<HTMLInputElement>("input")?.focus({
    preventScroll: true,
  });
}

function saveAchievementAnswer(
  answerId: AchievementAnswerId | "skipped",
): string | null {
  if (!pendingAchievement) {
    return "Mori is ready to continue whenever you are.";
  }

  const updatedProfile = normalizePlayerProfile({
    ...playerProfile,
    milestoneAnswers: {
      ...playerProfile.milestoneAnswers,
      [pendingAchievement]: answerId,
    },
  });
  if (!updatedProfile) {
    return "Mori can keep your answer for this visit, but it could not be checked.";
  }

  playerProfile = updatedProfile;
  if (profileStorageIssue) {
    return "Mori can remember for this visit, but this browser could not save the choice. A grown-up can check the player keepsake.";
  }

  try {
    savePlayerProfile(playerProfile);
  } catch (error) {
    profileStorageIssue =
      error instanceof Error
        ? error.message
        : "This browser could not save the keepsake on this device.";
    return "Mori can remember for this visit, but this browser could not save the choice. A grown-up can check the player keepsake.";
  }

  hasSavedProfile = true;
  clearKeepsakeButton.hidden = false;
  return null;
}

function closeAchievementPrompt(
  answerId: AchievementAnswerId | "skipped",
): void {
  const completedAchievement = pendingAchievement;
  const storageMessage = saveAchievementAnswer(answerId);
  pendingAchievement = null;
  achievementQuestionIsOpen = false;
  achievementDialog.hidden = true;

  if (completedAchievement === "mori-found" && answerId !== "skipped") {
    const answer = getAchievementAnswerLabel(completedAchievement, answerId);
    if (answer) {
      statusTitle.textContent = playerProfile.nickname
        ? `Mori is glad you chose that, ${playerProfile.nickname}.`
        : "Mori is glad you chose that.";
      statusCopy.textContent = `Mori smiles. "Let's ${answer.toLowerCase()}." Three star-notes are still waiting up the hill.`;
    }
  } else {
    showDiscoveryStory(playerProfile);
  }

  if (storageMessage) {
    statusCopy.textContent = `${statusCopy.textContent} ${storageMessage}`;
  }
  canvas.focus({ preventScroll: true });
}

function keepFocusInsideDialog(
  event: KeyboardEvent,
  dialog: HTMLElement,
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeKeepsake();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusableControls = Array.from(
    dialog.querySelectorAll<HTMLElement>(
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
  keepFocusInsideDialog(event, keepsakeForm);
});

skipAchievementButton.addEventListener("click", () => {
  closeAchievementPrompt("skipped");
});

achievementForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedAnswer =
    achievementOptions.querySelector<HTMLInputElement>(
      'input[name="achievement-answer"]:checked',
    );
  const validAnswer = pendingAchievement
    ? getAchievementQuestion(pendingAchievement).answers.find(
        (answer) => answer.id === selectedAnswer?.value,
      )
    : undefined;

  if (!validAnswer) {
    achievementMessage.textContent =
      "Choose the thought you like, or maybe another time.";
    skipAchievementButton.focus();
    return;
  }

  closeAchievementPrompt(validAnswer.id);
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
 * The E-key interaction is local and one-shot for this story slice. The
 * distance is three-dimensional Euclidean distance between the character and
 * Mori; there is no server-side validation or saved chapter completion.
 */
window.addEventListener("keydown", (event) => {
  if (
    !hasStarted ||
    keepsakeIsOpen ||
    achievementQuestionIsOpen ||
    event.key.toLowerCase() !== "e"
  ) {
    return;
  }
  event.preventDefault();

  if (!world) {
    return;
  }
  const result = discoverIfInRange(
    discoveryState,
    world.player.position,
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
  // personalization at the end of the achievement, even for returning players.
  openAchievementPrompt("mori-found");
});

async function startGameEngine(): Promise<void> {
  try {
    world = await createWorld(engine, canvas);
    updateMovement = createKeyboardMovement(
      world.characterController,
      world.camera,
      world.player,
      () =>
        hasStarted && !keepsakeIsOpen,
    );
    startButton.disabled = false;
    startButton.textContent = "Begin the story";

    // Physics and player motion use elapsed time rather than frame count.
    engine.runRenderLoop(() => {
      if (!world) {
        return;
      }

      updateMovement(engine.getDeltaTime());
      if (!hasStarted || keepsakeIsOpen) {
        world.scene.render();
        return;
      }

      if (!discoveryState.isDiscovered) {
        proximityHint.hidden = !isWithinInteractionRange(
          world.player.position,
          world.beacon.position,
        );
      }

      world.scene.render();
    });
  } catch (error) {
    console.error("Could not initialize the game world.", error);
    startupMessage.textContent =
      "The meadow could not open this time. Please reload the game or ask a grown-up for help.";
    startButton.textContent = "The meadow needs a little help";
  }
}

void startGameEngine();

// Canvas dimensions must follow the viewport because the render surface is
// sized independently of CSS. The engine recalculates its render buffers.
window.addEventListener("resize", () => engine.resize());
