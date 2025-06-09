#version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform vec3 uLightDirection;
uniform vec4 uLightDiffuse;
uniform vec4 uLightAmbient;
uniform vec4 uMaterialDiffuse;

in vec3 aVertexPosition;
in vec3 aVertexNormal;

out vec4 vVertexColor;

void main(void) {
  // Calculate the normal vector
  vec3 N = normalize(vec3(uNormalMatrix * vec4(aVertexNormal, 1.0)));

  vec3 light = vec3(uModelViewMatrix * vec4(uLightDirection, 0.0));

  // Normalized light direction
  vec3 L = normalize(light);

  // Dot product of the normal product and negative light direction vector
  float lambertTerm = dot(N, -L);

  vec4 Ia = uMaterialDiffuse * uLightAmbient;

  // Calculating the diffuse color based on the Lambertian reflection model
  vec4 Id = uMaterialDiffuse * uLightDiffuse * lambertTerm;

  // Set the varying to be used inside of the fragment shader
  vVertexColor = vec4(vec3(Ia + Id), 1.0);

  // Setting the vertex position
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}