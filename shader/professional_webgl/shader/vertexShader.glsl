attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;
varying vec4 vColor;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
void main() {
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
}