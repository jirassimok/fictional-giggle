
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

struct Vertex {
	vec3 position;
	vec3 normal;
};

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

uniform Material material;

uniform Light light;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform int forceWhite; // 0 or 1

varying vec4 finalColor;

Vertex transformVertex(mat4 tr, Vertex v) {
	vec4 position = vec4(v.position, 1);
	vec4 normal = vec4(v.normal, 1);
	return Vertex((tr * position).xyz, normalize((tr * normal).xyz));
}

void main() {
	mat4 modelViewMatrix = viewMatrix * modelMatrix;

	Vertex vertex = Vertex(vertexPosition, vertexNormal);

	// Use eye coordinates
	Vertex eyeVertex = transformVertex(modelViewMatrix, vertex);
	vec3 eyeLightPosition = (viewMatrix * vec4(light.position, 1)).xyz;
	// Eye vector in eye coordinates:
	vec3 eye = normalize(-eyeVertex.position);

	vec3 lightToVertex = normalize(eyeLightPosition - eyeVertex.position);
	vec3 reflection = reflect(lightToVertex, eyeVertex.normal);

	vec3 specularLight = (light.specular * material.specular
						  * pow(max(dot(eye, reflection), 0.0), material.shininess));

	vec3 diffuseLight = light.diffuse * material.diffuse * dot(lightToVertex, eyeVertex.normal);
	vec3 ambientLight = light.ambient * material.ambient;

	if (forceWhite <= 0) {
		finalColor = vec4(diffuseLight + specularLight + ambientLight, 1);
	}
	else {
		finalColor = vec4(1, 1, 1, 1);
	}

	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertex.position, 1);

	gl_PointSize = 4.0;
}
