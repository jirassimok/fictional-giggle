/* As listed here:
http://devernay.free.fr/cours/opengl/materials.html
 */

export const emerald = Object
    .freeze({
        ambient: Object.freeze([0.0215, 0.1745, 0.0215]),
        diffuse: Object.freeze([0.07568, 0.61424, 0.07568]),
        specular: Object.freeze([0.633, 0.727811, 0.633]),
        shininess: 0.6
    }),
    jade = Object.freeze({
        ambient: Object.freeze([0.135, 0.2225, 0.1575]),
        diffuse: Object.freeze([0.54, 0.89, 0.63]),
        specular: Object.freeze([0.316228, 0.316228, 0.316228]),
        shininess: 0.1
    }),
    obsidian = Object.freeze({
        ambient: Object.freeze([0.05375, 0.05, 0.06625]),
        diffuse: Object.freeze([0.18275, 0.17, 0.22525]),
        specular: Object.freeze([0.332741, 0.328634, 0.346435]),
        shininess: 0.3
    }),
    pearl = Object.freeze({
        ambient: Object.freeze([0.25, 0.20725, 0.20725]),
        diffuse: Object.freeze([1, 0.829, 0.829]),
        specular: Object.freeze([0.296648, 0.296648, 0.296648]),
        shininess: 0.088
    }),
    ruby = Object.freeze({
        ambient: Object.freeze([0.1745, 0.01175, 0.01175]),
        diffuse: Object.freeze([0.61424, 0.04136, 0.04136]),
        specular: Object.freeze([0.727811, 0.626959, 0.626959]),
        shininess: 0.6
    }),
    turquoise = Object.freeze({
        ambient: Object.freeze([0.1, 0.18725, 0.1745]),
        diffuse: Object.freeze([0.396, 0.74151, 0.69102]),
        specular: Object.freeze([0.297254, 0.30829, 0.306678]),
        shininess: 0.1
    }),
    brass = Object.freeze({
        ambient: Object.freeze([0.329412, 0.223529, 0.027451]),
        diffuse: Object.freeze([0.780392, 0.568627, 0.113725]),
        specular: Object.freeze([0.992157, 0.941176, 0.807843]),
        shininess: 0.21794872
    }),
    bronze = Object.freeze({
        ambient: Object.freeze([0.2125, 0.1275, 0.054]),
        diffuse: Object.freeze([0.714, 0.4284, 0.18144]),
        specular: Object.freeze([0.393548, 0.271906, 0.166721]),
        shininess: 0.2
    }),
    chrome = Object.freeze({
        ambient: Object.freeze([0.25, 0.25, 0.25]),
        diffuse: Object.freeze([0.4, 0.4, 0.4]),
        specular: Object.freeze([0.774597, 0.774597, 0.774597]),
        shininess: 0.6
    }),
    copper = Object.freeze({
        ambient: Object.freeze([0.19125, 0.0735, 0.0225]),
        diffuse: Object.freeze([0.7038, 0.27048, 0.0828]),
        specular: Object.freeze([0.256777, 0.137622, 0.086014]),
        shininess: 0.1
    }),
    gold = Object.freeze({
        ambient: Object.freeze([0.24725, 0.1995, 0.0745]),
        diffuse: Object.freeze([0.75164, 0.60648, 0.22648]),
        specular: Object.freeze([0.628281, 0.555802, 0.366065]),
        shininess: 0.4
    }),
    silver = Object.freeze({
        ambient: Object.freeze([0.19225, 0.19225, 0.19225]),
        diffuse: Object.freeze([0.50754, 0.50754, 0.50754]),
        specular: Object.freeze([0.508273, 0.508273, 0.508273]),
        shininess: 0.4
    }),
    blackPlastic = Object.freeze({
        ambient: Object.freeze([0.0, 0.0, 0.0]),
        diffuse: Object.freeze([0.01, 0.01, 0.01]),
        specular: Object.freeze([0.50, 0.50, 0.50]),
        shininess: .25
    }),
    cyanPlastic = Object.freeze({
        ambient: Object.freeze([0.0, 0.1, 0.06]),
        diffuse: Object.freeze([0.0, 0.50980392, 0.50980392]),
        specular: Object.freeze([0.50196078, 0.50196078, 0.50196078]),
        shininess: .25
    }),
    greenPlastic = Object.freeze({
        ambient: Object.freeze([0.0, 0.0, 0.0]),
        diffuse: Object.freeze([0.1, 0.35, 0.1]),
        specular: Object.freeze([0.45, 0.55, 0.45]),
        shininess: .25
    }),
    redPlastic = Object.freeze({
        ambient: Object.freeze([0.0, 0.0, 0.0]),
        diffuse: Object.freeze([0.5, 0.0, 0.0]),
        specular: Object.freeze([0.7, 0.6, 0.6]),
        shininess: .25
    }),
    whitePlastic = Object.freeze({
        ambient: Object.freeze([0.0, 0.0, 0.0]),
        diffuse: Object.freeze([0.55, 0.55, 0.55]),
        specular: Object.freeze([0.70, 0.70, 0.70]),
        shininess: .25
    }),
    yellowPlastic = Object.freeze({
        ambient: Object.freeze([0.0, 0.0, 0.0]),
        diffuse: Object.freeze([0.5, 0.5, 0.0]),
        specular: Object.freeze([0.60, 0.60, 0.50]),
        shininess: .25
    }),
    blackRubber = Object.freeze({
        ambient: Object.freeze([0.02, 0.02, 0.02]),
        diffuse: Object.freeze([0.01, 0.01, 0.01]),
        specular: Object.freeze([0.4, 0.4, 0.4]),
        shininess: .078125
    }),
    cyanRubber = Object.freeze({
        ambient: Object.freeze([0.0, 0.05, 0.05]),
        diffuse: Object.freeze([0.4, 0.5, 0.5]),
        specular: Object.freeze([0.04, 0.7, 0.7]),
        shininess: .078125
    }),
    greenRubber = Object.freeze({
        ambient: Object.freeze([0.0, 0.05, 0.0]),
        diffuse: Object.freeze([0.4, 0.5, 0.4]),
        specular: Object.freeze([0.04, 0.7, 0.04]),
        shininess: .078125
    }),
    redRubber = Object.freeze({
        ambient: Object.freeze([0.05, 0.0, 0.0]),
        diffuse: Object.freeze([0.5, 0.4, 0.4]),
        specular: Object.freeze([0.7, 0.04, 0.04]),
        shininess: .078125
    }),
    whiteRubber = Object.freeze({
        ambient: Object.freeze([0.05, 0.05, 0.05]),
        diffuse: Object.freeze([0.5, 0.5, 0.5]),
        specular: Object.freeze([0.7, 0.7, 0.7]),
        shininess: .078125
    }),
    yellowRubber = Object.freeze({
        ambient: Object.freeze([0.05, 0.05, 0.0]),
        diffuse: Object.freeze([0.5, 0.5, 0.4]),
        specular: Object.freeze([0.7, 0.7, 0.04]),
        shininess: .078125
    });
