#version 300 es
precision mediump float;

const int numLights = 3;

uniform vec4 uMaterialDiffuse;
uniform vec4 uMaterialAmbient;
uniform bool uWireframe;
uniform bool uLightSource;
uniform vec4 uLightAmbient;
uniform vec3 uLightDirectin[numLights];
uniform vec4 uLightDiffuse[numLights];
uniform float uCutOff;

in vec3 vNormal[numLights];
in vec3 vLightRay[numLights];

out vec4 fragColor;

void main() {
  if(uWireframe || uLightSource) {
    fragColor = uMaterialDiffuse;
  } else {
    vec4 Ia = uLightAmbient * uMaterialAmbient;

    vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    vec3 L = vec3(0.0);
    vec3 N = vec3(0.0);
    float lambertTerm = 0.0;

    for(int i = 0; i < numLights; i++) {
      L = normalize(vLightRay[i]);
      N = normalize(vNormal[i]);
      lambertTerm = dot(N, -L);

      finalColor += uLightDiffuse[i] * uMaterialDiffuse * pow(lambertTerm, uCutOff * 10.0);
    }

    fragColor = vec4(vec3(finalColor), 1.0);
  }
}