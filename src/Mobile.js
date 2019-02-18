import { Bounds } from "./Bounds.js";
import { Mesh } from "./Mesh.js";
import { translate, mult, vec4, vec3 } from "./MV+.js";

import * as MV from "./MV+.js";

import { gl } from "./setup.js";
import { AnimationTracker } from "./Animations.js";

/**
 * Default color for mobile strings
 */
const ARM_COLOR = vec4(0.62745098, 0.32156863, 0.17647059, 1);

           /** Default speed for all mobiles' meshes */
export let DEFAULT_MESH_SPEED = () => 0.05,
           /** Default speed for all mobiles' arms */
           DEFAULT_ARM_SPEED = () => 0.05;

/**
 * @typedef {Object} WireMesh
 * @property {number[][]} vertices The mesh's vertices
 * @property {[number, number][]} indices The mesh's lines as list of index pairs
 */

/**
 * Prepare buffers for the given {@code vec3(float32)} attribute
 *
 * @param attribute The WebGL attribute to prepare
 * @param {number[][]} data The data to put in the array buffer
 * @param {number[][]} indices An index array for the data
 */
function setupBuffers(attribute, data, indices) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());

    gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribute);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.flat(1)), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices.flat(1)), gl.STATIC_DRAW);
}


/**
 * Tree-like structure representing the meshes forming a mobile
 *
 * @property {Mesh} mesh The mesh hanging from the mobile
 * @property {Float32Array} color The mesh's color
 * @property {WireMesh} arms The lines connecting the mobile
 * @property {Mobile} left The mobile handing from the left of this one
 * @property {Mobile} right The mobiles handing from the right of this one
 * @property {WebGLUniformLocation} colorLocation Location of shader color variable
 * @param {WebGLUniformLocation} modelMatrixLocation The location of the shader's model matrix
 * @property {AnimationTracker} rotation The tracker for this mobile element's rotation
 * @property {AnimationTracker} armRotation The tracker for the arms' rotation
 *
 * The following properties exist for Mobile construction only.
 * @property {number} radius The radius of the mobile's child arms
 * @property {number} parent_height The length of the upwards arm
 * @property {number} child_height The length of the downwards arm
 */
export class Mobile {
    /**
     * Get a {@link MobileBuilder} for a mobile with the given mesh and color
     * @param {Mesh} mesh
     * @param {number[]} color
     */
    static builder(mesh, color) {
        return new MobileBuilder(mesh, color);
    }

    /**
     * Constructor for mobiles. Do not call this directly; use {@link
     * Mobile.builder} instead.
     *
     * @param {Mesh} mesh The mesh at the top of the mobile
     * @param {Float32Arrray} color The mesh's color
     * @property {WireMesh} arms The lines connecting the mobile
     * @param {number} radius The radius of the mobile's child arms
     * @param {number} parent_height The length of the upwards arm
     * @param {?number} child_height The length of the downwards arm
     * @param {number} arm_direction The direction of the arms' rotation (sign only)
     * @param {number} mesh_direction The direction of the mesh's rotation (sign only)
     * @param {number} mesh_speed The speed of the mesh's rotation
     * @param {number} arm_speed The speed of the arms' rotation
     * @param {Mobile} left The element hanging from the left of the mobile
     * @param {Mobile} right The element hanging from the right of the mobile
     *
     * The given mesh will be attached to its parent and children by vertical
     * lines connected to its midpoint.
     */
    constructor(mesh, color, arms,
                radius, parent_height, child_height,
                mesh_speed = DEFAULT_MESH_SPEED, mesh_direction,
                arm_speed = DEFAULT_ARM_SPEED, arm_direction,
                left, right) {
        this.mesh = mesh;
        this.color = color;
        this.arms = arms;
        this.radius = radius;
        this.parent_height = parent_height;
        this.child_height = child_height;

        this.left = left;
        this.right = right;

        this.rotation = new AnimationTracker(mesh_speed);
        this.rotation.scale = Math.sign(mesh_direction);
        this.armRotation = new AnimationTracker(arm_speed);
        this.armRotation.scale = Math.sign(arm_direction);
    }

    /**
     * Compute a bounding box of this mobile
     */
    bounds() {
        return Bounds.fromVecs(allVertices(this));
    }

