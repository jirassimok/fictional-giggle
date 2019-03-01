import { gl, setupBuffer } from "./setup.js";

export default class AbstractModel {
    constructor(material, mesh) {
        this.material = material;
        this.mesh = mesh;

        this.buffers = {
            vertices: gl.createBuffer(),
            normals: gl.createBuffer(),
            reflection_positions: gl.createBuffer(),
            flat_normals: gl.createBuffer(),
        };
    }

    setup(locations) {
        Object.freeze(this.buffers);

        this.vaos = Object.seal({
            vert: gl.vao.createVertexArrayOES(),
            flat: gl.vao.createVertexArrayOES(),
            active: null,
        });

        // VAO for vertex shading
        gl.vao.bindVertexArrayOES(this.vaos.vert);

        setupBuffer(locations.vertexPosition,
                    this.mesh.vertices, this.buffers.vertices);

        setupBuffer(locations.vertexNormal,
                    this.mesh.vertexNormals, this.buffers.normals);

        // Reflect at each vertex
        setupBuffer(locations.reflectionPosition,
                    this.mesh.vertices, this.buffers.vertices);

        // VAO for flat shading
        gl.vao.bindVertexArrayOES(this.vaos.flat);

        setupBuffer(locations.vertexPosition,
                    this.mesh.vertices, this.buffers.vertices);

        setupBuffer(locations.vertexNormal,
                    this.mesh.faceNormals, this.buffers.flat_normals);

        // Reflect from the barycenter of each face
        setupBuffer(locations.reflectionPosition,
                    this.mesh.barycenters, this.buffers.reflection_positions);

        this.vaos.active = this.vaos.vert;
    }

    draw() {
        throw new Error("Not implemented");
    }

    setUniforms() {
        this.bindMaterial();
    }

    /**
     * Make this model use vertex normals and vertex positions for non-flat shading
     */
    useVertexShading() {
        this.vaos.active = this.vaos.vert;
    }

    /**
     * Make this model use face normals and barycenters for flat shading
     */
    useFaceShading() {
        this.vaos.active = this.vaos.flat;
    }

    // TODO: bind this.shader.material during or before setup
    /**
     * Send the material to the shader
     *
     * NOTE: This function expects {@code shader.material} to be bound
     */
    bindMaterial(material = this.material) {
        gl.uniform3fv(this.shader.material.ambient, material.ambient);
        gl.uniform3fv(this.shader.material.diffuse, material.diffuse);
        gl.uniform3fv(this.shader.material.specular, material.specular);
        gl.uniform1f(this.shader.material.shininess, material.shininess);
    }
}
