import { normalize } from "./MV+.js";
import { gl, setupBuffer } from "./setup.js";

/**
 * A spot light
 *
 * @param {number[]} position
 * @param {number[]} direction Normalized direction vector
 * @param {number} angle Spotlight radius
 * @param {number[]} ambient
 * @param {number[]} diffuse
 * @param {number[]} specular
 *
 * @param {Object} shader The shader locations for relevant variables
 * @param {GLint} shader.position
 * @param {GLint} shader.vertexNormal
 * @param {GLUniformLocation} shader.modelMatrix
 * @param {GLUniformLocation} shader.forceColor
 * @param {GLUniformLocation} shader.useForceColor
 * @param {Object} shader.light
 * @param {GLUniformLocation} shader.light.position
 * @param {GLUniformLocation} shader.light.direction
 * @param {GLUniformLocation} shader.light.cosAngle
 * @param {GLUniformLocation} shader.light.ambient
 * @param {GLUniformLocation} shader.light.diffuse
 * @param {GLUniformLocation} shader.light.specular
 */
export class Light {
    // JSDoc does not handle renamed destructured parameters
    // {position: vertexPosition}
    /**
     * @param {Light} obj A light source object
     * @param {number[]} obj.position
     * @param {number[]} obj.direction Direction vector; will be normalized
     * @param {number} obj.angle Spotlight radius
     * @param {number[]} obj.ambient
     * @param {number[]} obj.diffuse
     * @param {number[]} obj.specular
     *
     * @param {Object}  The shader locations for relevant variables
     * @param {GLint} [loc.position: vertexPosition]
     * @param {GLint} loc.vertexNormal
     * @param {GLUniformLocation} loc.modelMatrix
     * @param {GLUniformLocation} loc.forceColor
     * @param {GLUniformLocation} loc.useForceColor
     * @param {Object} loc.light
     * @param {GLUniformLocation} loc.light.position
     * @param {GLUniformLocation} loc.light.direction
     * @param {GLUniformLocation} loc.light.cosAngle
     * @param {GLUniformLocation} loc.light.ambient
     * @param {GLUniformLocation} loc.light.diffuse
     * @param {GLUniformLocation} loc.light.specular
     */
    constructor({position: vertexPosition,
                 vertexNormal, modelMatrix, forceColor, useForceColor, light},
                {position, direction, angle, ambient, diffuse, specular}) {
        this.position = position;
        this.direction = normalize(direction);
        this.angle = angle;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular =  specular;

        // For drawing the light source
        this.vao = gl.vao.createVertexArrayOES();
        this.positionBuffer = gl.createBuffer();

        // For drawing lines to the light source
        this.linesVao = gl.vao.createVertexArrayOES();
        this.linesBuffer = gl.createBuffer();

        this.shader = Object.freeze({
            position: light.vertexPosition,
            normal: vertexNormal,
            modelMatrix: modelMatrix,
            forceColor: forceColor,
            useForceColor: useForceColor,
            light: Object.freeze({
                position: light.position,
                direction: light.direction,
                cosAngle: light.cosAngle,
                ambient: light.ambient,
                diffuse: light.diffuse,
                specular: light.specular,
            }),
        });
    }

    get cosAngle() {
        return Math.cos(this.angle * Math.PI / 180);
    }

    /**
     * Prepare GL data for rendering the light source
     */
    setup() {
        gl.uniform3fv(this.shader.light.position, this.position);
        gl.uniform3fv(this.shader.light.direction, this.direction);
        gl.uniform3fv(this.shader.light.ambient, this.ambient);
        gl.uniform3fv(this.shader.light.diffuse, this.diffuse);
        gl.uniform3fv(this.shader.light.specular, this.specular);

        this.updateAngle();

        // Prepare the light source for rendering
        gl.vao.bindVertexArrayOES(this.vao);

        setupBuffer(this.shader.position, this.position, this.positionBuffer);
        setupBuffer(this.shader.normal, [0, 0, 0],  gl.createBuffer());

        // Prepare the guide lines
        let lines = getLines(this);
        gl.vao.bindVertexArrayOES(this.linesVao);
        setupBuffer(this.shader.position, lines, this.linesBuffer);

        gl.vao.bindVertexArrayOES(null);
    }

    /**
     * Draw the light source
     *
     * @param {boolean} draw_lines If truthy, also draw the guide lines to the light source
     */
    draw(draw_lines = false) {
        // Use an identity model matrix and normal matrix
        gl.uniformMatrix4fv(this.shader.modelMatrix,
                            false,
                            new Float32Array([1,0,0,0,
                                              0,1,0,0,
                                              0,0,1,0,
                                              0,0,0,1]));
        // Bypass light calculation
        gl.uniform1i(this.shader.useForceColor, true);
        gl.uniform3f(this.shader.forceColor, 1, 1, 1);

        // Draw the light source as a point
        gl.vao.bindVertexArrayOES(this.vao);
        gl.drawArrays(gl.POINTS, 0, 1);

        if (draw_lines) {
            gl.vao.bindVertexArrayOES(this.linesVao);
            gl.drawArrays(gl.LINES, 0, 30);
        }

        // Restore to normal state
        gl.uniform1i(this.shader.useForceColor, false);
        gl.vao.bindVertexArrayOES(null);
    }

    setAngle(value) {
        this.angle = value;
        this.updateAngle();
    }

    addAngle(value) {
        this.angle += value;
        this.updateAngle();
    }

    updateAngle(light) {
        gl.uniform1f(this.shader.light.cosAngle, this.cosAngle);
    }
}

/**
 * Get lines connecting to a light source
 *
 * Twelve lines form a rectangular prism with the origin at the opposite corner,
 * and three additional lines extend along each primary axis from the light source.
 */
function getLines(light) {
    let [x, y, z] = light.position;

    // Make a cube from the origin to the light
    return new Float32Array([
        // top square
        0,0,0,  x,0,0,
        x,0,0,  x,0,z,
        x,0,z,  0,0,z,
        0,0,z,  0,0,0,

        // Bottom square
        0,y,0,  x,y,0,
        x,y,0,  x,y,z,
        x,y,z,  0,y,z,
        0,y,z,  0,y,0,

        // vertical lines
        0,0,0,  0,y,0,
        x,0,0,  x,y,0,
        x,0,z,  x,y,z,
        0,0,z,  0,y,z,

        // Axes from light source
        1000,y,z,  -1000,y,z,
        x,y,1000,  x,y,-1000,
        x,1000,z,  x,-1000,z,
    ]);
}
