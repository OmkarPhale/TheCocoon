import {
  achievementQuestions,
  type AchievementAnswerId,
  type AchievementId,
} from "../../src/game/progress/achievementQuestions";

/**
 * Optional, child-friendly preferences for personalizing Mori's dialogue.
 *
 * This profile is deliberately stored in this browser only. It is not sent to
 * a game server, attached to an account, or used for advertising or analytics.
 */
export const favoriteColors = {
  gold: "sunny gold",
  mint: "meadow mint",
  sky: "sky blue",
  violet: "berry violet",
  coral: "coral pink",
} as const;

export const favoriteCompanions = {
  firefly: "fireflies",
  moth: "moths",
  rabbit: "rabbits",
  bird: "little birds",
} as const;

export const favoriteActivities = {
  stargazing: "watching the stars",
  exploring: "exploring new places",
  helping: "helping friends",
  collecting: "finding little treasures",
} as const;

export type FavoriteColor = keyof typeof favoriteColors;
export type FavoriteCompanion = keyof typeof favoriteCompanions;
export type FavoriteActivity = keyof typeof favoriteActivities;

export interface PlayerProfile {
  nickname: string;
  favoriteColor: FavoriteColor | "";
  favoriteCompanion: FavoriteCompanion | "";
  favoriteActivity: FavoriteActivity | "";
  milestoneAnswers: Partial<
    Record<AchievementId, AchievementAnswerId | "skipped">
  >;
}

export interface PlayerProfileDraft {
  nickname: string;
  favoriteColor: string;
  favoriteCompanion: string;
  favoriteActivity: string;
  milestoneAnswers?: PlayerProfile["milestoneAnswers"];
}

export type ProfileLoadResult =
  | { ok: true; profile: PlayerProfile | null }
  | { ok: false; message: string };

const storageKey = "thecocoon.player-keepsake";
const storageFormat = "thecocoon.player-keepsake";
const storageVersion = 2;

export const emptyPlayerProfile: PlayerProfile = {
  nickname: "",
  favoriteColor: "",
  favoriteCompanion: "",
  favoriteActivity: "",
  milestoneAnswers: {},
};

function isMilestoneAnswers(
  value: unknown,
): value is PlayerProfile["milestoneAnswers"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value);
  return entries.every(([achievementId, answerId]) => {
    const question = achievementQuestions.find(
      (item) => item.id === achievementId,
    );
    return (
      question !== undefined &&
      (answerId === "skipped" ||
        question.answers.some((answer) => answer.id === answerId))
    );
  });
}

function isOneOf<T extends string>(
  value: unknown,
  choices: Record<string, string>,
): value is T {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(choices, value)
  );
}

function isPlayerProfile(value: unknown): value is PlayerProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    Object.keys(profile).length === 5 &&
    "nickname" in profile &&
    "favoriteColor" in profile &&
    "favoriteCompanion" in profile &&
    "favoriteActivity" in profile &&
    "milestoneAnswers" in profile &&
    typeof profile.nickname === "string" &&
    Array.from(profile.nickname).length <= 16 &&
    !/[\u0000-\u001f\u007f]/u.test(profile.nickname) &&
    (profile.favoriteColor === "" ||
      isOneOf<FavoriteColor>(profile.favoriteColor, favoriteColors)) &&
    (profile.favoriteCompanion === "" ||
      isOneOf<FavoriteCompanion>(
        profile.favoriteCompanion,
        favoriteCompanions,
      )) &&
    (profile.favoriteActivity === "" ||
      isOneOf<FavoriteActivity>(profile.favoriteActivity, favoriteActivities)) &&
    isMilestoneAnswers(profile.milestoneAnswers)
  );
}

function isLegacyPlayerProfile(value: unknown): value is Omit<
  PlayerProfile,
  "milestoneAnswers"
> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    Object.keys(profile).length === 4 &&
    "nickname" in profile &&
    "favoriteColor" in profile &&
    "favoriteCompanion" in profile &&
    "favoriteActivity" in profile &&
    typeof profile.nickname === "string" &&
    Array.from(profile.nickname).length <= 16 &&
    !/[\u0000-\u001f\u007f]/u.test(profile.nickname) &&
    (profile.favoriteColor === "" ||
      isOneOf<FavoriteColor>(profile.favoriteColor, favoriteColors)) &&
    (profile.favoriteCompanion === "" ||
      isOneOf<FavoriteCompanion>(
        profile.favoriteCompanion,
        favoriteCompanions,
      )) &&
    (profile.favoriteActivity === "" ||
      isOneOf<FavoriteActivity>(profile.favoriteActivity, favoriteActivities))
  );
}

export function normalizePlayerProfile(
  profile: PlayerProfileDraft,
): PlayerProfile | null {
  const normalized = {
    nickname: profile.nickname.trim().replace(/\s+/gu, " "),
    favoriteColor: profile.favoriteColor,
    favoriteCompanion: profile.favoriteCompanion,
    favoriteActivity: profile.favoriteActivity,
    milestoneAnswers: profile.milestoneAnswers ?? {},
  };
  if (!isPlayerProfile(normalized)) {
    return null;
  }
  return normalized;
}

export function loadPlayerProfile(): ProfileLoadResult {
  let serialized: string | null;
  try {
    serialized = window.localStorage.getItem(storageKey);
  } catch {
    return {
      ok: false,
      message: "This browser could not open saved keepsake details.",
    };
  }

  if (serialized === null) {
    return { ok: true, profile: null };
  }

  let saved: unknown;
  try {
    saved = JSON.parse(serialized);
  } catch {
    return {
      ok: false,
      message:
        "Saved keepsake details could not be read. Clear them on this device before saving new choices.",
    };
  }

  if (
    !saved ||
    typeof saved !== "object" ||
    !("format" in saved) ||
    !("version" in saved) ||
    !("profile" in saved) ||
    saved.format !== storageFormat
  ) {
    return {
      ok: false,
      message:
        "Saved keepsake details are from an unrecognized format. Clear them on this device before saving new choices.",
    };
  }

  if (saved.version === 1 && isLegacyPlayerProfile(saved.profile)) {
    return {
      ok: true,
      profile: { ...saved.profile, milestoneAnswers: {} },
    };
  }

  if (saved.version !== storageVersion || !isPlayerProfile(saved.profile)) {
    return {
      ok: false,
      message:
        "Saved keepsake details are from an unrecognized format. Clear them on this device before saving new choices.",
    };
  }

  return { ok: true, profile: saved.profile };
}

export function savePlayerProfile(profile: PlayerProfile): void {
  const normalized = normalizePlayerProfile(profile);
  if (!normalized) {
    throw new Error("Please check the nickname and try again.");
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        format: storageFormat,
        version: storageVersion,
        profile: normalized,
      }),
    );
  } catch {
    throw new Error("This browser could not save the keepsake on this device.");
  }
}

export function clearPlayerProfile(): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    throw new Error("This browser could not clear the keepsake on this device.");
  }
}
