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

let white = [1, 1, 1, 1],
    red = [1, 0, 0, 1],
    green = [0, 1, 0, 1],
    blue = [0, 0, 1, 1],
    pale_purple = [0.5, 0.5, 1, 1];

export const mobile = new Mobile(cube, pale_purple, 4, 10, 1);

let left1 = mobile.addLeft(cube, red, 2, 1, 1),
    right1 = mobile.addRight(sphere, green, 2, 1, 1);

left1.addLeft(sphere, white);
left1.addRight(cube, white);

right1.addLeft(cube, white);
right1.addRight(sphere, white);

