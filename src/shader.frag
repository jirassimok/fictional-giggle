precision highp float;

struct Light {
	vec3 position;
	vec3 direction;
	float cosAngle;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float shininess;
};


uniform Material material;
uniform vec3 forceColor;

uniform Light light;

uniform vec3 cameraPosition;

uniform bool useForceColor;
uniform bool usePhongInterpolation;

varying vec4 finalColor;

// For Phong interpolation
varying vec3 vertexPosition_world;
varying vec3 vertexNormal_world;

void main()
{
	if (useForceColor) {
		gl_FragColor = vec4(forceColor, 1);
	}
	else if (!usePhongInterpolation) {
		gl_FragColor = finalColor;
	}
	else {
		vec3 vertexToLight = normalize(light.position - vertexPosition_world);

		vec3 ambientLight = light.ambient * material.ambient;

		if (dot(-vertexToLight, light.direction) < light.cosAngle) {
			gl_FragColor = vec4(ambientLight, 1);
			return;
		}
		vec3 vertexNormal = normalize(vertexNormal_world);

		vec3 diffuseLight = (light.diffuse * material.diffuse
							 * max(0.0, dot(vertexToLight, vertexNormal)));

		vec3 vertexToCamera = normalize(cameraPosition - vertexPosition_world);

		// Reflection of light off vertex
		vec3 reflection = reflect(vertexToLight, vertexNormal);
		vec3 specularLight = (light.specular * material.specular
							  * pow(max(0.0, dot(-vertexToCamera, reflection)),
									material.shininess));

		gl_FragColor = vec4(ambientLight + diffuseLight + specularLight, 1);
	}
}
