/**
 * Platform-independent discovery rules.
 *
 * This module intentionally uses a tiny structural position type rather than
 * importing Babylon.js, browser APIs, or native platform libraries. That lets
 * the same rules run in the current web client, a future desktop/mobile host,
 * and automated tests without copying gameplay rules into each platform.
 */
export interface Position3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Current tuning value in world units. It is not a real-world measurement;
 * choose a documented world scale before designing movement or physics around
 * physical distances.
 */
export const DISCOVERY_INTERACTION_RANGE = 3.2;

/** Small state model owned by the active game session. */
export interface DiscoveryState {
  readonly isDiscovered: boolean;
}

export interface DiscoveryAttempt {
  /** New state value; the input state object is never mutated. */
  readonly state: DiscoveryState;
  /** True only on the first successful attempt within interaction range. */
  readonly discoveredNow: boolean;
}

export function createDiscoveryState(): DiscoveryState {
  return { isDiscovered: false };
}

/**
 * Checks three-dimensional Euclidean distance using squared values so this
 * per-frame proximity check does not need a square-root operation.
 */
export function isWithinInteractionRange(
  player: Position3,
  target: Position3,
  range = DISCOVERY_INTERACTION_RANGE,
): boolean {
  const deltaX = player.x - target.x;
  const deltaY = player.y - target.y;
  const deltaZ = player.z - target.z;

  return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ <= range * range;
}

/**
 * Applies the current one-shot discovery rule without mutating its input.
 * Future network code should treat this client-side result as presentation
 * only; a trusted server must independently validate shared discoveries.
 */
export function discoverIfInRange(
  state: DiscoveryState,
  player: Position3,
  target: Position3,
): DiscoveryAttempt {
  if (
    state.isDiscovered ||
    !isWithinInteractionRange(player, target)
  ) {
    return { state, discoveredNow: false };
  }

  return {
    state: { isDiscovered: true },
    discoveredNow: true,
  };
}
