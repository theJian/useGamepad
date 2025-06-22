type GamepadButtonKey = `button${number}`;
type GamepadAxisKey = `axis${number}`;

export interface GamepadInfo {
  connected: boolean;
  id?: string;
  index?: number;
  [key: GamepadButtonKey]: boolean | undefined;
  [key: GamepadAxisKey]: number | undefined;
}

/**
 * React hook to access gamepad information.
 * @param index - The index of the gamepad (default: 0).
 * @returns GamepadInfo with button and axis keys.
 */
export function useGamepad(index?: number): GamepadInfo;
