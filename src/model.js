/*
 * Definitions of meshes and the mobile
 */
import { Mobile } from "./Mobile.js";
import { vec3 } from "./MV+.js";

import _sphere from "./sphere.json";
import _cube from "./cube.json";

export const sphere = Object.freeze({
    vertices: _sphere.vertices.map(vec3),
    faces: _sphere.faces
});

export const cube = Object.freeze({
    vertices: _cube.vertices.map(vec3),
    faces: _cube.faces
});

export const shapes = [sphere, cube];

export const mobile = new Mobile(cube, 4, 10, 1);

let left1 = mobile.addLeft(cube, 2, 1, 1),
    right1 = mobile.addRight(sphere, 2, 1, 1);

left1.addLeft(sphere);
left1.addRight(cube);

right1.addLeft(cube);
right1.addRight(sphere);

