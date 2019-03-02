import { gl } from "./setup.js";

import { AnimationTracker } from "./Animations.js";

import * as MV from "./MV+.js";

export default class Camera {
    constructor(locations) {
        this.x = new AnimationTracker(() => 0.01);
        this.y = new AnimationTracker(() => 0.01);
        this.z = new AnimationTracker(() => 0.01);
        this.rx = new AnimationTracker(() => 0.1);
        this.ry = new AnimationTracker(() => 0.1);
        this.rz = new AnimationTracker(() => 0.1);

        this.animations = [
            this.x, this.y, this.z, this.rx, this.ry, this.rz
        ];

        this.viewMatrix = null;
        this.up = null;

        this.shader = Object.freeze({
            viewMatrix: locations.viewMatrix,
            cameraPosition: locations.cameraPosition,
        });
    }

    startMoving(axis, dir) {
        let animation = this[axis];
        animation.scale = Math.sign(dir);
        animation.start();
    }

    stopMoving(axis, dir) {
        let animation = this[axis];
        if (animation.scale === Math.sign(dir)) {
            animation.stop();
        }
    }

    /**
     * Move camera in eye coordinates
     */
    update() {
        let dx = this.x.position,
            dy = this.y.position,
            dz = this.z.position,
            rx = this.rx.position,
            ry = this.ry.position,
            rz = this.rz.position;

        let rotation = MV.mult(
            MV.rotateX(rx),
            MV.rotateY(ry),
            MV.rotateZ(rz),
        );

        this.animations.forEach(a => a.reset());

        this.viewMatrix = MV.mult(
            rotation,
            MV.translate(dx, dy, dz),
            this.viewMatrix
        );

        this.up = MV.mult(MV.mat3(...rotation), this.up);
        // Multiply inverse of view matrix by origin to get camera position
        let eye = MV.mult(MV.inverse(this.viewMatrix),
                          [[0], [0], [0], [1]]).slice(0, 3);

        gl.uniformMatrix4fv(this.shader.viewMatrix, false, MV.flatten(this.viewMatrix));
        gl.uniform3fv(this.shader.cameraPosition, MV.flatten(eye));
    }

    reorient(up = [0, 1, 0]) {
        let v = MV.cross(this.up, up),
            cos = MV.dot(this.up, up),
            coeff = 1 / (1 + cos);

        let skewSymCross = MV.mat3(
            [  0,   -v[2],  v[1] ],
            [ v[2],   0,   -v[0] ],
            [-v[1],  v[0],   0   ],
        );

        let ssc2 = MV.mult(skewSymCross, skewSymCross);

        for (let i of [0, 1, 2]) {
            for (let j of [0, 1, 2]) {
                ssc2[i][j] *= coeff;
            }
        }

        let transform = MV.add(MV.mat3(), skewSymCross, ssc2);

        this.up = MV.mult(transform, this.up);

        this.viewMatrix = MV.mult(MV.mat4(
            [...transform[0], 0],
            [...transform[1], 0],
            [...transform[2], 0],
        ), this.viewMatrix);
    }
}
