/*
 * Definitions of meshes and the mobile
 */
import { Mesh } from "./Mesh.js";
import { Mobile } from "./Mobile.js";
import { vec3 } from "./MV+.js";

import * as MV from "./MV+.js";

import _sphere from "./sphere.mesh.json";
import _cube from "./cube.json";

const sphere = Mesh.fromJSON(_sphere);
const cube = Mesh.fromJSON(_cube).scaled(0.75);

let white = [1, 1, 1],
    black = [0, 0, 0],
    gray = [0.5, 0.5, 0.5],
    red = [1, 0, 0],
    green = [0, 1, 0],
    blue = [0, 0, 1],
    cyan = [0, 1, 1],
    magenta = [1, 0, 1],
    yellow = [1, 1, 0],
    pale_purple = [0.5, 0.5, 1];

let root = Mobile.builder(cube)
    .color(pale_purple)
    .shininess(100)
    .radius(4)
    .parentHeight(10)
    .hangingFrom([0, 11, 0])
    .childHeight(0.5)
    .spinSpeed(0.06)
    .armSpeed(0.05),

    L = root.left(sphere)
    .color(red)
    .parentHeight(0.5)
    .spinSpeed(0.125)
    .armSpeed(0.075),

    R = root.right(cube)
    .color(green)
    .parentHeight(2)
    .childHeight(0.5)
    .spinSpeed(0.075)
    .armSpeed(0.125),

    ll = L.left(cube)
    .color(cyan)
    .parentHeight(1.25)
    .spinSpeed(0.1)
    .armSpeed(0),

    lr = L.right(sphere)
    .color(yellow)
    .radius(0)
    .childHeight(0.25)
    .spinSpeed(0.5),

    lrl = lr.left(cube.scaled(0.5))
    .color(gray)
    .spinSpeed(0.1),

    rl = R.left(sphere)
    .color(magenta)
    .parentHeight(0.5)
    .spinSpeed(0.025),

    rr = R.emptyRight()
    .radius(4)
    .parentHeight(0.25)
    .childHeight(3)
    .armSpeed(0.1),

    rrl = rr.left(sphere.scaled(0.25))
    .color(blue)
    .spinSpeed(0.5),
    rrr = rr.right(cube.scaled(0.25))
    .color(white)
    .spinSpeed(0.05);

export const mobile = root.build();
