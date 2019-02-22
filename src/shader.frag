precision highp float;

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


uniform Material material;

uniform Light light;

uniform bool usePhongInterpolation;

varying vec4 finalColor;

// For Phong interpolation
varying vec3 vertexPosition_eye;
varying vec3 vertexNormal_eye;
varying vec3 lightPosition_eye;

void main()
{
	if (!usePhongInterpolation) {
		gl_FragColor = finalColor;
	}
	else {
		vec3 eye = normalize(-vertexPosition_eye);

		vec3 lightToVertex = normalize(lightPosition_eye - vertexPosition_eye);
		vec3 reflection = reflect(-lightToVertex, vertexNormal_eye);
		vec3 specularLight = (light.specular * material.specular
							  * pow(max(dot(eye, reflection), 0.0), material.shininess));

		vec3 diffuseLight = light.diffuse * material.diffuse * dot(lightToVertex, vertexNormal_eye);
		vec3 ambientLight = light.ambient * material.ambient;

		gl_FragColor = vec4(ambientLight + diffuseLight + specularLight, 1);
	}
}
