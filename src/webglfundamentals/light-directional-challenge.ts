import { assertHTMLCanvasElement } from "../typegard";
import { WebGLBasicUtility } from "../WebGLUtil";
import vertexShaderSource from "/shader/webglfundamentals/lightDirectionChallenge/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webglfundamentals/lightDirectionChallenge/fragmentShader.glsl?raw";
import { mat4 } from "gl-matrix";
import gsap from "gsap";

const canvas = document.querySelector("#myGLCanvas");
assertHTMLCanvasElement(canvas);

const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
const normalLocation = gl.getAttribLocation(shaderProgram, "a_normal");
const colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
const matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
const lightLocation = gl.getUniformLocation(shaderProgram, "u_ambientLight");
const normalMatrixLocation = gl.getUniformLocation(shaderProgram, "u_normalMatrix");

// buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = new Float32Array([
  // left column front
  0, 0, 0, 0, 150, 0, 30, 0, 0, 0, 150, 0, 30, 150, 0, 30, 0, 0,

  // top rung front
  30, 0, 0, 30, 30, 0, 100, 0, 0, 30, 30, 0, 100, 30, 0, 100, 0, 0,

  // middle rung front
  30, 60, 0, 30, 90, 0, 67, 60, 0, 30, 90, 0, 67, 90, 0, 67, 60, 0,

  // left column back
  0, 0, 30, 30, 0, 30, 0, 150, 30, 0, 150, 30, 30, 0, 30, 30, 150, 30,

  // top rung back
  30, 0, 30, 100, 0, 30, 30, 30, 30, 30, 30, 30, 100, 0, 30, 100, 30, 30,

  // middle rung back
  30, 60, 30, 67, 60, 30, 30, 90, 30, 30, 90, 30, 67, 60, 30, 67, 90, 30,

  // top
  0, 0, 0, 100, 0, 0, 100, 0, 30, 0, 0, 0, 100, 0, 30, 0, 0, 30,

  // top rung right
  100, 0, 0, 100, 30, 0, 100, 30, 30, 100, 0, 0, 100, 30, 30, 100, 0, 30,

  // under top rung
  30, 30, 0, 30, 30, 30, 100, 30, 30, 30, 30, 0, 100, 30, 30, 100, 30, 0,

  // between top rung and middle
  30, 30, 0, 30, 60, 30, 30, 30, 30, 30, 30, 0, 30, 60, 0, 30, 60, 30,

  // top of middle rung
  30, 60, 0, 67, 60, 30, 30, 60, 30, 30, 60, 0, 67, 60, 0, 67, 60, 30,

  // right of middle rung
  67, 60, 0, 67, 90, 30, 67, 60, 30, 67, 60, 0, 67, 90, 0, 67, 90, 30,

  // bottom of middle rung.
  30, 90, 0, 30, 90, 30, 67, 90, 30, 30, 90, 0, 67, 90, 30, 67, 90, 0,

  // right of bottom
  30, 90, 0, 30, 150, 30, 30, 90, 30, 30, 90, 0, 30, 150, 0, 30, 150, 30,

  // bottom
  0, 150, 0, 0, 150, 30, 30, 150, 30, 0, 150, 0, 30, 150, 30, 30, 150, 0,

  // left side
  0, 0, 0, 0, 0, 30, 0, 150, 30, 0, 0, 0, 0, 150, 30, 0, 150, 0,
]);
let positionMatrix = mat4.create();
mat4.rotateX(positionMatrix, positionMatrix, Math.PI);
for (let i = 0; i < positions.length; i += 3) {
  let tmp = mat4.multiply(mat4.create(), positionMatrix, Float32Array.from([positions[i], positions[i + 1], positions[i + 2], 1]));
  positions[i] = tmp[0];
  positions[i + 1] = tmp[1];
  positions[i + 2] = tmp[2];
}
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
const normals = new Float32Array([
  // left column front
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

  // top rung front
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

  // middle rung front
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

  // left column back
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

  // top rung back
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

  // middle rung back
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

  // top
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

  // top rung right
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

  // under top rung
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

  // between top rung and middle
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

  // top of middle rung
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

  // right of middle rung
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

  // bottom of middle rung.
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

  // right of bottom
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

  // bottom
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

  // left side
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
]);
gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

const rotate = { y: 0 };
gsap.to(rotate, { y: Math.PI * 2, duration: 5, ease: "none", repeat: -1 });

draw();

function draw() {
  assertHTMLCanvasElement(canvas);

  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  //
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(normalLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  //

  let projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 3, canvas.width / canvas.height, 0.1, 1000);
  let viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 200], [0, 0, 0], [0, 1, 0]);
  let modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [0, 50, -100]);
  mat4.rotateY(modelMatrix, modelMatrix, rotate.y);
  let modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, modelMatrix);
  let projectionModelViewMatrix = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix);
  gl.uniformMatrix4fv(matrixLocation, false, projectionModelViewMatrix);

  let normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix);
  //
  gl.uniform4fv(colorLocation, [0.2, 0.9, 0.2, 1.0]);

  gl.uniform3fv(lightLocation, [0.5, 1, 1.5]);

  //
  gl.drawArrays(gl.TRIANGLES, 0, 96);

  requestAnimationFrame(draw);
}
