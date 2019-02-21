/*
 * Add x-, y-, and z-accessors to all arrays
 */
Object.defineProperties(Array.prototype, {
    x: {
        get: function () {
            return this[0];
        },
        set: function(val) {
            return this[0] = val;
        }
    },
    y: {
        get: function () {
            return this[1];
        },
        set: function(val) {
            return this[1] = val;
        }
    },
    z: {
        get: function () {
            return this[2];
        },
        set: function(val) {
            return this[2] = val;
        }
    }
});
