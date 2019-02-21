/*
 * Functions for debugging in the console
 *
 * To use these, import and re-export them from main.js.
 */
import { mobile } from "./model.js";
import { Mesh } from "./Mesh.js";

export { mobile, Mesh };

// Can be used as default for 'mobile' parameters
const default_mobile = mobile;

/**
 * Reset the mobile's rotation
 *
 * @param {boolean} [stop=false] If true, stop the rotation
 */
export function resetRotations(stop = false, mobile = default_mobile) {
    if (stop) {
        mobile.rotation.stop();
        mobile.armRotation.stop();
    }
    mobile.rotation._position = 0;
    mobile.armRotation._position = 0;
    if (mobile.left) resetRotations(mobile.left);
    if (mobile.right) resetRotations(mobile.right);
}

/** Multiply the mobile's arm rotation speed */
export function scaleSpeed(scale, mobile = default_mobile) {
    let speed = mobile.armRotation.speed;
    let scaled = () => scale * speed();
    mobile.armRotation.speed = scaled;
    if (mobile.left) scaleSpeed(mobile.left, scale);
    if (mobile.right) scaleSpeed(mobile.right, scale);
}

/**
 * Set or modify the current time
 *
 * @param {boolean} [add=true] If true, add to current time. Otherwise, set time.
 */
export function setTime(t, mobile = default_mobile, add = true) {
    if (add) {
        mobile.rotation._position += t;
        mobile.armRotation._position += t;
    }
    else {
        mobile.rotation._position = t;
        mobile.armRotation._position = t;
    }
    if (mobile.left)  setTime(mobile.left,  t);
    if (mobile.right) setTime(mobile.right, t);
}

export function stop(mobile = default_mobile) {
    mobile.rotation.stop();
    mobile.armRotation.stop();
    if (mobile.left)  stop(mobile.left);
    if (mobile.right) stop(mobile.right);
}

export function start(mobile = default_mobile) {
    mobile.rotation.start();
    mobile.armRotation.start();
    if (mobile.left)  start(mobile.left);
    if (mobile.right) start(mobile.right);
}
