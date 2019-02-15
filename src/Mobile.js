import { Mesh } from "./Mesh.js";

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
 * @property {Mobile[]} children The mobiles handing from this one
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
     * @param {MeshLike} mesh The mesh at the top of the mobile
     * @param {number} radius The radius of the mobile's child arms
     * @param {number} parent_height The length of the upwards arm
     * @param {?number} child_height The length of the downwards arm
     *
     * The given mesh will be attached to its parent and children by vertical
     * lines connected to the midpoints of its top and bottom planes,
     * respectively.
     *
     * If {@code child_height} is not given, {@code parent_height} is used
     * instead.
     */
    constructor(mesh, radius, parent_height, child_height = null) {
        if (!(mesh instanceof Mesh)) {
            mesh = new Mesh(mesh.vertices, mesh.faces);
        }
        this.mesh = mesh;

        this.radius = radius;
        this.parent_height = parent_height;
        this.child_height = (child_height === null ? parent_height : child_height);

        this.children = [];

        let midpoint = this.mesh.bounds.midpoint;
    }

    /**
     * Compute a bounding box of this mobile
     */
    get bounds() {
        return mobileVertices(this);
    }

    /**
     * Add a child to the mobile
     *
     * @param {MeshLike} mesh The mesh to use fo the child object
     * @param {number} radius The child's radius; defaults to half of this
     *                        mobile's radius
     * @param {number} parent_height The length of the upwards arm; defaults to
     *                               this mobile's parent height
     * @param {?number} child_height The length of the downwards arm; defaults
     *                               to this mobile's child height
     *
     * @returns {Mobile} The newly-added child
     */
    addChild(mesh, radius, parent_height, child_height) {
        let child = new Mobile(
            mesh,
            radius === undefined ? this.radius / 2 : radius,
            child_height === undefined ? this.child_height : child_height,
            parent_height === undefined ? this.parent_height : parent_height
        );
        this.children.push(child);
        return child;
    }
}


/**
 * Get a list of all vertices in a mobile
 */
function mobileVertices(mobile) {
    return mobile.mesh.vertices.concat(mobile.children.flatMap(mobileVertices));
}
