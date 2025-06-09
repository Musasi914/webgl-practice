#version 300 es
precision mediump float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

uniform vec4 uMaterialAmbient;
uniform vec4 uMaterialDiffuse;

uniform vec3 uLightPosition;
uniform vec4 uLightAmbient;
uniform vec4 uLightDiffuse;

uniform float uAlpha;

uniform bool uUseLambert;
uniform bool uUseVertexColor;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec4 aVertexColor;
in vec2 aVertexTextureCoords;

out vec2 vTextureCoords;
out vec4 vColor;
out vec3 vVertexNormal;

void main() {
  vec4 vertex = uModelViewMatrix * vec4(aVertexPosition, 1.0);

  vec4 Ia = uMaterialAmbient * uLightAmbient;
  vec4 Id = vec4(0.0);
  float lambertTerm = 1.0;

  if(uUseLambert) {
  vec3 normal = normalize(vec3(uNormalMatrix * vec4(aVertexNormal, 1.0)));
    vec3 lightDirection = normalize(-uLightPosition);
    lambertTerm = max(dot(normal, -lightDirection), 0.20);
  }

  if(uUseVertexColor) {
    Id = uLightDiffuse * aVertexColor * lambertTerm;
  } else {
    Id = uLightDiffuse * uMaterialDiffuse * lambertTerm;
  }

  vColor = vec4(vec3(Ia + Id), uAlpha);
  vTextureCoords = aVertexTextureCoords;
  vVertexNormal = (uNormalMatrix * vec4(-aVertexPosition, 1.0)).xyz;

  gl_Position = uProjectionMatrix * vertex;
}