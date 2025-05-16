precision mediump float;

varying vec3 v_normal; //法線

uniform vec3 u_reverseLightDirection; //太陽光
uniform vec4 u_color; //色

void main() {
   vec3 normal = normalize(v_normal);
   vec3 normalLight = normalize(u_reverseLightDirection);

   float light = dot(normal, normalLight);

   gl_FragColor = u_color;
   gl_FragColor.rgb *= light;
}

// void main() {
//    vec3 normal = normalize(v_normal);
//    float dot = dot(u_reverseLightDirection, u_normal);
//    gl_FragColor = u_color;
//    gl_FragColor.rgb *= dot
// }