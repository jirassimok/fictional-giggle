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

import { vec3 } from "./MV+.js";
import { setupProgram } from "./webgl-setup.js";

import { mobile } from "./model.js";

import * as MV from "./MV+.js";
import * as Key from "./KeyboardUI.js";


// Force the camera to use specified values
const FORCE_EYE = [0, -3, 20],
      FORCE_AT  = [0, -3, 0],
      FORCE_UP  = undefined;

// Initial values for the light
const LIGHT_POSITION = [2, -1, 15],
      LIGHT_DIRECTION = MV.subtract(FORCE_AT, LIGHT_POSITION), // point at same place as camera
      LIGHT_ANGLE = 15; // in degrees


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
    position:          gl.getAttribLocation(program, "vertexPosition"),
    vertexNormal:      gl.getAttribLocation(program, "vertexNormal"),
    lightingPosition:  gl.getAttribLocation(program, "vertexLightingPosition"),

    material: Object.freeze({
	    ambient:       gl.getUniformLocation(program, "material.ambient"),
	    diffuse:       gl.getUniformLocation(program, "material.diffuse"),
	    specular:      gl.getUniformLocation(program, "material.specular"),
	    shininess:     gl.getUniformLocation(program, "material.shininess"),
    }),
    forceColor:        gl.getUniformLocation(program, "forceColor"),

    light: Object.freeze({
        position:      gl.getUniformLocation(program, "light.position"),
        direction:     gl.getUniformLocation(program, "light.direction"),
        cosAngle:      gl.getUniformLocation(program, "light.cosAngle"),
        ambient:       gl.getUniformLocation(program, "light.ambient"),
        diffuse:       gl.getUniformLocation(program, "light.diffuse"),
        specular:      gl.getUniformLocation(program, "light.specular")
    }),

    modelMatrix:       gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:        gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix:  gl.getUniformLocation(program, "projectionMatrix"),

    cameraPosition:    gl.getUniformLocation(program, "cameraPosition"),

    useForceColor:     gl.getUniformLocation(program, "useForceColor"),
    usePhongShading:   gl.getUniformLocation(program, "usePhongInterpolation"),
});



//// Global state

const settings = Object.seal({
    view_source: false,
    view_lines: false,
});

/**
 * The scene's light
 */
const light = Object.seal({
    position:  LIGHT_POSITION,
    direction: MV.normalize(LIGHT_DIRECTION),
    angle:     LIGHT_ANGLE,
    ambient:   [0.3, 0.3, 0.3],
    diffuse:   [1, 1, 1],
    specular:  [1, 1, 1],

    // For drawing the light source
    vao: gl.vao.createVertexArrayOES(),
    positionBuffer: gl.createBuffer(),

    // For drawing lines to the light source
    linesVao: gl.vao.createVertexArrayOES(),
    linesBuffer: gl.createBuffer(),
});


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

	var viewMatrix = MV.lookAt(eye, at, up);

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
 * Prepare the light source lines
 *
 * @param {Object} keywords Arguments must be given as an object
 * @param {boolean} keywords.setup If true, set 0-normals
 */
function updateLightSourceLines() {
    let lines = getLightSourceLines();

    gl.vao.bindVertexArrayOES(light.linesVao);

    setupBuffer(shader.position, lines, light.linesBuffer);

    gl.vao.bindVertexArrayOES(null);
}

/**
 * Get lines connecting to the light source
 *
 * Twelve lines form a rectangular prism with the origin at the opposite corner,
 * and three additional lines extend along each primary axis from the light source.
 */
