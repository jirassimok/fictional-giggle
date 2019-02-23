
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

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

uniform Material material;
uniform vec3 forceColor;

uniform Light light;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform bool useForceColor;
uniform bool usePhongInterpolation;

varying vec4 finalColor;

// For Phong interpolation
varying vec3 vertexPosition_eye;
varying vec3 vertexNormal_eye;
varying vec3 lightPosition_eye;
varying vec3 lightDirection_eye;


void main() {
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPosition, 1);
	gl_PointSize = 4.0;

	if (useForceColor) {
		finalColor = vec4(forceColor, 1);
		return;
	}

	mat4 modelViewMatrix = viewMatrix * modelMatrix;

	// Use eye coordinates

	vertexPosition_eye = vec3(modelViewMatrix * vec4(vertexPosition, 1));
	vertexNormal_eye = mat3(modelViewMatrix) * vertexNormal;

	lightPosition_eye = vec3(viewMatrix * vec4(light.position, 1));
	lightDirection_eye = normalize(vec3(viewMatrix * vec4(light.direction, 1)));

	if (usePhongInterpolation) {
		return; // For Phong interpolation, leave rest to fragment shader
	}

	vec3 vertexToLight = normalize(lightPosition_eye - vertexPosition_eye);

	vec3 ambientLight = light.ambient * material.ambient;

	if (dot(vertexToLight, -lightDirection_eye) < light.cosAngle) {
		finalColor = vec4(ambientLight, 1);
		return;
	}

	vec3 diffuseLight = (light.diffuse * material.diffuse
						 * max(dot(vertexToLight, vertexNormal_eye), 0.0));

	vec3 cameraToVertex = normalize(-vertexPosition_eye);
	vec3 reflection = reflect(-vertexToLight, vertexNormal_eye);
	vec3 specularLight = (light.specular * material.specular
						  * pow(max(dot(cameraToVertex, reflection), 0.0),
								material.shininess));

	finalColor = vec4(ambientLight + diffuseLight + specularLight, 1);
}
