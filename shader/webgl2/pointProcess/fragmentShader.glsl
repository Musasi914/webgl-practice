#version 300 es
precision mediump float;

uniform vec4 uLightAmbient;
uniform vec4 uLightDiffuse;
uniform vec4 uMaterialAmbient;
uniform vec4 uMaterialDiffuse;

uniform bool uOffscreen;
uniform sampler2D uSampler;

in vec3 vNormal;
in vec3 vLightRay;
in vec3 vEyeVector;
// in vec4 vFinalColor;
in vec2 vTextureCoords;

out vec4 fragColor;

void main() {
  if(uOffscreen) {
    fragColor = uMaterialDiffuse;
    return;
  }

  vec4 Ia = uLightAmbient * uMaterialAmbient;

  vec3 N = normalize(vNormal);
  vec3 L = normalize(vLightRay);
  float lambertTerm = max(dot(N, -L), 0.3);
  vec4 Id = uLightDiffuse * uMaterialDiffuse * lambertTerm;

  vec3 E = normalize(vEyeVector);
  vec3 R = reflect(L, N);
  float specular = pow(max(dot(R,E) , 0.5) , 50.0);
  vec4 Is = vec4(0.5) * specular;

  vec4 finalColor = Ia + Id + Is;

  if(uMaterialDiffuse.a != 1.0) {
    finalColor.a = uMaterialDiffuse.a;
  } else {
    finalColor.a = 1.0;
  }

  fragColor = finalColor * texture(uSampler, vTextureCoords);
  // fragColor = finalColor * texture(uSampler, vec2(vTextureCoords.s, vTextureCoords.t));
}