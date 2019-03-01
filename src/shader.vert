
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
	vertexNormal_world = mat3(modelMatrix) * vertexNormal;

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

	vec3 vertexToCamera = normalize(cameraPosition - vertexPosition_world);

	// Reflection of light off vertex
	vec3 reflection = reflect(vertexToLight, vertexNormal_world);
	vec3 specularLight = (light.specular * material.specular
						  * pow(max(0.0, dot(-vertexToCamera, reflection)),
								material.shininess));

	finalColor = vec4(ambientLight + diffuseLight + specularLight, 1);
}
