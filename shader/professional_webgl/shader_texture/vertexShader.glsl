attribute vec3 aVertexPosition;
attribute vec2 aTextureCoordinates;

varying vec2 vTextureCoordinates;

void main() {
  gl_Position = vec4(aVertexPosition, 1.0);
  vTextureCoordinates = aTextureCoordinates;
}