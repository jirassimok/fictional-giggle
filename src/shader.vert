attribute vec3 aPosition;
attribute vec3 vertexNormal;

uniform vec4 baseColor;
uniform float shininess;

uniform vec3 lightPosition;
uniform vec4 ambientProduct;
uniform vec4 diffuseProduct;
uniform vec4 specularProduct;

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


	vec3 lightToVertex = normalize((viewMatrix * vec4(lightPosition, 1)).xyz - eyePosition);

	vec3 reflection = reflect(lightToVertex, eyeNormal);

	vec4 diffuseLight = diffuseProduct * dot(lightToVertex, eyeNormal);

	vec4 specularLight = specularProduct * pow(max(dot(camera, reflection), 0.0), shininess);


	finalColor = (diffuseLight + specularLight + ambientProduct) * baseColor;
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(aPosition, 1);
}
