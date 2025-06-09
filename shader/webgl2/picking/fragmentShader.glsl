#version 300 es
precision mediump float;

uniform bool uWireframe;
uniform bool uOffscreen;

uniform vec4 uLightAmbient;
uniform vec4 uLightDiffuse;
uniform vec4 uMaterialAmbient;
uniform vec4 uMaterialDiffuse;
uniform vec4 uPickingColor;

in vec3 vNormal;
in vec3 vLightRay;
in vec3 vEyeVector;
in vec4 vFinalColor;

out vec4 fragColor;

void main() {
  if(uOffscreen) {
    fragColor = uPickingColor;
    return;
  }

  if(uWireframe) {
    fragColor = vFinalColor;
  } else {
    vec4 Ia = uLightAmbient * uMaterialAmbient;

    vec3 N = normalize(vNormal);
    vec3 L = normalize(vLightRay);
    float lambertTerm = max(dot(N, -L), 0.33);
    vec4 Id = uLightDiffuse * uMaterialDiffuse * lambertTerm;

    vec3 R = reflect(L, N);
    vec3 E = normalize(vEyeVector);
    float specular = pow(max(dot(R, E), 0.5), 50.0);
    vec4 Is = vec4(0.5) * specular;
    
    vec4 finalColor = Ia + Id + Is;

    if(uMaterialDiffuse.a != 1.0) {
      finalColor.a = uMaterialDiffuse.a;
    } else {
      finalColor.a = 1.0;
    }
    
    fragColor = finalColor;
  }
}