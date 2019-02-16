import { Bounds } from "./Bounds.js";
import { Mesh } from "./Mesh.js";
import { translate, mult, vec4, vec3 } from "./MV+.js";

import * as MV from "./MV+.js";

import { gl } from "./setup.js";

/**
 * A mesh represented by two arrays; the parameters to the {@link Mesh}
 * constructor.
 * @typedef {Object} PlainMesh
 * @property {number[][]} vertices Array of vertices
 * @property {number[][]} faces Index array of faces
 */

/**
 * @typedef {(Mesh|PlainMesh)} MeshLike
 */

/**
 * Tree-like structure representing the meshes forming a mobile
 *
 * @property {Mesh} mesh
 * @property connectors The connecting elements
 * @property {Mobile} left The mobile handing from the left of this one
 * @property {Mobile} right The mobiles handing from the right of this one
 *
 * @property {number} radius The radius of the mobile's child arms
 * @property {number} parent_height The length of the upwards arm
 * @property {number} child_height The length of the downwards arm
 *
 * A mobile with a number of children besides 0 or 2 may behave in unexpected
 * manners.
 */
export class Mobile {
    /**
     * Compute a bounding box of this mobile
     */
    get bounds() {
        return Bounds.fromVecs(mobileVertices(this));
    }

    /**
     * Set up the vertex array objects for the mobile and its children
     *
     * @param position The location of the shader's position attribute
     */
    setup(position) {
        this.vao = gl.vao.createVertexArrayOES();
        gl.vao.bindVertexArrayOES(this.vao);

        this.constructor.setupBuffers(position, this.mesh.vertices, this.mesh.faces);

        // Add strings to the mobile
        this.addLines();

        this.line_vao = gl.vao.createVertexArrayOES();
        gl.vao.bindVertexArrayOES(this.line_vao);

        this.constructor.setupBuffers(position, this.lines, this.line_indices);

        // Unbind buffers
        gl.vao.bindVertexArrayOES(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        if (this.left  !== null) this.left.setup(position);
        if (this.right !== null) this.right.setup(position);
    }

    /**
     * Prepare buffers for the given {@code vec3(float32)} attribute
     *
     * @param attribute The WebGL attribute to prepare
     * @param {number[][]} data The data to put in the array buffer
     * @param {number[][]} indices An index array for the data
     */
    static setupBuffers(attribute, data, indices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());

        gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribute);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.flat(1)), gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices.flat(1)), gl.STATIC_DRAW);
    }

    /**
     * Draw the mobile
     *
     * @param modelMatrix The location of the shader's model matrix
     */
    draw(modelMatrix) {
        gl.uniformMatrix4fv(modelMatrix,
                            false,
                            MV.flatten(MV.mat4()));

        gl.vao.bindVertexArrayOES(this.vao);
        gl.drawElements(gl.TRIANGLES, this.mesh.faces.flat(1).length, gl.UNSIGNED_BYTE, 0);

        gl.vao.bindVertexArrayOES(this.line_vao);
        gl.drawElements(gl.LINES, this.line_indices.flat(1).length, gl.UNSIGNED_BYTE, 0);

        if (this.left  !== null) this.left.draw(modelMatrix);
        if (this.right !== null) this.right.draw(modelMatrix);
    }

    /**
     * Add connecting strings to the mobile
     */
    addLines() {
        let midpoint = this.mesh.bounds.midpoint;
        this.lines = [
            // parent line
            midpoint, vec3(mult(translate(0, this.parentHeight(), 0), vec4(midpoint))),
            // child lines
            midpoint, vec3(mult(translate(0, -this.childHeight(), 0), vec4(midpoint))),
            // child arms
            vec3(midpoint.x - this.radius,
                 midpoint.y - this.childHeight(),
                 midpoint.z),
            vec3(midpoint.x + this.radius,
                 midpoint.y - this.childHeight(),
                 midpoint.z)
        ];
        this.line_indices = [[0, 1]];
        if (this.left || this.right) {
            this.line_indices.push([2, 3], [4, 5]);
        }
    }

    //// Mobile construction functions
    // (These aren't very nice.)

    /**
     * @param {MeshLike} mesh The mesh at the top of the mobile
     * @param {number} parent_height The length of the upwards arm
     * @param {?number} child_height The length of the downwards arm
     * @param {number} radius The radius of the mobile's child arms
     *
     * The given mesh will be attached to its parent and children by vertical
     * lines connected to its midpoint.
     */
    constructor(mesh, radius, parent_height, child_height) {
        if (!(mesh instanceof Mesh)) {
            mesh = new Mesh(mesh.vertices, mesh.faces);
        }
        this.mesh = mesh;

        this.radius = radius;
        this.parent_height = parent_height;
        this.child_height = (child_height === null
                             ? parent_height
                             : child_height);

        this.left = null;
        this.right = null;

        let midpoint = this.mesh.bounds.midpoint;
    }

    /** Get parent height as measured from the center of the mesh */
    parentHeight() {
        return this.parent_height + this.mesh.bounds.height / 2;
    }

    /** Get child height as measured from the center of the mesh */
    childHeight() {
        return this.child_height + this.mesh.bounds.height / 2;
    }

    /**
     * Add a child to the mobile
     *
     * @param {'left'|'right'} side The side of the mobile to add the child to
     * @param {MeshLike} mesh The mesh to use fo the child object
     * @param {number} parent_height The length of the upwards arm; defaults to
     *                               this mobile's parent height
     * @param {?number} child_height The length of the downwards arm; defaults
     *                               to this mobile's child height
     * @param {number} radius The child's radius; defaults to half of this
     *                        mobile's radius
     *
     * @returns {Mobile} The newly-added child
     */
    addChild(side, mesh, radius, parent_height, child_height) {
        if (side !== 'left' && side !== 'right') {
            throw new Error('invalid side of mobile');
        }

        if (!(mesh instanceof Mesh)) {
            mesh = new Mesh(mesh.vertices, mesh.faces);
        }

        radius        = (radius === undefined ? (this.radius / 2) : radius),
        child_height  = (child_height  === undefined ? this.child_height  : child_height),
        parent_height = (parent_height === undefined ? this.parent_height : parent_height);

        let child = new Mobile(mesh, radius, parent_height, child_height);

        let direction = (side === 'left' ? -1 : +1),
            translation = translate(
                this.mesh.bounds.midpoint.x + direction * this.radius,
                this.mesh.bounds.midpoint.y - this.childHeight() - child.parentHeight(),
                this.mesh.bounds.midpoint.z
            );

        let new_vertices = child.mesh.vertices.map(v => mult(translation, vec4(v)));

        child.mesh = new Mesh(new_vertices, child.mesh.faces);

        this[side] = child;
        return child;
    }

    /**
     * Add the left child to the mobile
     *
     * @see addChild
     */
    addLeft(mesh, radius, parent_height, child_height) {
        return this.addChild('left', mesh, radius, parent_height, child_height);
    }

    /**
     * Add the right child to the mobile
     *
     * @see addChild
     */
    addRight(mesh, radius, parent_height, child_height) {
        return this.addChild('right', mesh, radius, parent_height, child_height);
    }
}


/**
 * Get a list of all vertices in a mobile
 */
function mobileVertices(mobile) {
    return mobile.mesh.vertices.concat(
        mobile.left ? mobileVertices(mobile.left) : [],
        mobile.right ? mobileVertices(mobile.right) : []);
}
