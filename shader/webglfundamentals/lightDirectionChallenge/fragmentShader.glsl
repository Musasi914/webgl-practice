precision mediump float;

uniform vec4 u_color;
uniform vec3 u_ambientLight;

varying vec3 v_normal;

void main() {
   vec3 ambientLight = normalize(u_ambientLight);
   vec3 normal = normalize(v_normal);
   float dot = dot(ambientLight, normal);
   gl_FragColor = u_color;
   gl_FragColor.rgb *= dot;
}