    /**
     * Set up the vertex array objects for the mobile and its children
     *
     * @param {WebGLUniformLocation} modelMatrix The location of the shader's model matrix
     * @param {GLint} position The location of the shader's position attribute
     * @param {GLint} color The location of the shader's color attribute
     */
    setup(modelMatrix, position, color) {
        // Save the color are model matrix for draw time
        this.colorLocation = color;
        this.modelMatrixLocation = modelMatrix;

        // Prepare a VAO for the mesh
        if (this.mesh.vertices.length) {
            this.mesh_vao = gl.vao.createVertexArrayOES();
            gl.vao.bindVertexArrayOES(this.mesh_vao);
            setupBuffers(position, this.mesh.vertices, this.mesh.faces);
        }

        // Prepare a VAO for the strings
        this.arm_vao = gl.vao.createVertexArrayOES();
        gl.vao.bindVertexArrayOES(this.arm_vao);
        setupBuffers(position, this.arms.vertices, this.arms.indices);

        // Unbind buffers
        gl.vao.bindVertexArrayOES(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        if (this.left) this.left.setup(modelMatrix, position, color);
        if (this.right) this.right.setup(modelMatrix, position, color);

        this.rotation.start();
        this.armRotation.start();
    }

    /**
     * Draw the mobile
     */
    draw(modelMatrix = MV.mat4()) {
        let meshModelMatrix = MV.mult(modelMatrix, MV.rotateY(this.rotation.position));

        gl.uniformMatrix4fv(this.modelMatrixLocation,
                            false,
                            MV.flatten(meshModelMatrix));

        // Draw mesh
        if (this.mesh.vertices.length) {
            // Set color
            gl.uniform4fv(this.colorLocation, this.color);

            gl.vao.bindVertexArrayOES(this.mesh_vao);
            gl.drawElements(gl.TRIANGLES, this.mesh.faces.flat(1).length, gl.UNSIGNED_BYTE, 0);
        }

        // Draw arms
        let armModelMatrix = MV.mult(modelMatrix, MV.rotateY(this.armRotation.position));
        gl.uniformMatrix4fv(this.modelMatrixLocation,
                            false,
                            MV.flatten(armModelMatrix));

        gl.uniform4fv(this.colorLocation, ARM_COLOR);
        gl.vao.bindVertexArrayOES(this.arm_vao);
        gl.drawElements(gl.LINES, this.arms.indices.flat(1).length, gl.UNSIGNED_BYTE, 0);

        if (this.left) {
            this.left.draw(MV.mult(armModelMatrix, translate(-this.radius, 0, 0)));
        }
        if (this.right) {
            this.right.draw(MV.mult(armModelMatrix, translate(this.radius, 0, 0)));
        }
    }
}


/**
 * Get all vertices in a mobile and its children, positioned correctly
 */
function allVertices(mobile, radius_acc = 0) {
    if (!mobile) {
        return [];
    }
    let mesh = mobile.mesh.translated(radius_acc, 0, 0);
    return mesh.vertices.concat(
        allVertices(mobile.left, radius_acc - mobile.radius),
        allVertices(mobile.right, radius_acc + mobile.radius)
    );
}

class MobileBuilder {
    /**
     * If a parent is given, use its child and parent heights, and half its
     * radius.
     *
     * @param {Mesh} mesh
     * @param {number[]} color
     * @param {?MobileBuilder} parent
     */
    constructor(mesh, color, parent = null) {
        if (!(mesh instanceof Mesh)) {
            throw new Error("MobileBuilder only accepts meshes");
        }
        this.mesh = mesh;
        this.color = color;

        if (parent) {
            this._radius = parent._radius / 2;

            this.parent_height = parent.parent_height;
            this.child_height = parent.child_height;
            this.spin_speed_source = parent.spin_speed_source;
            this.arm_speed_source = parent.arm_speed_source;
            this.spin_direction = parent.spin_direction;

            this.arm_direction = -parent.arm_direction;
        }
        else {
            this.spin_speed_source = DEFAULT_MESH_SPEED;
            this.arm_speed_source = DEFAULT_ARM_SPEED;
            this.spin_direction = 1;
            this.arm_direction = -1;
        }
    }

