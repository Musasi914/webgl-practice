#version 300 es
precision mediump float;

uniform vec2 uResolution;
// uniform float uTime;

out vec4 fragColor;

const float PI = 3.1415926;

// atan(y,x)は偏角θを求める。 その拡張版
float atan2(float y, float x) { // (-PI, PI]
  if(x == 0.0) {
    return sign(y) * PI / 2.0;
  } else {
    return atan(y, x);
  }
}

vec2 xy2pol(vec2 xy) {
  return vec2(atan2(xy.y, xy.x), length(xy));
}

vec2 pol2xy(vec2 pol) {
  return vec2(cos(pol.x), sin(pol.x)) * pol.y;
}

vec3 tex(vec2 pol) { //s:偏角 t:動径
  vec3[3] col3 = vec3[](
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 0.0, 0.0),
    vec3(1.0)
  );

  pol.s = pol.s / PI + 1.0; // [0,2)

  int ind = int(pol.s);

  vec3 col = mix(col3[ind % 2], col3[(ind + 1) % 2], fract(pol.s));

  return mix(col3[2], col, pol.t);
}

void main() {
  vec2 pos = gl_FragCoord.xy / uResolution.xy; // pos.x 左0~右1、 pos.y 下0~上1
  // pos *= 2.0 - vec2(1.0); // [-1,1]
  pos = 2.0 * pos.xy - vec2(1.0);
  pos = xy2pol(pos);

  fragColor = vec4(tex(pos),1.0);
}
