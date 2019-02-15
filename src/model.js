/*
 * Definitions of meshes and the mobile
 */
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
