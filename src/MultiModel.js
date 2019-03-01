import AbstractModel from "./AbstractModel.js";

export default class MultiModel extends AbstractModel {
    /**
     * @param {...AbstractModel}
     */
    constructor(...models) {
        super();
        this.models = models;
    }

    /**
     * Call a method on each model
     *
     * If the method is a string, it is taken as a property name, and the given
     * arguments are passed to the method stored as that property.
     */
    apply(method, ...args) {
        if (typeof method === "string") {
            let property = method;
            method = model => model[property](...args);
        }
        this.models.forEach(method);
    }

    setup() {
        throw new Error("Can not set up MultiModel");
    }

    draw() {
        this.apply('draw');
    }

    useVertexShading() {
        this.apply('useVertexShading');
    }

    useFaceShading() {
        this.apply('useFaceShading');
    }
}
