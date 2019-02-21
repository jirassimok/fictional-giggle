"use strict";

import "./vecarray.js";
import { gl,
         setupBuffer,
         X_FIELD_OF_VIEW,
         ASPECT_RATIO,
         PERSPECTIVE_NEAR_PLANE,
         PERSPECTIVE_FAR_PLANE } from "./setup.js";
import VERTEX_SHADER_SOURCE from "./shader.vert";
import FRAGMENT_SHADER_SOURCE from "./shader.frag";

import { AnimationState } from "./Animations.js";
import { Bounds } from "./Bounds.js";
import { Mesh } from "./Mesh.js";
import { vec2, vec3, vec4 } from "./MV+.js";
import { setupProgram } from "./webgl-setup.js";

import { mobile } from "./model.js";

import * as MV from "./MV+.js";

//// Additional WebGL setup (see setup.js for pre-program initialization)

const program = setupProgram(gl,
                             VERTEX_SHADER_SOURCE,
                             FRAGMENT_SHADER_SOURCE);
if (program === null) {
    throw new Error("Failed to set up program");
}

gl.useProgram(program);


// Set up the shader variables
const shader = Object.freeze({
    position:         gl.getAttribLocation(program, "vertexPosition"),
    vertexNormal:     gl.getAttribLocation(program, "vertexNormal"),

    material: Object.freeze({
	    ambient:      gl.getUniformLocation(program, "material.ambient"),
	    diffuse:      gl.getUniformLocation(program, "material.diffuse"),
	    specular:     gl.getUniformLocation(program, "material.specular"),
	    shininess:    gl.getUniformLocation(program, "material.shininess"),
    }),

    light: Object.freeze({
        position:     gl.getUniformLocation(program, "light.position"),
        ambient:      gl.getUniformLocation(program, "light.ambient"),
        diffuse:      gl.getUniformLocation(program, "light.diffuse"),
        specular:     gl.getUniformLocation(program, "light.specular")
    }),

    modelMatrix:      gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:       gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix"),

    forceWhite:       gl.getUniformLocation(program, "forceWhite"),
});



//// Global state

/**
 * The scene's light
 */
const light = Object.seal({
    position: new Float32Array([10, 0, 10]),
    ambient:  new Float32Array([0.3, 0.3, 0.3]),
    diffuse:  new Float32Array([2, 2, 2]),
    specular: new Float32Array([2, 2, 2]),

    vao: gl.vao.createVertexArrayOES(),
    positionBuffer: gl.createBuffer(),
});

/**
 * Container for configural animation settings
 */
class Settings {
    constructor() {
        this.initialize();
        this.uiElements = [];
        Object.seal(this); // prevent addition of new properties
    }

    initialize() {
    }

    reset() {
        this.initialize();

        for (let [setting, element] of this.uiElements) {
            element.value = this[setting];
        }
    }

    /**
     * Register a UI element to reset when settings reset
     *
     * @param {String} setting The setting associated with the UI element
     * @param {Element} element The element to associate with the setting
     *
     * When settings are reset, the element's {@code value} will be set to the
     * setting's value.
     */
    bindUI(setting, element) {
        this.uiElements.push([setting, element]);
    }
}

/**
 * Global user-configurable settings object
 *
 * @see Settings
 */
const settings = new Settings();


//// Canvas/GL/Mesh preparation functions

function clearCanvas() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// TODO: Update projection for project 3
/**
 * Set up the projection and view matrices based on the mesh
 *
 * The mesh is viewed from distance equal to its depth (z-width), with a 10%
 * margin in all directions.
 */
function setProjection(mobile) {
    let bounds = mobile.bounds(),
        midpoint = bounds.midpoint;

    let fov_x = X_FIELD_OF_VIEW * Math.PI / 180,
        fov_y = fov_x / ASPECT_RATIO,
        // Distance required to view entire width/height
        width_distance = bounds.width / (2 * Math.tan(fov_x / 2)),
        height_distance = bounds.height / (2 * Math.tan(fov_y / 2)),
        // Distance camera must be to view full mesh
        camera_z = Math.max(bounds.near, bounds.right) + Math.max(width_distance, height_distance) * 1.1;

    let projectionMatrix = MV.perspectiveRad(
        fov_y, ASPECT_RATIO, PERSPECTIVE_NEAR_PLANE, PERSPECTIVE_FAR_PLANE);

	let eye = vec3(midpoint.x,
                   midpoint.y,
                   camera_z),
	    at = midpoint,
	    up = vec3(0, 1, 0);

	var viewMatrix = MV.lookAt(eye, at, up);

    // // Add margins around the  mesh
    let margins = MV.scalem(0.9, 0.9, 0.9);
    projectionMatrix = MV.mult(margins, projectionMatrix);

    gl.uniformMatrix4fv(shader.projectionMatrix,
                        false,
                        MV.flatten(projectionMatrix));

    gl.uniformMatrix4fv(shader.viewMatrix,
                        false,
                        MV.flatten(viewMatrix));
}

/**
 * Prepare scene for drawing
 */
function setup() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Send information about the light to the shaders
    gl.uniform3fv(shader.light.position, light.position);
    gl.uniform3fv(shader.light.ambient, light.ambient);
    gl.uniform3fv(shader.light.diffuse, light.diffuse);
    gl.uniform3fv(shader.light.specular, light.specular);

    mobile.setup(shader);

    setProjection(mobile);

    // Prepare the light source for rendering
    gl.vao.bindVertexArrayOES(light.vao);

    setupBuffer(shader.position, light.position, light.positionBuffer);
    setupBuffer(shader.vertexNormal, [0, 0, 0],  gl.createBuffer());

    gl.vao.bindVertexArrayOES(null);

    // Don't draw all colors as white
    gl.uniform1i(shader.forceWhite, 0);
}

function render() {
    clearCanvas();
    mobile.draw();

    // The remainder of this function draws the light source

    // Use an identity model matrix
    gl.uniformMatrix4fv(shader.modelMatrix, false, new Float32Array([1,0,0,0,
                                                                     0,1,0,0,
                                                                     0,0,1,0,
                                                                     0,0,0,1]));

    // Set forceWhite, which bypasses light calculations
    gl.uniform1i(shader.forceWhite, 1);

    // Draw the light source as a point
    gl.vao.bindVertexArrayOES(light.vao);
    gl.drawArrays(gl.POINTS, 0, 1);

    // Restore to normal state
    gl.uniform1i(shader.forceWhite, 0);
    gl.vao.bindVertexArrayOES(null);

    window.requestAnimationFrame(render);
}

clearCanvas();
setup();
render();
