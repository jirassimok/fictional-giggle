"use strict";

import { Bounds } from "./Bounds.js";
import { normalize, mult, rotateRad, radians as toRadians } from "./MV+.js";

/**
 * A 3-dimensional vector
 * @typedef {number[][]} vec3
 */

/*
 * Functions to copy 3-vectors
 */
const copyVector = ([x, y, z]) => Object.freeze([x, y, z]);

/**
 * Represents a mesh of faces
 *
 * Stores the mesh as a list of vertices, a list of normals for the vertices,
 * and a list of index arrays representing the faces by their indices in the
 * vertex list.
 *
 * The constructor takes in a list of vertices and an index array of faces.
 *
 * The constructor optionally takes a list of facenormals and vertexnormals,
 * which are used without any checks.
 */
export class Mesh {
    constructor(vertices, faces, facenormals = null, vertexnormals = null, duplicate = true) {
        this.bounds = Bounds.fromVecs(vertices);

        this.vertices = Object.freeze(vertices.map(copyVector));

        this.faces = Object.freeze(faces.map(face => Array.from(face)));

        this.faceNormals = Object.freeze(facenormals
                                         ? facenormals.map(copyVector)
                                         : Object.freeze(this.computeFaceNormals()));

        this.vertexNormals = Object.freeze(vertexnormals
                                           ? vertexnormals.map(copyVector)
                                           : this.computeVertexNormals());

        if (duplicate && faces.length !== 0) {
            this.vertices = faces.flatMap(
                face => face.map(
                    v => vertices[v]));

            this.faces = [];
            let offset = 0;
            for (let size of faces.map(face => face.length)) {
                this.faces.push([...Array(size)]
                                .map((_, i) => offset + i));
                offset += size;
            }


            this.vertexNormals = faces.flatMap(
                face => face.map(
                    vn => this.vertexNormals[vn]));
        }
    }

    /**
     * Create a mesh for a regular polyhedron centered at 0.
     *
     * The vertex normals are just the normalized vertices.
     */
    static unitPoly(vertices, faces) {
        return new Mesh(
            vertices,
            faces,
            undefined,
            vertices
        );
    }

    computeFaceNormals() {
        let faceNormals = [];

        for (let face of this.faces) {
            // face rotated by 1 vertex
            let face2 = face.slice(1).concat(face[0]),
                vertexpairs = face.map((_, i) => [this.vertices[face[i]],
                                                  this.vertices[face2[i]]]);
            let x = 0,
                y = 0,
                z = 0;

            for (let [[x1, y1, z1], [x2, y2, z2]] of vertexpairs) {
                x += (y1 - y2) * (z1 + z2);
                y += (z1 - z2) * (x1 + x2);
                z += (x1 - x2) * (y1 + y2);
            }

            faceNormals.push(normalize([x, y, z]));
        }

        return faceNormals;
    }

    computeVertexNormals() {
        if (this.faces.length === 0) {
            return Array(this.vertices.length).fill([0, 0, 0]);
        }

        // element i will be the normals of the faces adjoining vertex i
        let vertexFaceNormals = Array(this.vertices.length).fill().map(() => []);

        for (let f of this.faces.keys()) {
            let normal = this.faceNormals[f];
            for (let vertex of this.faces[f]) {
                vertexFaceNormals[vertex].push(normal);
            }
        }

        let vertexNormals = [];

        for (let normals of vertexFaceNormals) {
            let x = 0,
                y = 0,
                z = 0;

            for (let [nx, ny, nz] of normals) {
                x += nx;
                y += ny;
                z += nz;
            }

            vertexNormals.push(normalize([x, y, z]));
        }

        return vertexNormals;
    }

    /**
     * Create a mesh like this one, transformed by the given matrix
     */
    transformed(transformation) {
        let rotateVertex = ([x, y, z]) => mult(transformation, [x, y, z, 1]).slice(0, 3),
            rotateNormal = ([x, y, z]) => normalize(mult(transformation, [x, y, z, 1]).slice(0, 3));

        let vertices = this.vertices.map(rotateVertex),
            faceNormals = this.faceNormals.map(rotateNormal),
            vertexNormals = this.vertexNormals.map(rotateNormal);

        return new Mesh(vertices, this.faces, faceNormals, vertexNormals, false);
    }

    /**
     * Create a mesh like this one, translated by the given amounts
     */
    translated(dx, dy, dz) {
        let vertices = this.vertices.map(
            ([x, y, z]) => [x + dx, y + dy, z + dz]);
        return new Mesh(vertices, this.faces, this.faceNormals, this.vertexNormals, false);
    }

    /**
     * Create a mesh like this one, scaled by the given amount
     */
    scaled(scale) {
        let vertices = this.vertices.map(
            ([x, y, z]) => [x * scale, y * scale, z * scale]);
        return new Mesh(vertices, this.faces, this.faceNormals, this.vertexNormals, false);
    }

    /**
     * Create a mesh like this one, rotated around the given axis by the given
     * amount (in degrees)
     */
    degRotated(degrees, axis) {
        return this.radRotated(toRadians(degrees), axis);
    }

    /**
     * Create a mesh like this one, rotated around the given axis by the given
     * amount (in radians)
     */
    radRotated(radians, axis) {
        let rotation = rotateRad(radians, axis),
            rotateVertex = ([x, y, z]) => mult(rotation, [x, y, z, 1]).slice(0, 3),
            rotateNormal = ([x, y, z]) => normalize(mult(rotation, [x, y, z, 1]).slice(0, 3));

        let vertices = this.vertices.map(rotateVertex),
            faceNormals = this.faceNormals.map(rotateNormal),
            vertexNormals = this.vertexNormals.map(rotateNormal);

        return new Mesh(vertices, this.faces, faceNormals, vertexNormals, false);
    }
}
