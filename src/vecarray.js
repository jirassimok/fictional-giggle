/*
 * Add x-, y-, and z-accessors to all arrays
 */
Object.defineProperties(Array.prototype, {
    x: {
        get: function () {
            return this[0];
        }
    },
    y: {
        get: function () {
            return this[1];
        }
    },
    z: {
        get: function () {
            return this[2];
        }
    }
});