    build(translate_y = 0) {
        assertBuilderComplete(this);
        let height = this.mesh.bounds.height,
            full_parent_height = this.parent_height + height / 2,
            full_child_height = this.child_height + height / 2;

        // Increase translation by height to parent
        translate_y -= full_parent_height;

        // Translate vertices and create mesh
        let mesh = this.mesh.translated(0, translate_y, 0),
            midpoint = mesh.bounds.midpoint;

        let color = Float32Array.from(this.color);

        let arms = {
            vertices: [
                midpoint, // (0)
                // (1) Top of upwards connector
                vec3(midpoint.x, midpoint.y + full_parent_height, midpoint.z),
                // (2) Bottom of downwards connector
                vec3(midpoint.x, midpoint.y - full_child_height,  midpoint.z),
                // (3) Left end of arm
                vec3(midpoint.x - this._radius,
                     midpoint.y - full_child_height,
                     midpoint.z),
                // (4) Right end of arm
                vec3(midpoint.x + this._radius,
                     midpoint.y - full_child_height,
                     midpoint.z)
            ],
            indices: [[0, 1]] // always connect to parent
        };

        // Increase translation for children
        translate_y -= full_child_height;

        // Add children and child connectors
        let left, right;
        if (this.leftChild) {
            left = this.leftChild.build(translate_y);
            arms.indices.push([2, 3]);
        }
        if (this.rightChild) {
            right = this.rightChild.build(translate_y);
            arms.indices.push([2, 4]);
        }
        if (this.leftChild || this.rightChild) {
            arms.indices.push([0, 2]); // connect mesh to arms
        }

        return new Mobile(mesh, color, arms,
                          this._radius, this.parent_height, this.child_height,
                          this.spin_speed_source, this.spin_direction,
                          this.arm_speed_source, this.arm_direction,
                          left, right);
    }

    radius(r) {
        this._radius = r;
        return this;
    }

    parentHeight(parent_height) {
        this.parent_height = parent_height;
        return this;
    }

    childHeight(child_height) {
        this.child_height = child_height;
        return this;
    }

    spinSpeed(speed_source, direction = 1) {
        setSpeedProperty(this, 'spin_speed_source', speed_source);
        return this;
    }

    armSpeed(speed_source) {
        setSpeedProperty(this, 'arm_speed_source', speed_source);
        return this;
    }

    /** Only sign matters */
    spinDirection(direction) {
        this.spin_direction = Math.sign(direction);
        return this;
    }

    /** Only sigh matters */
    armDirection(direction) {
        this.arm_direction = Math.sign(direction);
        return this;
    }

    /**
     * @param {number[]} color
     * @param {Mesh} mesh
     * @returns {MobileBuiler} The left child mobile builder
     *
     * The child inherits radius, color, heights, speeds, and spin direction
     * from its parent.
     *
     * The child has half its parent's radius, and the opposite arm direction.
     */
    left(mesh, color) {
        this.leftChild = new MobileBuilder(mesh, color, this);
        return this.leftChild;
    }

    /**
     * @param {number[]} color
     * @param {Mesh} mesh
     * @returns {MobileBuilder} The right child mobile builder
     *
     * The child inherits radius, heights, speeds, and spin direction from its
     * parent.
     *
     * The child has half its parent's radius, and the opposite arm direction.
     */
    right(mesh, color) {
        this.rightChild = new MobileBuilder(mesh, color, this);
        return this.rightChild;
    }

    /**
     * Get the parent mobile
     */
    parent() {
        if (this.parent) {
            return this.parent;
        }
        else {
            throw new Error("Can not get parent of root mobile");
        }
    }

    emptyLeft() {
        return this.left(new Mesh([vec3(0, 0, 0)], []), [0,0,0,0])
            .parentHeight(0)
            .spinSpeed(0);
    }

    emptyRight() {
        return this.right(new Mesh([vec3(0, 0, 0)], []), [0,0,0,0])
            .parentHeight(0)
            .spinSpeed(0);
    }
}

/**
 * Set a speed property on a {@link MobileBuilder} to a constant or a supplier
 * function
 */
function setSpeedProperty(builder, property, value) {
    if (typeof value === 'number') {
        builder[property] = () => value;
    }
    else {
        builder[property] = value;
    }
}

/**
 * Throw an error if the given {@link MobileBuilder} is incomplete
 */
function assertBuilderComplete(builder) {
    let prop;
    if (builder._radius === undefined) {
        prop = 'radius';
    }
    else if (builder.parent_height === undefined) {
        prop = 'parent height';
    }
    // If has children, but no child height
    else if (builder.child_height === undefined &&
             (builder.leftChild || builder.rightChild)) {
        prop = 'child height';
    }
}
