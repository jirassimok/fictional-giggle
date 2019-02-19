"use strict";

import "./vecarray.js";
import { gl, X_FIELD_OF_VIEW, ASPECT_RATIO, PERSPECTIVE_NEAR_PLANE, PERSPECTIVE_FAR_PLANE } from "./setup.js";
import VERTEX_SHADER_SOURCE from "./shader.vert";
import FRAGMENT_SHADER_SOURCE from "./shader.frag";

import { AnimationState } from "./Animations.js";
import { Bounds } from "./Bounds.js";
import { Mesh } from "./Mesh.js";
import { vec2, vec3, vec4 } from "./MV+.js";
import { setupProgram } from "./webgl-setup.js";

import { mobile } from "./model.js";

import * as MV from "./MV+.js";

const program = setupProgram(gl,
                             VERTEX_SHADER_SOURCE,
                             FRAGMENT_SHADER_SOURCE);
if (program === null) {
    throw new Error("Failed to set up program");
}

gl.useProgram(program);


const buffers = Object.freeze({
    position: gl.createBuffer(), // vertices
    normal: gl.createBuffer(),   // normal vectors
});

// Set up the shader variables
const shader = Object.freeze({
    position:         gl.getAttribLocation(program, "aPosition"),
    vertexNormal:     gl.getAttribLocation(program, "vertexNormal"),

    color:            gl.getUniformLocation(program, "baseColor"),
    shininess:        gl.getUniformLocation(program, "shininess"),

    lightPosition:    gl.getUniformLocation(program, "lightPosition"),

    ambientProduct:   gl.getUniformLocation(program, "ambientProduct"),
    diffuseProduct:   gl.getUniformLocation(program, "diffuseProduct"),
    specularProduct:  gl.getUniformLocation(program, "specularProduct"),

    modelMatrix:      gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:       gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix"),
});



//// Global animation state

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

/**
 * Global animation state
 *
 * @see AnimationState
 */
const animationState = new AnimationState(settings);



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
 * Prepare webgl and the animations for a new mesh
 */
function animateMesh(mesh) {
    animationState.reset();
    drawMesh(mesh);
}

/**
 * Draw and animate the shape specified by the arguments
 * @param {Mesh} mesh
 */
function drawMesh(mesh) {
    let bounds = mesh.bounds;

    let rotation = MV.rotateX(animationState.xrotation.position);

    let model = rotation;

    gl.uniformMatrix4fv(shader.modelMatrix, false, MV.flatten(model));

    clearCanvas();

    for (let [size, offset] of mesh.faceoffsets) {
        gl.drawArrays(gl.LINE_LOOP, offset, size);
    }

    animationState.animate(() => drawMesh(mesh));
}

function setup() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Place light at center of mesh
    gl.uniform3f(shader.lightPosition, 10, 0, 10);
    gl.uniform1f(shader.shininess, 100);

    let ambientIntensity = vec4(0.3, 0.3, 0.3, 1),
        diffuseIntensity = vec4(2, 2, 2, 1),
        specularIntensity = vec4(2, 2, 2, 1);

    let ambientCoeff = vec4(2, 2, 2, 2),
        diffuseCoeff = vec4(0.5, 0.5, 0.5, 1),
        specularCoeff = vec4(1, 1, 1, 1);

    let ambientProduct = MV.mult(ambientIntensity, ambientCoeff),
        diffuseProduct = MV.mult(diffuseIntensity, diffuseCoeff),
        specularProduct = MV.mult(specularIntensity, specularCoeff);

    gl.uniform4fv(shader.ambientProduct, ambientProduct);
    gl.uniform4fv(shader.diffuseProduct, diffuseProduct);
    gl.uniform4fv(shader.specularProduct, specularProduct);

    mobile.setup(shader);
    setProjection(mobile);
}

function render() {
    clearCanvas();
    mobile.draw();

    window.requestAnimationFrame(render);
}

clearCanvas();
setup();
render();
