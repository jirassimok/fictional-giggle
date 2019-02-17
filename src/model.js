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

let white = [1, 1, 1, 1],
    black = [0, 0, 0, 1],
    gray = [0.5, 0.5, 0.5, 1],
    red = [1, 0, 0, 1],
    green = [0, 1, 0, 1],
    blue = [0, 0, 1, 1],
    cyan = [0, 1, 1, 1],
    magenta = [1, 0, 1, 1],
    yellow = [1, 1, 0, 1],
    pale_purple = [0.5, 0.5, 1, 1];


let root = Mobile.builder(cube, pale_purple)
    .radius(4)
    .parentHeight(10)
    .childHeight(0.5)
    .spinSpeed(0.06)
    .armSpeed(0.05),

    L = root.left(sphere, red)
    .parentHeight(0.5)
    .spinSpeed(0.125)
    .armSpeed(0.075),

    R = root.right(cube, green)
    .parentHeight(2)
    .childHeight(0.5)
    .spinSpeed(0.075)
    .armSpeed(0.125),

    ll = L.left(cube, cyan)
    .parentHeight(1.25)
    .spinSpeed(0.1)
    .armSpeed(0),

    lr = L.right(sphere, yellow)
    .radius(0)
    .childHeight(0.25)
    .spinSpeed(0.5),

    lrl = lr.left(scale(0.5, cube), gray)
    .spinSpeed(0.1),

    rl = R.left(sphere, magenta)
    .parentHeight(0.5)
    .spinSpeed(0.025),

    rr = R.emptyRight()
    .radius(4)
    .parentHeight(0.25)
    .childHeight(3)
    .armSpeed(0.1),

    rrl = rr.left(scale(0.25, sphere), blue).spinSpeed(0.5),
    rrr = rr.right(scale(0.25, cube), white).spinSpeed(0.05);

export const mobile = root.build();

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
