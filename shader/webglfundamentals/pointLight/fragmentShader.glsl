precision mediump float;

uniform vec4 u_color;
uniform float u_shininess;
uniform vec3 u_lightColor;
uniform vec3 u_specularColor;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
   vec3 normal = normalize(v_normal);
   vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
   vec3 surfaceToViewDirection = normalize(v_surfaceToView);
   vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

   float light = dot(surfaceToLightDirection, normal);
   float specular = 0.0;
   if(light > 0.0) {
      specular = pow(dot(normal, halfVector), u_shininess);
   }

   gl_FragColor = u_color;
   gl_FragColor.rgb *= light * u_lightColor;
   gl_FragColor.rgb += specular * u_specularColor;
}