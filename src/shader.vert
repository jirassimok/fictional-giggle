
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

// Mode switches
uniform bool useForceColor;
uniform bool usePhongInterpolation;
uniform bool useTexture;
uniform bool useReflect;
uniform bool useRefract;

// Force color mode
uniform vec3 forceColor;

// Texture mode
varying vec2 fragTextureCoordinate;
attribute vec2 textureCoordinate;

// Lighting modes

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
// Position of vertex for lighting purposes
attribute vec3 vertexLightingPosition;

uniform Material material;
uniform Light light;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform vec3 cameraPosition;

varying vec4 finalColor;

// Fragment (Phong) shading mode
varying vec3 lightPosition_eye;
varying vec3 lightDirection_eye;

varying vec3 vertexPosition_world;
varying vec3 vertexNormal_world;

varying vec3 reflection;
varying vec3 refraction;

void main() {
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPosition, 1);
	gl_PointSize = 4.0;

	if (useForceColor) {
		return;
	}
	else if (useTexture) {
		fragTextureCoordinate = textureCoordinate;
		return;
	}

	vertexPosition_world = vec3(modelMatrix * vec4(vertexLightingPosition, 1));
	vertexNormal_world = normalize(mat3(modelMatrix) * vertexNormal);

	vec3 cameraToVertex = normalize(vertexPosition_world - cameraPosition);

	reflection = reflect(cameraToVertex, vertexNormal_world);
	refraction = refract(cameraToVertex, vertexNormal_world, 0.5);

	if (usePhongInterpolation) {
		return;
	}

	vec3 vertexToLight = normalize(light.position - vertexPosition_world);

	vec3 ambientLight = light.ambient * material.ambient;

	if (dot(-vertexToLight, light.direction) < light.cosAngle) {
		finalColor = vec4(ambientLight, 1);
		return;
	}

	vec3 diffuseLight = (light.diffuse * material.diffuse
						 * max(0.0, dot(vertexToLight, vertexNormal_world)));

	// Reflection of light off vertex
	vec3 reflection = reflect(vertexToLight, vertexNormal_world);
	vec3 specularLight = (light.specular * material.specular
						  * pow(max(0.0, dot(cameraToVertex, reflection)),
								material.shininess));

	finalColor = vec4(ambientLight + diffuseLight + specularLight, 1);
}
