import { useCallback, useSyncExternalStore } from "react";

const AXIS_MOVEMENT_THRESHOLD = 0.2; // Threshold for axis movement to be considered active

/**
 * @typedef {Object} GamepadInfo
 * @property {boolean} connected
 * @property {boolean} [button0]
 * @property {boolean} [button1]
 * @property {boolean} [buttonN]
 * @property {number} [axis0]
 * @property {number} [axis1]
 * @property {number} [axisN]
 */

/**
 * Custom hook to access gamepad information.
 * @param {number} [index=0] - The index of the gamepad to access.
 * @return {GamepadInfo} The gamepad information for the specified index.
 * @example
 * const gamepad = useGamepad(0);
 * console.log(gamepad.connected); // true or false
 * console.log(gamepad.button0); // true or false
 */
export function useGamepad(index = 0) {
  return useSyncExternalStore(
    useCallback((callback) => subscribe(index, callback), [index]),
    () => gamepads[index] || defaultGamepadInfo,
  );
}

/** @type {GamepadInfo{}} **/
let gamepads = {};

/** @type {GamepadInfo} **/
const defaultGamepadInfo = {
  connected: false,
};

function subscribe(index, callback) {
  function onConnect(e) {
    const gamepad = e.gamepad || e.detail.gamepad;
    if (gamepad.index !== index) return;

    if (!loopStarted) {
      loopStarted = true;
      loop();
    }

    callback();
  }

  function onDisconnect(e) {
    const gamepad = e.gamepad || e.detail.gamepad;
    delete gamepads[gamepad.index];

    if (gamepad.index !== index) return;
    callback();
  }

  window.addEventListener("gamepadconnected", onConnect);
  window.addEventListener("gamepaddisconnected", onDisconnect);

  return () => {
    window.removeEventListener("gamepadconnected", onConnect);
    window.removeEventListener("gamepaddisconnected", onDisconnect);
  };
}

let loopStarted = false;

function loop() {
  if (Object.keys(gamepads).length === 0) {
    loopStarted = false;
    return;
  }

  scanGamepads();

  const requestAnimationFrame =
    window.requestAnimationFrame || window.webkitRequestAnimationFrame;
  requestAnimationFrame(gameLoop);
}

function scanGamepads() {
  const devices = window.navigator.getGamepads();
  for (let i = 0; i < devices.length; i++) {
    if (!devices[i]) continue;

    const gp = devices[i];
    if (gp.index in gamepads) {
      gamepads[gp.index] = updateGamepadInfo(gp);
    }
  }
}

function updateGamepadInfo(gamepad) {
  const previousInfo = gamepads[gamepad.index] || { connected: true };
  let changed = false;
  const gamepadInfo = { connected: true };

  gamepad.buttons.forEach((button, index) => {
    gamepadInfo[`button${index}`] = button.pressed;
    if (previousInfo[`button${index}`] !== button.pressed) {
      changed = true;
    }
  });

  gamepad.axes.forEach((axis, index) => {
    const axisValue =
      Math.abs(axis) > AXIS_MOVEMENT_THRESHOLD ? axis : undefined; // Ignore axis if below threshold
    gamepadInfo[`axis${index}`] = axisValue;

    if (previousInfo[`axis${index}`] !== axis) {
      changed = true;
    }
  });

  if (changed || !previousInfo.connected) {
	return gamepadInfo
  }

  return previousInfo;
}
