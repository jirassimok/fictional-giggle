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

const mobile = new Mobile(cube, 1, 1, 2);

{
    let left1 = mobile.addLeft(cube),
        right1 = mobile.addRight(sphere);

    left1.addLeft(sphere);
    left1.addRight(cube);

    right1.addLeft(cube);
    right1.addRight(sphere);
}
