import { Bounds } from "./Bounds.js";
import { Mesh } from "./Mesh.js";
import { translate, mult, vec4, vec3 } from "./MV+.js";

import * as MV from "./MV+.js";

import { gl, setupBuffer } from "./setup.js";
import { AnimationTracker } from "./Animations.js";

/**
 * Default color for mobile strings
 */
const ARM_COLOR = [0.62745098, 0.32156863, 0.17647059].map(c => c * 2 / 3);

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
 * Tree-like structure representing the meshes forming a mobile
 *
 * @property {Mesh} mesh The mesh hanging from the mobile
 * @property {WireMesh} arms The lines connecting the mobile
 * @property {Material} material The mesh's material properties
 *
 * @property {Mobile} left The mobile handing from the left of this one
 * @property {Mobile} right The mobiles handing from the right of this one
 *
 * @property {Object} shader Shader locations
 * @property {WebGLUniformLocation} shader.modelMatrix
 * @param {GLUniformLocation} shader.useForceColor
 * @param {GLUniformLocation} shader.forceColor
 * @property {Object} shader.material Material property locations
 * @property {WebGLUniformLocation} shader.material.ambient
 * @property {WebGLUniformLocation} shader.material.diffuse
 * @property {WebGLUniformLocation} shader.material.specular
 * @property {WebGLUniformLocation} shader.material.shininess
 *
 * @property {Object} buffers WebGL buffers for data
 * @property {WebGLBuffer} buffers.vertices
 * @property {WebGLBuffer} buffers.normals
 * @property {WebGLBuffer} buffers.arms
 * @property {WebGLBuffer} buffers.arm_indices
 * @property {WebGLBuffer} buffers.reflection_positions
 *
 * @property {WebGLVertexArrayObject} vert_vao Vertex Array Object for flat shading the mesh
 * @property {WebGLVertexArrayObject} flat_vao Vertex Array Object for flat shading the mesh
 * @property {WebGLVertexArrayObject} arm_vao Vertex Array Object for arm rendering
 *
 * @property {WebGLVertexArrayObject} current_mesh_vao Whichever of vert_vao and flat_vao is being used
 *
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
     */
    static builder(mesh) {
        return new MobileBuilder(mesh);
    }

    /**
     * Constructor for mobiles. Do not call this directly; use {@link
     * Mobile.builder} instead.
     *
     * @param {Mesh} mesh The mesh at the top of the mobile
     * @param {Material} material The mesh's material properties
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
     * @param {number[][]} model_matrix A default matrix to apply to the mobile
     *
     * The model matrix will only apply to the root of a drawn mobile.
     *
     * The given mesh will be attached to its parent and children by vertical
     * lines connected to the origin.
     */
    constructor(mesh, material, arms,
                radius, parent_height, child_height,
                model_matrix = MV.mat4(),
                mesh_speed = DEFAULT_MESH_SPEED, mesh_direction,
                arm_speed = DEFAULT_ARM_SPEED, arm_direction,
                left, right) {
        this.mesh = mesh;
        this.material = material;
        this.arms = arms;
        this.radius = radius;
        this.parent_height = parent_height;
        this.child_height = child_height;
        this.model_matrix = model_matrix;

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
     * @param {Object} locations The locations of various shader variables
     * @param {WebGLUniformLocation} locations.modelMatrix The uniform model matrix
     * @param {GLint} locations.vertexPosition
     * @param {GLint} locations.vertexNormal
     * @param {GLint} locations.reflectionPosition Vertex position for lighting purposes
     * @param {Object} locations.material
     * @param {GLUniformLocation} locations.material.ambient Ambient coefficient
     * @param {GLUniformLocation} locations.material.diffuse Diffuse coefficient
     * @param {GLUniformLocation} locations.material.specular Specular coefficient
     * @param {GLUniformLocation} locations.material.shininess Material shininess
     * @param {GLUniformLocation} locations.useForceColor
     * @param {GLUniformLocation} locations.forceColor
     */
    setup(locations) {
        // Save locations for draw-time use
        this.shader = Object.freeze({
            material: locations.material,
            modelMatrix: locations.modelMatrix,
            useForceColor: locations.useForceColor,
            forceColor: locations.forceColor,
        });

        this.buffers = Object.freeze({
            vertices: gl.createBuffer(),
            normals: gl.createBuffer(),
            arms: gl.createBuffer(),
            arm_indices: gl.createBuffer(),
            reflection_positions: gl.createBuffer(),
            flat_normals: gl.createBuffer(),
        });

        // Prepare the VAOs for the mesh
        if (this.mesh.faces.length) {
            // VAO for vertex shading
            this.vert_vao = gl.vao.createVertexArrayOES();
            gl.vao.bindVertexArrayOES(this.vert_vao);

            setupBuffer(locations.vertexPosition,
                        this.mesh.vertices, this.buffers.vertices);

            setupBuffer(locations.vertexNormal,
                        this.mesh.vertexNormals, this.buffers.normals);

            // Reflect at each vertex
            setupBuffer(locations.reflectionPosition,
                        this.mesh.vertices, this.buffers.vertices);

            // VAO for flat shading
            this.flat_vao = gl.vao.createVertexArrayOES();
            gl.vao.bindVertexArrayOES(this.flat_vao);

            setupBuffer(locations.vertexPosition,
                        this.mesh.vertices, this.buffers.vertices);

            setupBuffer(locations.vertexNormal,
                        this.mesh.faceNormals, this.buffers.flat_normals);

            // Reflect from the barycenter of each face
            setupBuffer(locations.reflectionPosition,
                        this.mesh.barycenters, this.buffers.reflection_positions);

            this.current_mesh_vao = this.vert_vao;
        }

        // Prepare a VAO for the strings
        this.arm_vao = gl.vao.createVertexArrayOES();
        gl.vao.bindVertexArrayOES(this.arm_vao);
        setupBuffer(locations.vertexPosition,
                    this.arms.vertices, this.buffers.arms,
                    this.arms.indices, this.buffers.arm_indices);

        // Unbind buffers
        gl.vao.bindVertexArrayOES(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        if (this.left) this.left.setup(locations);
        if (this.right) this.right.setup(locations);

        this.rotation.start();
        this.armRotation.start();
    }

    /**
     * Draw the mobile
     */
    draw(modelMatrix = this.model_matrix, root = true) {
        // Apply the mesh's rotation
        let meshModelMatrix = MV.mult(modelMatrix, MV.rotateY(this.rotation.position)),
            meshNormalMatrix = MV.transpose(MV.inverse(MV.mat3(...meshModelMatrix)));

        gl.uniformMatrix4fv(this.shader.modelMatrix, false, MV.flatten(meshModelMatrix));

        // Draw mesh (skip empty mobile elements)
        if (this.mesh.faces.length) {
            // Set color
            this.bindMaterial();
            gl.vao.bindVertexArrayOES(this.current_mesh_vao);
            gl.drawArrays(gl.TRIANGLES, 0, this.mesh.vertices.length);
        }

        // Apply the arms' rotation
        let armModelMatrix = MV.mult(modelMatrix, MV.rotateY(this.armRotation.position)),
            armNormalMatrix = MV.mat3();

        gl.uniformMatrix4fv(this.shader.modelMatrix, false, MV.flatten(armModelMatrix));

        // Draw arms

        // Set arm color
        gl.uniform1i(this.shader.useForceColor, true);
        gl.uniform3fv(this.shader.forceColor, ARM_COLOR);

        gl.vao.bindVertexArrayOES(this.arm_vao);
        gl.drawElements(gl.LINES, this.arms.indices.flat(1).length, gl.UNSIGNED_BYTE, 0);

        gl.uniform1i(this.shader.useForceColor, false);

        // Draw children
        // (add a translation by this element's matrix to the children's model matrices)
        if (this.left) {
            this.left.draw(MV.mult(armModelMatrix, translate(-this.radius, 0, 0)), false);
        }
        if (this.right) {
            this.right.draw(MV.mult(armModelMatrix, translate(this.radius, 0, 0)), false);
        }

        if (root) {
            gl.vao.bindVertexArrayOES(null);
        }
    }

    /**
     * Make this mobile use vertex normals and vertex positions for non-flat shading
     */
    useVertexShading() {
        this.apply(that => {
            if (that.mesh.faces.length) {
                that.current_mesh_vao = that.vert_vao;
            }
        });
    }

    /**
     * Make this mobile use face normals and barycenters for flat shading
     */
    useFaceShading() {
        this.apply(that => {
            if (this.mesh.faces.length) {
                that.current_mesh_vao = that.flat_vao;
            }
        });
    }

    /**
     * Send the material to the shader
     */
    bindMaterial(material = this.material) {
        gl.uniform3fv(this.shader.material.ambient, material.ambient);
        gl.uniform3fv(this.shader.material.diffuse, material.diffuse);
        gl.uniform3fv(this.shader.material.specular, material.specular);
        gl.uniform1f(this.shader.material.shininess, material.shininess);
    }

    /**
     * Apply a function recursively to this mobile and its children
     */
    apply(callback) {
        callback(this);
        if (this.left) this.left.apply(callback);
        if (this.right) this.right.apply(callback);
    }
}


/**
 * Get all vertices in a mobile and its children, positioned correctly
 */
function allVertices(mobile, transform_acc = MV.mat4(), parent_radius = 0) {
    if (!mobile) {
        return [];
    }

    let transform = mult(transform_acc, mobile.model_matrix, translate(parent_radius, 0, 0)),
        mesh = mobile.mesh.transformed(transform);

    return mesh.vertices.concat(
        allVertices(mobile.left,  transform, -mobile.radius),
        allVertices(mobile.right, transform, +mobile.radius)
    );
}



class MobileBuilder {
    /**
     * If a parent is given, use its child and parent heights, and half its
     * radius.
     *
     * @param {Mesh} mesh
     * @param {?MobileBuilder} parent
     */
    constructor(mesh, parent = null) {
        if (!(mesh instanceof Mesh)) {
            throw new Error("MobileBuilder only accepts meshes");
        }
        this.mesh = mesh;
        this.hangPoint = [0, 0, 0];

        this._material = Object.seal({
            ambient: undefined,
            diffuse: undefined,
            specular: undefined,
            shininess: undefined,
        });

        if (parent) {
            this._parent = parent;

            this._radius = parent._radius / 2;

            let mat = parent._material;
            if (mat.ambient)  this._material.ambient  = Array.from(mat.ambient);
            if (mat.diffuse)  this._material.diffuse  = Array.from(mat.diffuse);
            if (mat.specular) this._material.specular = Array.from(mat.specular);
            if (mat.shininess) this._material.shininess = mat.shininess;
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
            full_child_height = this.child_height + height / 2,
            radius = this._radius ? this._radius : 0;

        // Increase translation by height to parent
        translate_y -= full_parent_height;

        // Translate vertices and create mesh
        let mesh = this.mesh.translated(0, translate_y, 0),
            center = [0, translate_y, 0];

        // Set material with defaults
        let material = Object.freeze({
            ambient: Float32Array.from(this._material.ambient),
            diffuse: Float32Array.from(this._material.diffuse),
            specular: Float32Array.from(this._material.specular),
            shininess: this._material.shininess
        });

        let arms = {
            vertices: [
                center, // (0)
                // (1) Top of upwards connector
                vec3(center.x, center.y + full_parent_height, center.z),
                // (2) Bottom of downwards connector
                vec3(center.x, center.y - full_child_height,  center.z),
                // (3) Left end of arm
                vec3(center.x - this._radius,
                     center.y - full_child_height,
                     center.z),
                // (4) Right end of arm
                vec3(center.x + this._radius,
                     center.y - full_child_height,
                     center.z)
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

        let model_matrix = translate(this.hangPoint.x,
                                     this.hangPoint.y,
                                     this.hangPoint.z);

        return new Mobile(mesh, material, arms,
                          this._radius, this.parent_height, this.child_height,
                          model_matrix,
                          this.spin_speed_source, this.spin_direction,
                          this.arm_speed_source, this.arm_direction,
                          left, right);
    }

    /**
     * Set the coordinate from which the mobile will hangs
     */
    hangingFrom([x, y, z]) {
        if (this._parent) {
            throw new Error("Can not hang a non-root mobile from a point");
        }
        this.hangPoint = [x, y, z];
        return this;
    }

    /**
     * Set default colors
     *
     * Overridden by {@link ambient}, {@link diffuse}, and {@link specular}
     */
    color(color) {
        let mat = this._material;
        if (!mat.ambient  || !mat.ambient.custom_set)  mat.ambient = Array.from(color);
        if (!mat.diffuse  || !mat.diffuse.custom_set)  mat.diffuse = Array.from(color);
        if (!mat.specular || !mat.specular.custom_set) mat.specular = Array.from(color);
        return this;
    }

    /**
     * Set material properties from object
     *
     * @param {Material} mat
     */
    material(mat) {
        this._material.ambient = Array.from(mat.ambient);
        this._material.diffuse = Array.from(mat.diffuse);
        this._material.specular = Array.from(mat.specular);
        this._material.shininess = mat.shininess;
        return this;
    }

    ambient(color) {
        this._material.ambient = Array.from(color);
        return this;
    }

    diffuse(color) {
        this._material.diffuse = Array.from(color);
        return this;
    }

    specular(color) {
        this._material.specular = Array.from(color);
        return this;
    }

    shininess(value) {
        this._material.shininess = value;
        return this;
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
     * @param {Mesh} mesh
     * @returns {MobileBuiler} The left child mobile builder
     *
     * The child inherits radius, heights, lighting coefficients, shininess,
     * speeds, and spin direction from its parent.
     *
     * The child has half its parent's radius, and the opposite arm direction.
     */
    left(mesh) {
        this.leftChild = new MobileBuilder(mesh, this);
        return this.leftChild;
    }

    /**
     * @param {number[]} color
     * @param {Mesh} mesh
     * @returns {MobileBuilder} The right child mobile builder
     *
     * The child inherits radius, heights, lighting coefficients, shininess,
     * speeds, and spin direction from its parent.
     *
     * The child has half its parent's radius, and the opposite arm direction.
     */
    right(mesh) {
        this.rightChild = new MobileBuilder(mesh, this);
        return this.rightChild;
    }

    /**
     * Get the parent mobile
     */
    parent() {
        if (this._parent) {
            return this._parent;
        }
        else {
            throw new Error("Can not get parent of root mobile");
        }
    }

    emptyLeft() {
        return this.left(new Mesh([vec3(0, 0, 0)], []))
            .parentHeight(0)
            .spinSpeed(0);
    }

    emptyRight() {
        return this.right(new Mesh([vec3(0, 0, 0)], []))
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
    let hasAnyChildren  = builder.leftChild || builder.rightChild,
        hasBothChildren = builder.leftChild && builder.RightChild;

    let msg;
    if (builder._radius === undefined && hasBothChildren) {
        msg = 'missing radius';
    }
    else if (builder._radius === 0 && hasBothChildren) {
        msg = 'can not have zero radius with two children';
    }
    else if (builder.parent_height === undefined) {
        msg = 'missing parent height';
    }
    // If has children, but no child height
    else if (builder.child_height === undefined && hasAnyChildren) {
        msg = 'missing child height';
    }
    // Checks for speed not strictly necessary
    else if (builder.spin_speed_source === undefined) {
        msg = 'missing spin speed';
    }
    else if (builder.arm_speed_source === undefined && hasAnyChildren) {
        msg = 'missing arm speed';
    }
    else if (Object.values(builder._material).some(k => k === undefined)) {
        console.log(builder._material);
        msg = 'missing material properties';
    }
    else {
        try {
            Array.from(builder.color);
        }
        catch (e) {
            msg = 'missing color';
        }
    }

    if (msg) {
        throw new Error(`MobileBuilder not ready: ${msg}`);
    }
}
