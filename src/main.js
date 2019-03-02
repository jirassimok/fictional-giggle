"use strict";

import "./vecarray.js";
import { gl,
         X_FIELD_OF_VIEW,
         ASPECT_RATIO,
         PERSPECTIVE_NEAR_PLANE,
         PERSPECTIVE_FAR_PLANE } from "./setup.js";
import VERTEX_SHADER_SOURCE from "./shader.vert";
import FRAGMENT_SHADER_SOURCE from "./shader.frag";

import Camera from "./Camera.js";
import Light from "./Light.js";
import MultiModel from "./MultiModel.js";
import Walls from "./Walls.js";
import * as materials from "./materials.js";
import { vec3 } from "./MV+.js";
import { setupProgram } from "./webgl-setup.js";

import { mobile, scaleAmbient } from "./model.js";

import * as MV from "./MV+.js";
import * as Key from "./KeyboardUI.js";


// Force the camera to use specified values
const FORCE_EYE = [0, -3, 20],
      FORCE_AT  = [0, -3, 0],
      FORCE_UP  = undefined;

// Initial values for the light
const LIGHT_POSITION = [2, -1, 15],
      LIGHT_DIRECTION = MV.subtract(FORCE_AT, LIGHT_POSITION), // point at same place as camera
      LIGHT_ANGLE = 30; // in degrees


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
    vertexPosition:     gl.getAttribLocation(program, "vertexPosition"),
    vertexNormal:       gl.getAttribLocation(program, "vertexNormal"),
    reflectionPosition: gl.getAttribLocation(program, "vertexLightingPosition"),
    textureCoordinate:  gl.getAttribLocation(program, "textureCoordinate"),

    material: Object.freeze({
        ambient:        gl.getUniformLocation(program, "material.ambient"),
        diffuse:        gl.getUniformLocation(program, "material.diffuse"),
        specular:       gl.getUniformLocation(program, "material.specular"),
        shininess:      gl.getUniformLocation(program, "material.shininess"),
    }),

    light: Object.freeze({
        position:       gl.getUniformLocation(program, "light.position"),
        direction:      gl.getUniformLocation(program, "light.direction"),
        cosAngle:       gl.getUniformLocation(program, "light.cosAngle"),
        ambient:        gl.getUniformLocation(program, "light.ambient"),
        diffuse:        gl.getUniformLocation(program, "light.diffuse"),
        specular:       gl.getUniformLocation(program, "light.specular")
    }),

    modelMatrix:        gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:         gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix:   gl.getUniformLocation(program, "projectionMatrix"),

    cameraPosition:     gl.getUniformLocation(program, "cameraPosition"),

    useForceColor:      gl.getUniformLocation(program, "useForceColor"),
    usePhongShading:    gl.getUniformLocation(program, "usePhongInterpolation"),
    useTexture:         gl.getUniformLocation(program, "useTexture"),

    forceColor:         gl.getUniformLocation(program, "forceColor"),
    texture:            gl.getUniformLocation(program, "Texture"),
});



//// Global state

const settings = Object.seal({
    view_source: false,
    view_lines: false,
});

/**
 * The scene's light
 */
const light = new Light(shader, {
    position:  LIGHT_POSITION,
    direction: MV.normalize(LIGHT_DIRECTION),
    angle:     LIGHT_ANGLE,
    ambient:   [0.3, 0.3, 0.3],
    diffuse:   [1, 1, 1],
    specular:  [1, 1, 1],
}, () => settings.view_lines);

const walls = Walls.from(shader, scaleAmbient(materials.pearl, 2), -12, 12, -10, 6, 10, -10);

const models = new MultiModel(mobile, walls);

const camera = new Camera(shader);


//// Canvas/GL/Mesh preparation functions

function clearCanvas() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

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

	let eye = FORCE_EYE ? FORCE_EYE : vec3(midpoint.x,
                               midpoint.y,
                               camera_z),
	    at = FORCE_AT ? FORCE_AT : midpoint,
	    up = FORCE_UP ? FORCE_UP : vec3(0, 1, 0);

	let viewMatrix = MV.lookAt(eye, at, up);

    // Set view matrix of camera state object
    camera.viewMatrix = viewMatrix;
    camera.up = up;

    // Add margins around the mesh
    let margins = MV.scalem(0.9, 0.9, 0.9);
    projectionMatrix = MV.mult(margins, projectionMatrix);

    gl.uniform3fv(shader.cameraPosition, eye);

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

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    mobile.setup(shader);

    setProjection(mobile);

    gl.uniform1i(shader.useForceColor, false);
    gl.uniform1i(shader.usePhongShading, true);
    gl.uniform1i(shader.useTexture, false);
}

