import { gl, setupBuffer, setupVec2Buffer } from "./setup.js";

import AbstractModel from "./AbstractModel.js";
import Bounds from "./Bounds.js";
import Mesh from "./Mesh.js";

import stone_texture from "../textures/stones.bmp";
import grass_texture from "../textures/grass.bmp";


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
            mesh = new Mesh(vertices, faces),
            tex_coords = Array(6).fill([
                0, 0,
                0, 1,
                1, 1,
                1, 0
            ]);

        return new Walls(locations, material, mesh, tex_coords);
    }

    constructor(locations, material, mesh, tex_coords) {
        super(material, mesh);

        this.bounds = this.mesh.bounds;

        this.shader = Object.freeze({
            modelMatrix: locations.modelMatrix,
            material: locations.material,
            useTexture: locations.useTexture,
            texture: locations.texture,
        });

        this.buffers.texture = gl.createBuffer();
        super.setup(locations);

        gl.vao.bindVertexArrayOES(this.vaos.vert);
        setupVec2Buffer(locations.textureCoordinate, tex_coords, this.buffers.texture);
        gl.vao.bindVertexArrayOES(null);

        this.texture_buffers = Object.freeze({
            stone: gl.createTexture(),
            grass: gl.createTexture(),
        });

        this.textures = Object.freeze({
            stone: 1,
            grass: 2,
        });

        gl.activeTexture(gl.TEXTURE0 + this.textures.stone);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_buffers.stone);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new Uint8Array([128, 128, 128, 255]));

        gl.activeTexture(gl.TEXTURE0 + this.textures.grass);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_buffers.grass);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new Uint8Array([0, 128, 0, 255]));

        let {stone, grass} = this.textures;

        this.walls = Object.freeze([
            {offset:  0, texture: stone},
            {offset:  4, texture: grass},
            {offset:  8, texture: stone},
            {offset: 12, texture: stone},
            {offset: 16, texture: stone},
            {offset: 20, texture: stone},
        ]);
    }

    draw() {
        gl.uniform1i(this.shader.useTexture, true);
        this.setUniforms();

        gl.uniformMatrix4fv(this.shader.modelMatrix, false, IDMAT4);

        gl.vao.bindVertexArrayOES(this.vaos.active);

        for (let {offset, texture} of this.walls) {
            gl.uniform1i(this.shader.texture, texture);
            gl.drawArrays(gl.TRIANGLE_FAN, offset, 4);
        }

        gl.uniform1i(this.shader.texture, 0);
        gl.uniform1i(this.shader.useTexture, false);
    }
}
