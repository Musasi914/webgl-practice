import fragmentShaderSource from "/shader/webglfundamentals/2d-rotation/fragmentShader.glsl?raw";
import vertexShaderSource from "/shader/webglfundamentals/2d-rotation/vertexShader.glsl?raw";
import { WebGLBasicUtility } from "../WebGLUtil";

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;

const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const vertexPositionAttribLocation = gl.getAttribLocation(shaderProgram, "a_position");
const vertexColorUniformLocation = gl.getUniformLocation(shaderProgram, "u_color");
const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
const translationLocation = gl.getUniformLocation(shaderProgram, "u_translation");
const rotationLocation = gl.getUniformLocation(shaderProgram, "u_rotation");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const width = 100;
const height = 30;
const color = [Math.random(), Math.random(), Math.random(), 1];
const translation = [100, 200];

const radian = (90 * Math.PI) / 180;
const rotation = [Math.cos(radian), Math.sin(radian)];

// 「F」を描画
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    // 左縦列(x,y)
    0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

    // 上の横棒
    30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

    // 下の横棒
    30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
  ]),
  gl.STATIC_DRAW
);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.9, 0.9, 0.9, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.enableVertexAttribArray(vertexPositionAttribLocation);
gl.vertexAttribPointer(vertexPositionAttribLocation, 2, gl.FLOAT, false, 0, 0);

gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
gl.uniform4fv(vertexColorUniformLocation, color);
// 移動距離
gl.uniform2fv(translationLocation, translation);
// 回転角
gl.uniform2fv(rotationLocation, rotation);

gl.drawArrays(gl.TRIANGLES, 0, 18);

function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl.STATIC_DRAW);
}
