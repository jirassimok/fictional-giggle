/*
 * Definitions of meshes and the mobile
 */
import { Mobile } from "./Mobile.js";
import { vec3 } from "./MV+.js";

import * as MV from "./MV+.js";

import _sphere from "./sphere.json";
import _cube from "./cube.json";

const sphere = Object.freeze({
    vertices: _sphere.vertices.map(vec3),
    faces: _sphere.faces
});

const cube = Object.freeze({
    vertices: _cube.vertices.map(vec3),
    faces: _cube.faces
});

const empty = Object.freeze({
    vertices: [vec3(0, 0, 0)],
    faces: []
});

let white = [1, 1, 1, 1],
    red = [1, 0, 0, 1],
    green = [0, 1, 0, 1],
    blue = [0, 0, 1, 1],
    cyan = [0, 1, 1, 1],
    magenta = [1, 0, 1, 1],
    yellow = [1, 1, 0, 1],
    pale_purple = [0.5, 0.5, 1, 1];

export const mobile = new Mobile(cube, pale_purple, 4, 10, 0.5).setSpeed(0.06).setArmSpeed(0.05, -1);

let left1 = mobile.addLeft(sphere, red, 2, 0.5, 0.5).setSpeed(0.125).setArmSpeed(0.075),
    right1 = mobile.addRight(cube, green, 2, 0.5, 0.5).setSpeed(0.075).setArmSpeed(0.125);

left1.addLeft(sphere, cyan).setSpeed(0.2);
left1.addRight(cube, yellow).setSpeed(0.005);

right1.addLeft(sphere, magenta).setSpeed(0.025);

let rrr = right1.addRight(empty, white, 4, 0.25, 3).setSpeed(0).setArmSpeed(-0.1);
rrr.addLeft(scale(0.25, sphere), blue).setSpeed(0.05);
rrr.addRight(scale(0.25, cube), white).setSpeed(0.05);

// right1.addLeft(cube, white);
// right1.addRight(sphere, white);

function merge(...meshes) {
    return meshes.reduce(merge2);
}
/** Join two meshes */
function merge2(mesh1, mesh2) {
    return {
        vertices: mesh1.vertices.concat(mesh2.vertices),
        faces: mesh1.faces.concat(mesh2.faces.map(face => face.map(i => i + mesh1.vertices.length)))
    };
}

function rotateY(angle, mesh) {
    let rotation = MV.rotateY(angle);
    return {
        vertices: mesh.vertices.map(v => vec3(MV.mult(rotation, MV.vec4(v)))),
        faces: mesh.faces
    };
}

function rotateX(angle, mesh) {
    let rotation = MV.rotateX(angle);
    return {
        vertices: mesh.vertices.map(v => vec3(MV.mult(rotation, MV.vec4(v)))),
        faces: mesh.faces
    };
}

function rotate(angle, axis, mesh) {
    let rotation = MV.rotate(angle, axis);
    return {
        vertices: mesh.vertices.map(v => vec3(MV.mult(rotation, MV.vec4(v)))),
        faces: mesh.faces
    };
}

/** Scale a mesh */
function scale(scale, mesh) {
    return {
        vertices: mesh.vertices.map(v => v.map(n => n * scale)),
        faces: mesh.faces
    };
}

/** Move a mesh up or down */
function moveY(dy, mesh) {
    return {
        vertices: mesh.vertices.map(([x, y, z]) => vec3(x, y + dy, z)),
        faces: mesh.faces
    };
}
