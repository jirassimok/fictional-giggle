"use strict";

import "./vecarray.js";

import { vec3, ortho } from "./MV+.js";

/**
 * Class representing the extent of a data file's contents.
 */
export class Bounds {
    constructor(left, right, bottom, top, near = 1, far = -1) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;
    }

    /**
     * Construct the extent of an array of vectors.
     * @param {number[][]} vecs A non-empty array of vectors
     * @return {Extent}
     *
     * The vectors should all have the same length of at least 2.
     *
     * If the list is empty, an error will occur.
     */
    static fromVecs(vecs) {
        let size = vecs[0].length;

        let extent = new Bounds(vecs[0].x, vecs[0].x,
                                vecs[0].y, vecs[0].y,
                                vecs[0].z, vecs[0].z);

        return vecs.reduce(
            (ext, vec) => {
                ext.left = Math.min(ext.left, vec.x);
                ext.right = Math.max(ext.right, vec.x);
                ext.top = Math.max(ext.top, vec.y);
                ext.bottom = Math.min(ext.bottom, vec.y);
                if (size > 2) {
                    ext.near = Math.max(ext.near, vec.z);
                    ext.far = Math.min(ext.far, vec.z);
                }
                return ext;
            }, extent);
    }

    /** Get the default extent */
    static basic() {
        return new Bounds(-1, 1, -1, 1, 1, -1);
    }

    /** Convert to orthographic projection matrix */
    asortho() {
        return ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }

    get midpoint() {
        return vec3((this.left + this.right) / 2,
                    (this.top + this.bottom) / 2,
                    (this.near + this.far) / 2);
    }

    get width() {
        return Math.abs(this.right - this.left);
    }

    get height() {
        return Math.abs(this.top - this.bottom);
    }

    get depth() {
        return Math.abs(this.near - this.far);
    }

    get radius() {
        return Math.sqrt((this.height / 2) ** 2 +
                         (this.width / 2) ** 2 +
                         (this.depth / 2) ** 2);
    }
}
