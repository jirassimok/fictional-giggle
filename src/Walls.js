import { gl, setupBuffer } from "./setup.js";

import AbstractModel from "./AbstractModel.js";
import Bounds from "./Bounds.js";
import Mesh from "./Mesh.js";

const IDMAT4 = new Float32Array([1,0,0,0,
                                 0,1,0,0,
                                 0,0,1,0,
                                 0,0,0,1]);

export default class Walls extends AbstractModel {
    static from(locations, material, left, right, bottom, top, near, far) {
        let b = new Bounds(left, right, bottom, top, near, far),
            vertices = [
                // left
                [b.left, b.bottom, b.far],
                [b.left, b.bottom, b.near],
                [b.left, b.top, b.near],
                [b.left, b.top, b.far],

                // bottom
                [b.left, b.bottom, b.far],
                [b.right, b.bottom, b.far],
                [b.right, b.bottom, b.near],
                [b.left, b.bottom, b.near],

                // far
                [b.left, b.bottom, b.far],
                [b.left, b.top, b.far],
                [b.right, b.top, b.far],
                [b.right, b.bottom, b.far],

                // right
                [b.right, b.bottom, b.far],
                [b.right, b.bottom, b.near],
                [b.right, b.top, b.near],
                [b.right, b.top, b.far],

                // top
                [b.left, b.top, b.far],
                [b.right, b.top, b.far],
                [b.right, b.top, b.near],
                [b.left, b.top, b.near],

                // near
                [b.left, b.bottom, b.near],
                [b.left, b.top, b.near],
                [b.right, b.top, b.near],
                [b.right, b.bottom, b.near],
            ],
            faces = [
                [3, 2, 1, 0], // left
                [7, 6, 5, 4], // bottom
                [11, 10, 9, 8], // far
                [12, 13, 14, 15], // right
                [16, 17, 18, 19], // top
                [20, 21, 22, 23], // near
            ],
            mesh = new Mesh(vertices, faces);

        return new Walls(locations, material, mesh);
    }

    constructor(locations, material, mesh) {
        super(material, mesh);

        this.shader = Object.freeze({
            modelMatrix: locations.modelMatrix,
            material: locations.material,
        });

        super.setup(locations);
    }

    draw() {
        this.setUniforms();

        gl.uniformMatrix4fv(this.shader.modelMatrix, false, IDMAT4);

        gl.vao.bindVertexArrayOES(this.vaos.active);
        for (let offset of [0, 4, 8, 12, 16, 20]) {
            gl.drawArrays(gl.TRIANGLE_FAN, offset, 4);
        }
    }
}
