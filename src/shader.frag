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

uniform bool useForceColor;
uniform bool usePhongInterpolation;

varying vec4 finalColor;

// For Phong interpolation
varying vec3 vertexPosition_eye;
varying vec3 vertexNormal_eye;
varying vec3 lightPosition_eye;
varying vec3 lightDirection_eye;

void main()
{
	if (useForceColor) {
		gl_FragColor = vec4(forceColor, 1);
	}
	else if (!usePhongInterpolation) {
		gl_FragColor = finalColor;
	}
	else {
		vec3 ambientLight = light.ambient * material.ambient;

		vec3 lightToVertex = normalize(lightPosition_eye - vertexPosition_eye);

		if (dot(lightToVertex, -lightDirection_eye) < light.cosAngle) {
			gl_FragColor = vec4(ambientLight, 1);
			return;
		}

		vec3 diffuseLight = (light.diffuse * material.diffuse
							 * max(dot(lightToVertex, vertexNormal_eye), 0.0));

		vec3 cameraToVertex = normalize(-vertexPosition_eye);
		vec3 reflection = reflect(-lightToVertex, vertexNormal_eye);
		vec3 specularLight = (light.specular * material.specular
							  * pow(max(dot(cameraToVertex, reflection), 0.0),
									material.shininess));

		gl_FragColor = vec4(ambientLight + diffuseLight + specularLight, 1);
	}
}
