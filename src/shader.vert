
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

attribute vec3 aPosition;
attribute vec3 vertexNormal;

uniform Material material;

uniform Light light;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec4 finalColor;

void main() {
	mat4 modelViewMatrix = viewMatrix * modelMatrix;

	vec4 vPosition = vec4(aPosition, 1);
	vec4 vNormal = vec4(vertexNormal, 1);

	// From example code
	vec3 eyePosition = (modelViewMatrix * vec4(aPosition, 1)).xyz;
	vec3 eyeNormal = normalize(modelViewMatrix * vec4(vertexNormal, 1)).xyz;
	vec3 camera = normalize(-eyePosition);


	vec3 eyeLightPosition = (viewMatrix * vec4(light.position, 1)).xyz;
	vec3 lightToVertex = normalize(eyeLightPosition - eyePosition);

	vec3 reflection = reflect(lightToVertex, eyeNormal);

	vec3 diffuseLight = light.diffuse * material.diffuse * dot(lightToVertex, eyeNormal);

	vec3 specularLight = (light.specular * material.specular
						  * pow(max(dot(camera, reflection), 0.0), material.shininess));

	vec3 ambientLight = light.ambient * material.ambient;

	finalColor = vec4(diffuseLight + specularLight + ambientLight, 1);
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition, 1);
}