function render() {
    clearCanvas();

    walls.draw();

    gl.disable(gl.DEPTH_TEST);

    mobile.draw(MV.mult(MV.translate(0, 0, walls.bounds.far), light.shadow_transform), true);

    gl.enable(gl.DEPTH_TEST);

    mobile.draw();

    if (settings.view_source || settings.view_lines) {
        light.draw();
    }

    camera.update();

    window.requestAnimationFrame(render);
}


window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return; // Ignore keys with non-shift modifiers
    }

    switch (e.key) {
    case 'p':
        Key.activate('p');
        light.addAngle(1);
        break;
    case 'P':
        Key.activate('P');
        light.addAngle(-1);
        break;
    case 'm':
        Key.activate('m');
        models.useVertexShading();
        gl.uniform1i(shader.usePhongShading, false);
        break;
    case 'M':
        Key.activate('M');
        models.useFaceShading();
        gl.uniform1i(shader.usePhongShading, false);
        break;

    case 'n':
        Key.toggle('n');
        models.useVertexShading();
        gl.uniform1i(shader.usePhongShading, true);
        break;

    case 'L':
        Key.activate('L');
        settings.view_lines = !settings.view_lines;
        break;
    case 'l':
        Key.activate('l');
        settings.view_source = !settings.view_source;
        break;

    case 'ArrowUp':
        startMovement(e, 'rx', -1);
        break;
    case 'ArrowDown':
        startMovement(e, 'rx', 1);
        break;
    case 'ArrowLeft':
        startMovement(e, 'ry', -1);
        break;
    case 'ArrowRight':
        startMovement(e, 'ry', 1);
        break;
    }

    switch (e.key.toUpperCase()) {
    case 'U':
        Key.activate('U');
        camera.reorient();
        break;

    case 'W':
        startMovement(e, 'z', 1);
        break;
    case 'S':
        startMovement(e, 'z', -1);
        break;
    case 'A':
        startMovement(e, 'x', 1);
        break;
    case 'D':
        startMovement(e, 'x', -1);
        break;
    case 'R':
        startMovement(e, 'y', -1);
        break;
    case 'F':
        startMovement(e, 'y', 1);
        break;

    case '1':
        startMovement(e, 'rz', -1);
        break;
    case '3':
        startMovement(e, 'rz', 1);
        break;
    }
});

window.addEventListener('keyup', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return; // Ignore keys with non-shift modifiers
    }

    const keys = ['P', 'p', 'M', 'm', 'L', 'l', 'n', 'U', 'u'];

    if (keys.includes(e.key)) {
        Key.deactivate(e.key);
    }

    switch (e.key) {
    case 'ArrowUp':
        stopMovement(e, 'rx', -1);
        break;
    case 'ArrowDown':
        stopMovement(e, 'rx', 1);
        break;
    case 'ArrowLeft':
        stopMovement(e, 'ry', -1);
        break;
    case 'ArrowRight':
        stopMovement(e, 'ry', 1);
        break;
    }

    switch (e.key.toUpperCase()) {
    case 'W':
        stopMovement(e, 'z', 1);
        break;
    case 'S':
        stopMovement(e, 'z', -1);
        break;
    case 'A':
        stopMovement(e, 'x', 1);
        break;
    case 'D':
        stopMovement(e, 'x', -1);
        break;
    case 'R':
        stopMovement(e, 'y', -1);
        break;
    case 'F':
        stopMovement(e, 'y', 1);
        break;

    case '1':
        stopMovement(e, 'rz', -1);
        break;
    case '3':
        stopMovement(e, 'rz', 1);
        break;
    }
});


function startMovement(event, axis, dir) {
    Key.activate(event.key);
    camera.startMoving(axis, dir);
    event.preventDefault();
}

function stopMovement(event, axis, dir) {
    Key.deactivate(event.key);
    camera.stopMoving(axis, dir);
    event.preventDefault();
}

clearCanvas();
setup();
render();