function getLightSourceLines() {
    let [x, y, z] = light.position;

    // Make a cube from the origin to the light
    return new Float32Array([
        // top square
        0,0,0,  x,0,0,
        x,0,0,  x,0,z,
        x,0,z,  0,0,z,
        0,0,z,  0,0,0,

        // Bottom square
        0,y,0,  x,y,0,
        x,y,0,  x,y,z,
        x,y,z,  0,y,z,
        0,y,z,  0,y,0,

        // vertical lines
        0,0,0,  0,y,0,
        x,0,0,  x,y,0,
        x,0,z,  x,y,z,
        0,0,z,  0,y,z,

        // Axes from light source
        1000,y,z,  -1000,y,z,
        x,y,1000,  x,y,-1000,
        x,1000,z,  x,-1000,z,
    ]);
}

function updateLightAngle() {
    gl.uniform1f(shader.light.cosAngle, Math.cos(light.angle * Math.PI / 180));
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
    gl.uniform3fv(shader.light.direction, light.direction);
    gl.uniform3fv(shader.light.ambient, light.ambient);
    gl.uniform3fv(shader.light.diffuse, light.diffuse);
    gl.uniform3fv(shader.light.specular, light.specular);
    updateLightAngle();

    mobile.setup(shader);

    setProjection(mobile);

    // Prepare the light source for rendering
    gl.vao.bindVertexArrayOES(light.vao);

    setupBuffer(shader.position, light.position, light.positionBuffer);
    setupBuffer(shader.vertexNormal, [0, 0, 0],  gl.createBuffer());

    updateLightSourceLines();

    gl.vao.bindVertexArrayOES(null);

    // Don't draw all colors as white
    gl.uniform1i(shader.useForceColor, false);
    // Don't use Phong shading
    gl.uniform1i(shader.usePhongShading, false);
}

function render() {
    clearCanvas();
    mobile.draw();

    // The remainder of this function draws the light source

    if (settings.view_source || settings.view_lines) {
        // Use an identity model matrix and normal matrix
        gl.uniformMatrix4fv(shader.modelMatrix, false, new Float32Array([1,0,0,0,
                                                                         0,1,0,0,
                                                                         0,0,1,0,
                                                                         0,0,0,1]));
        // Bypass light calculation
        gl.uniform1i(shader.useForceColor, true);
        gl.uniform3fv(shader.forceColor, new Float32Array([1, 1, 1]));

        // Draw the light source as a point
        gl.vao.bindVertexArrayOES(light.vao);
        gl.drawArrays(gl.POINTS, 0, 1);

        if (settings.view_lines) {
            gl.vao.bindVertexArrayOES(light.linesVao);
            gl.drawArrays(gl.LINES, 0, 30);
        }

        // Restore to normal state
        gl.uniform1i(shader.useForceColor, false);
        gl.vao.bindVertexArrayOES(null);
    }

    window.requestAnimationFrame(render);
}


window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return; // Ignore keys with non-shift modifiers
    }

    switch (e.key) {
    case 'p':
        Key.activate('p');
        light.angle += 1;
        updateLightAngle();
        break;
    case 'P':
        Key.activate('P');
        light.angle -= 1;
        updateLightAngle();
        break;
    case 'm':
        Key.activate('m');
        //window.setTimeout(() => Key.deactivate('m'), 100);
        mobile.useVertexShading();
        gl.uniform1i(shader.usePhongShading, false);
        break;
    case 'M':
        Key.activate('M');
        mobile.useFaceShading();
        gl.uniform1i(shader.usePhongShading, false);
        break;

    case 'n':
        Key.toggle('n');
        mobile.useVertexShading();
        gl.uniform1i(shader.usePhongShading, true);
        break;

    case 'L':
        Key.activate('L');
        updateLightSourceLines();
        settings.view_lines = !settings.view_lines;
        break;
    case 'l':
        Key.activate('l');
        settings.view_source = !settings.view_source;
        break;
    }
});

window.addEventListener('keyup', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return; // Ignore keys with non-shift modifiers
    }

    const keys = ['P', 'p', 'M', 'm', 'L', 'l', 'n'];

    if (keys.includes(e.key)) {
        Key.deactivate(e.key);
    }
});

clearCanvas();
setup();
render();
