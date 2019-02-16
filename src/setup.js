// This file necessary to resolve a circular dependency

//// Constants

const X_FIELD_OF_VIEW = 90,
      ASPECT_RATIO = 5/3;

const MIN_CANVAS_HEIGHT = 200;

const PERSPECTIVE_NEAR_PLANE = 0.001,
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
