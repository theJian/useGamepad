import { useCallback, useSyncExternalStore } from "react";

/**
 * @typedef {Object} GamepadInfo
 * @property {boolean} connected
 * @property {boolean} [button0]
 * @property {boolean} [button1]
 * @property {boolean} [buttonN]
 */

export default function useGamepad(index = 0) {
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
      updateGamepadInfo(gp);
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
    // TODO
  });

  if (changed || !previousInfo.connected) {
    gamepads[gamepad.index] = gamepadInfo;
    // TODO: Dispatch an event to notify subscribers
  }
}
