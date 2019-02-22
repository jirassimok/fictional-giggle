
struct Light {
	vec3 position;
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

uniform lowp int usePhongInterpolation;

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

uniform Material material;

uniform Light light;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalModelMatrix;
uniform mat3 normalViewMatrix;

uniform int forceWhite; // 0 or 1

varying vec4 finalColor;

varying vec3 vertexPosition_eye;
varying vec3 vertexNormal_eye;
varying vec3 lightPosition_eye;


void main() {
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPosition, 1);
	gl_PointSize = 4.0;

	mat4 modelViewMatrix = viewMatrix * modelMatrix;
	mat3 normalMatrix = mat3(modelViewMatrix);//normalViewMatrix * normalModelMatrix;

	// Use eye coordinates

	vertexPosition_eye = vec3(modelViewMatrix * vec4(vertexPosition, 1));
	vertexNormal_eye = normalMatrix * vertexNormal;

	lightPosition_eye = vec3(viewMatrix * vec4(light.position, 1));

	if (usePhongInterpolation > 0) {
		return; // For Phong interpolation, leave rest to fragment shader
	}

	// Eye vector in eye coordinates:
	vec3 eye = normalize(-vertexPosition_eye);

	vec3 lightToVertex = normalize(lightPosition_eye - vertexPosition_eye);
	vec3 reflection = reflect(-lightToVertex, vertexNormal_eye);
	vec3 specularLight = (light.specular * material.specular
						  * pow(max(dot(eye, reflection), 0.0), material.shininess));

	vec3 diffuseLight = light.diffuse * material.diffuse * dot(lightToVertex, vertexNormal_eye);
	vec3 ambientLight = light.ambient * material.ambient;

	if (forceWhite <= 0) {
		finalColor = vec4(ambientLight + diffuseLight + specularLight, 1);
	}
	else {
		finalColor = vec4(1, 1, 1, 1);
	}
}
