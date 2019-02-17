"use strict";

import { Bounds } from "./Bounds.js";
import { vec4, vec3, normalize, mult } from "./MV+.js";

/**
 * A 3-dimensional vector
 * @typedef {number[][]} vec3
 */

/**
 * Represents a mesh of faces
 *
 * Stores the mesh as a list of vertices, a list of normals for the vertices,
 * and a list of index arrays representing the faces by their indices in the
 * vertex list.
 *
 * The constructor takes in a list of vertices and an index array of faces.
 */
export class Mesh {
    constructor(vertices, faces) {
        this.bounds = Bounds.fromVecs(vertices);

        this._allvertices = Object.freeze(vertices.map(vec3));

        this._faces = Object.freeze(faces.map(face => Array.from(face)));

        this._facenormals = [];
        // TODO: Restore face normals and add vertex normals
        Object.freeze(this._facenormals);
    }

    /**
     * @returns {vec3[]} An array of the vertices in this mesh.
     */
    get vertices() {
        return this._allvertices;
    }

    /**
     * @returns {number[][]} Index array of faces
     */
    get faces() {
        return this._faces;
    }

    /**
     * @returns {vec3[]} an array of normals for the faces
     */
    get facenormals() {
        return this._facenormals;
    }

    /**
     * Create a mesh like this one, translated by the given amounts
     */
    translated(dx, dy, dz) {
        let vertices = this.vertices.map(
            ([x, y, z]) => vec3(x + dx, y + dy, z + dz));
        return new Mesh(vertices, this.faces);
    }

    /**
     * Create a mesh like this one, scaled by the given amount
     */
    scaled(scale) {
        let vertices = this.vertices.map(
            ([x, y, z]) => vec3(x * scale, y * scale, z * scale));
        return new Mesh(vertices, this.faces);
    }
}
