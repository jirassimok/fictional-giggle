/*
 * Functions for debugging in the console
 *
 * To use these, import and re-export them from main.js.
 */
import { mobile } from "./model.js";
import Mesh from "./Mesh.js";
import * as MV from "./MV+.js";

export { mobile, Mesh, MV };

// Can be used as default for 'mobile' parameters
const default_mobile = mobile;

/**
 * Reset the mobile's rotation
 *
 * @param {boolean} [stop=false] If true, stop the rotation
 */
export function resetRotations(stop = false, mobile = default_mobile) {
    mobile.apply(mobile => {
        if (stop) {
            mobile.rotation.stop();
            mobile.armRotation.stop();
        }
        mobile.rotation._position = 0;
        mobile.armRotation._position = 0;
    });
}

/** Multiply the mobile's arm rotation speed */
export function scaleSpeed(scale, mobile = default_mobile) {
    mobile.apply(mobile => {
        let speed = mobile.armRotation.speed;
        let scaled = () => scale * speed();
        mobile.armRotation.speed = scaled;
    });
}

/**
 * Set or modify the current time
 *
 * @param {boolean} [add=true] If true, add to current time. Otherwise, set time.
 */
export function setTime(t, mobile = default_mobile, add = true) {
    mobile.apply(mobile => {
        if (add) {
            mobile.rotation._position += t;
            mobile.armRotation._position += t;
        }
        else {
            mobile.rotation._position = t;
            mobile.armRotation._position = t;
        }
    });
}

export function stop(mobile = default_mobile) {
    mobile.apply(mobile => {
        mobile.rotation.stop();
        mobile.armRotation.stop();
    });
}

export function start(mobile = default_mobile) {
    mobile.apply(mobile => {
        mobile.rotation.start();
        mobile.armRotation.start();
    });
}
