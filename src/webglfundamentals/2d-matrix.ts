import fragmentShaderSource from "/shader/webglfundamentals/2d-matrix/fragmentShader.glsl?raw";
import vertexShaderSource from "/shader/webglfundamentals/2d-matrix/vertexShader.glsl?raw";
import { WebGLBasicUtility } from "../WebGLUtil";
import { mat3 } from "gl-matrix";

const m3 = {
  identity: function () {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  },

  translation: function (tx: number, ty: number) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
  },

  rotation: function (angleInRadians: number) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  },

  scaling: function (sx: number, sy: number) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  },

  multiply: function (a: number[], b: number[]) {
    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];
    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;

const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const vertexPositionAttribLocation = gl.getAttribLocation(shaderProgram, "a_position");
const vertexColorUniformLocation = gl.getUniformLocation(shaderProgram, "u_color");
const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
const matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const color = [Math.random(), Math.random(), Math.random(), 1];
const translation = [100, 150];
const radian = (0 * Math.PI) / 180;
const scale = [1, 1];

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

const a = mat3.identity(mat3.create());

mat3.translate(a, a, [-50, -75]);

mat3.translate(a, a, Float32Array.from(translation));
mat3.rotate(a, a, radian);
mat3.scale(a, a, Float32Array.from(scale));

mat3.translate(a, a, [50, 75]);

gl.uniformMatrix3fv(matrixLocation, false, a);

gl.drawArrays(gl.TRIANGLES, 0, 18);

// for (let i = 0; i < 5; i++) {
//   mat3.translate(a, a, Float32Array.from(translation));
//   mat3.rotate(a, a, radian);
//   mat3.scale(a, a, Float32Array.from(scale));

//   gl.uniformMatrix3fv(matrixLocation, false, a);

//   gl.drawArrays(gl.TRIANGLES, 0, 18);
// }
