import { gl, setupBuffer, setupVec2Buffer } from "./setup.js";

import AbstractModel from "./AbstractModel.js";
import Bounds from "./Bounds.js";
import Mesh from "./Mesh.js";

import stone_texture from "../textures/stones.bmp";
import grass_texture from "../textures/grass.bmp";
import sky_texture from "../textures/sky.jpg";


const IDMAT4 = new Float32Array([1,0,0,0,
                                 0,1,0,0,
                                 0,0,1,0,
                                 0,0,0,1]);

export default class Walls extends AbstractModel {
    static from(locations, texture_wall_setting, material, left, right, bottom, top, near, far) {
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

        let w = mesh.bounds.width / 10,
            h = mesh.bounds.height / 10,
            d = mesh.bounds.depth / 10;

        let tex_coords = new Float32Array([
            [d,0,  0,0,  0,h,  d,h], // left
            [w,0,  0,0,  0,d,  w,d], // bottom
            [w,h,  w,0,  0,0,  0,h], // far
            [0,h,  d,h,  d,0,  0,0], // right
            [0,d,  w,d,  w,0,  0,0], // top
            [w,h,  w,0,  0,0,  0,h], // near
        ].flat(1));

        return new Walls(locations, texture_wall_setting, material, mesh, tex_coords);
    }

    constructor(locations, texture_wall_setting, material, mesh, tex_coords) {
        super(material, mesh);

        this.useTexture = texture_wall_setting;

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

        this.textures = Object.freeze({
            stone: 1,
            grass: 2,
            sky: 3,
        });

        prepareAsyncTexture(this.textures.stone, stone_texture, [128, 128, 128]);
        prepareAsyncTexture(this.textures.grass, grass_texture, [0, 128, 0]);
        prepareAsyncTexture(this.textures.sky, sky_texture, [135, 206, 236]);

        let {stone, grass, sky} = this.textures;

        this.walls = Object.freeze([
            {offset:  0, texture: stone}, // left
            {offset:  4, texture: grass}, // bottom
            {offset:  8, texture: stone}, // far
            {offset: 12, texture: stone}, // right
            {offset: 16, texture: sky}, // top
            {offset: 20, texture: stone}, // near
        ]);
    }

    draw() {
        this.setUniforms();

        if (this.useTexture()) {
            gl.uniform1i(this.shader.useTexture, true);
        }

        gl.uniformMatrix4fv(this.shader.modelMatrix, false, IDMAT4);

        gl.vao.bindVertexArrayOES(this.vaos.active);

        for (let {offset, texture} of this.walls) {
            gl.uniform1i(this.shader.texture, texture);
            gl.drawArrays(gl.TRIANGLE_FAN, offset, 4);
        }

        gl.uniform1i(this.shader.useTexture, false);
    }
}

/**
 * Load a texture asynchronously
 *
 * @param {number} index The texture index to save this texture as
 * @param {string} url The path to the texture image
 * @param {UINT8[]} placeholder_color An RGB color to use until the texture loads
 */
function prepareAsyncTexture(index, url, placeholder_color = [255, 0, 255]) {
    let buffer = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0 + index);

    gl.bindTexture(gl.TEXTURE_2D, buffer);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([...placeholder_color, 255]));

    let image = document.createElement('img');

    image.addEventListener('load', () => {
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    });

    image.src = url;
}
