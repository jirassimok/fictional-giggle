// This file is necessary to resolve a circular dependency

/**
 * The material lighting coefficients and shininess for a material
 * @typedef {Object} MaterialColor
 * @property {Float32Array} ambient
 * @property {Float32Array} diffuse
 * @property {Float32Array} specular
 * @property {number} shininess
 */

/**
 * The properties of the scene's light
 * @typedef {Object} Light
 * @property {Float32Array} position
 * @property {Float32Array} ambient Ambient intensity
 * @property {Float32Array} diffuse Diffuse intensity
 * @property {Float32Array} specular Specular intensity
 */

//// Constants

export const X_FIELD_OF_VIEW = 90,
             ASPECT_RATIO = 5/3;

export const MIN_CANVAS_HEIGHT = 200;

export const PERSPECTIVE_NEAR_PLANE = 0.001,
             PERSPECTIVE_FAR_PLANE = 1000;

//// Prepare the canvas

const canvas = document.querySelector("#webglCanvas");

{
    // Set height to either 200 or as tall as it can be without pushing anything else off-screen
    canvas.height = 0;
    let body = window.getComputedStyle(document.body);
    let height = document.body.scrollHeight + parseInt(body.marginTop) + parseInt(body.marginTop);

    canvas.height = Math.max(MIN_CANVAS_HEIGHT, window.innerHeight - height);

    // Set width to
    canvas.width = (canvas.height * ASPECT_RATIO);
    if (canvas.width > document.body.clientWidth) {
        canvas.width = document.body.clientWidth;
        canvas.height = canvas.width / ASPECT_RATIO;
    }
}

import { setupWebGL, enableAndBindVAO } from "./webgl-setup.js";

//// Set up WebGL, the program, buffers, and shader variables

export const gl = setupWebGL(canvas);
if (gl === null) {
    throw new Error("Failed to set up WebGL");
}

// Bind VAO extension properties under gl.ext
if (enableAndBindVAO(gl) === null) {
    throw new Error("Failed to load Vertex Array Object extension");
}


//// Remove the message referring viewers to README.md.

// (The message is there in case the program fails completely, such as if it is
//  viewed un-bundled, in which case this will not be run.)

document.querySelector('#unbundledErrorMessage').outerHTML = '';
