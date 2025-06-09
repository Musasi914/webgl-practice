#version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

uniform vec3 uLightPosition;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec4 aVertexColor;
in vec2 aVertexTextureCoords;

out vec3 vNormal;
out vec3 vLightRay;
out vec3 vEyeVector;
// out vec4 vFinalColor;
out vec2 vTextureCoords;

void main() {
  vec4 vertex = uModelViewMatrix * vec4(aVertexPosition, 1.0);
  vec4 light = vec4(uLightPosition, 1.0);

  vNormal = vec3(uNormalMatrix * vec4(aVertexNormal, 1.0));
  vLightRay = vertex.xyz - light.xyz;
  vEyeVector = -vec3(vertex.xyz);
  vTextureCoords = aVertexTextureCoords;

  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}