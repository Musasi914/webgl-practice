#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

const float PI = 3.1415926;
float atan2(float y, float x) {
  if(x == 0.0) {
    return sign(y) * PI / 2.0;
  } else {
    return atan(y, x);
  }
}
vec2 xy2pol(vec2 xy) {
  return vec2(atan2(xy.y, xy.x), length(xy));
}
vec2 pol2xy(vec2 pol) { // 角度と半径
  return pol.y * vec2(cos(pol.x), sin(pol.x));
}
vec3 tex(vec2 st){ // s:偏角, t:動径
  float time = 0.2 * u_time;
  vec3 circ = vec3(pol2xy(vec2(time, 0.5)) + 0.5 , 1.0);
  vec3[3] col3 = vec3[] (
    circ.rgb, circ.gbr, circ.brg
  );

  st.s = st.s / PI + 1.0; // [0,2)
  st.s += time;
  int ind = int(st.s);
  vec3 col = mix(col3[ind % 2], col3[(ind + 1) % 2], fract(st.s));
  // return col;
  return mix(col3[2], col, st.t);
}

float fractSin11(float x) {
  return fract(1000.0 * sin(x));
}

float fractSin21(vec2 xy) {
  return fract(sin(dot(xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// uint k = 0x456789abu;
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1,2,3); // シフト数
const uint UINT_MAX = 0xffffffffu;

uint uhash11(uint n) {
  n ^= (n << 1);
  n ^= (n >> 1);
  n *= k[0];
  n ^= (n << 1);
  return n * k[0];
}
float hash11(float p) { //float 型の値 p から [0.0, 1.0] の範囲の乱数を生成する関数。
  uint n = floatBitsToUint(p);
  return float(uhash11(n)) / float(UINT_MAX);
}

uvec2 uhash22(uvec2 n) {
  n ^= (n.yx << u.xy);
  n ^= (n.yx >> u.xy);
  n *= k.xy;
  n ^= (n.yx << u.xy);
  return n * k.xy;
}
vec2 hash22(vec2 p) {
  uvec2 n = floatBitsToUint(p);
  return vec2(uhash22(n)) / vec2(UINT_MAX);
}

uvec3 uhash33(uvec3 n){
  n ^= (n.yzx << u);
  n ^= (n.yzx >> u);
  n *= k;
  n ^= (n.yzx << u);
  return n * k;
}
vec3 hash33(vec3 p){
  uvec3 n = floatBitsToUint(p);
  return vec3(uhash33(n)) / vec3(UINT_MAX);
}

float hash21(vec2 p){
    uvec2 n = floatBitsToUint(p);
    return float(uhash22(n).x) / float(UINT_MAX);
    //return float(uhash11(n.x+uhash11(n.y)) / float(UINT_MAX)
}

float hash31(vec3 p){
    uvec3 n = floatBitsToUint(p);
    return float(uhash33(n).x) / float(UINT_MAX);
    //return float(uhash11(n.x+uhash11(n.y+uhash11(n.z))) / float(UINT_MAX)
}

// float vnoise21(vec2 p) {
//   vec2 n = floor(p); //入力pの整数部分(グリッドの左下隅)
//   float[4] v;
//   for(int j = 0; j < 2; j++) {
//     for(int i = 0; i < 2; i++) {
//       v[i+2*j] = hash21(n + vec2(i,j));
//     }
//   }
//   vec2 f = fract(p);
//   // f = f * f * (3.0 -2.0 * f);
//   return mix(mix(v[0],v[1],f[0]), mix(v[2],v[3],f[0]),f[1]);
// }

int channel;

float vnoise21(vec2 p) {
  vec2 n = floor(p);
  float[4] v;
  for(int i = 0; i < 2; i++) {
    for(int j = 0; j < 2; j++){
      v[i * 2 + j] = hash21(n + vec2(j,i));
    }
  }
  vec2 f = fract(p);
  if(channel == 0) {
    f = f * f * (3.0 -2.0 * f);
  } else {
    f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f); //quintic Hermite interpolation
  }
  return mix(mix(v[0],v[1],f[0]), mix(v[2],v[3],f[0]), f[1]);
}

float vnoise31(vec3 p) {
  vec3 n = floor(p);
  float[8] v;
  for(int i = 0; i < 2; i++) {
    for(int j = 0; j < 2; j++){
      for(int k = 0; k < 2; k++){
        v[i*4 + j*2 + k] = hash31(n + vec3(k,j,i));
      }
    }
  }
  vec3 f = fract(p);
  f = f*f*(3.0 - 2.0 * f);
  float[2] w;
  for(int i = 0; i < 2; i++) {
    w[i] = mix(mix(v[i*4],v[i*4+1],f[0]), mix(v[i*4+2],v[i*4+3],f[0]), f[1]);
  }
  return mix(w[0], w[1], f[2]);
}

vec3 vnoise23(vec2 p) {
  vec2 n = floor(p);
  vec3 v[4];
  for(int i = 0; i < 2; i++) {
    for(int j = 0; j < 2; j++) {
      v[i*2 + j] = hash33(vec3(n + vec2(j, i), 0.0)); // 2D座標→3D乱数
    }
  }
  vec2 f = fract(p);
  // f = f * f * (3.0 - 2.0 * f); // スムージング
  return mix(
    mix(v[0], v[1], f.x),
    mix(v[2], v[3], f.x),
    f.y
  );
}

vec2 grad(vec2 p) { // 勾配 グラディエント
  float eps = 0.001;
  return 0.5 * (vec2(
    vnoise21(p + vec2(eps, 0.0)) - vnoise21(p - vec2(eps, 0.0)),
    vnoise21(p + vec2(0.0, eps)) - vnoise21(p - vec2(0.0, eps))
  )) / eps;
}

float gnoise21(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float[4] v;
  for(int j = 0; j < 2; j++) {
    for(int i = 0; i < 2; i++) {
      vec2 g = normalize(hash22(n + vec2(i,j)) - vec2(0.5)); // 乱数ベクトルを正規化
      v[j*2+i] = dot(g, f - vec2(i, j)); // 窓関数の係数
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  return 0.5 * mix(mix(v[0], v[1] ,f[0]), mix(v[2], v[3] ,f[0]) ,f[1]) + 0.5;
}

out vec4 fragColor;

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  channel = int(gl_FragCoord.y * 2.0 / u_resolution.y);
  pos = 10.0 * pos + u_time;
  fragColor = vec4(gnoise21(pos));
  fragColor.a = 1.0;
}