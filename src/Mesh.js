"use strict";

import { Bounds } from "./Bounds.js";
import { vec4, vec3, normalize, mult } from "./MV+.js";

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

        for (let face of faces) {
            // face rotated by 1 vertex
            let face2 = face.slice(1).concat(face[0]),
                vertexpairs = face.map((_, i) => [vertices[face[i]],
                                                  vertices[face2[i]]]);
            let x = 0,
                y = 0,
                z = 0;

            for (let [[x1, y1, z1], [x2, y2, z2]] of vertexpairs) {
                x += (y1 - y2) * (z1 + z2);
                y += (z1 - z2) * (x1 + x2);
                z += (x1 - x2) * (y1 + y2);
            }

            for (let _ of face) {
                this._facenormals.push(normalize(vec3(x, y, z)));
            }
        }

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
     * Create a mesh like this one, transformed by the given matrix
     */
    transformed(transformation) {
        let vertices = this.vertices.map(v => vec3(mult(transformation, vec4(v))));
        return new Mesh(vertices, this.faces);
    }
}
