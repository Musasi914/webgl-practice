#version 300 es
precision mediump float;

uniform sampler2D uSampler;
uniform samplerCube uCubeSampler;

in vec4 vColor;
in vec2 vTextureCoords;
in vec3 vVertexNormal;

out vec4 fragColor;

void main() {
  fragColor = vColor * texture(uSampler, vTextureCoords) * texture(uCubeSampler, vVertexNormal);
}