import { gl } from "./setup.js";

import { AnimationTracker } from "./Animations.js";

import * as MV from "./MV+.js";

export default class Camera {
    constructor(locations) {
        this.x = new AnimationTracker(() => 0.01);
        this.y = new AnimationTracker(() => 0.01);
        this.z = new AnimationTracker(() => 0.01);
        this.ry = new AnimationTracker(() => 0.1);

        this.animations = [this.x, this.y, this.z, this.ry];

        this.viewMatrix = null;

        this.shader = Object.freeze({
            viewMatrix: locations.viewMatrix,
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
            ry = this.ry.position;

        this.animations.forEach(a => a.reset());

        this.viewMatrix = MV.mult(
            MV.rotateY(ry),
            MV.translate(dx, dy, dz),
            this.viewMatrix);

        gl.uniformMatrix4fv(this.shader.viewMatrix, false, MV.flatten(this.viewMatrix));
    }
}
