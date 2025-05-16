import fragmentShaderSource from "/shader/webglfundamentals/lightDirection/fragmentShader.glsl?raw";
import vertexShaderSource from "/shader/webglfundamentals/lightDirection/vertexShader.glsl?raw";
import { WebGLBasicUtility } from "../WebGLUtil";
import { mat4 } from "gl-matrix";
import gsap from "gsap";
import { assertHTMLCanvasElement } from "../typegard";

const LIGHT_DIRECTION = [0.5, 0.7, 1];
const OBJECT_COLOR = [0.2, 1, 0.2, 1];

const canvas = document.querySelector("#myGLCanvas");
assertHTMLCanvasElement(canvas);

const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
const normalLocation = gl.getAttribLocation(shaderProgram, "a_normal");
const matrixLocation = gl.getUniformLocation(shaderProgram, "u_worldViewProjection");
const colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
const reverseLightDirectionLocation = gl.getUniformLocation(shaderProgram, "u_reverseLightDirection");
const worldInverseTransposeLocation = gl.getUniformLocation(shaderProgram, "u_worldInverseTranspose");

const { positionBuffer, normalBuffer } = prepareBuffer();

gsap.defaults({ ease: "none" });

const rotate = { y: 0 };
gsap.to(rotate, { y: Math.PI * 2, repeat: -1, duration: 10 });

drawScene();

function prepareBuffer() {
  // buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  let positions = new Float32Array([
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
  mat4.translate(positionMatrix, positionMatrix, Float32Array.from([-50, -75, -15]));
  let vector = mat4.create();
  for (let i = 0; i < positions.length; i += 3) {
    mat4.multiply(vector, positionMatrix, Float32Array.from([positions[i], positions[i + 1], positions[i + 2], 1]));
    positions[i] = vector[0];
    positions[i + 1] = vector[1];
    positions[i + 2] = vector[2];
  }
  // 「F」を描画
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // normalbuffer
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  const normals = new Float32Array([
    // 前面の左縦列
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

    // 前面の上の横棒
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

    // 前面の中の横棒
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

    // 裏面の左縦列
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

    // 裏面の上の横棒
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

    // 裏面の中の横棒
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

    // 上面
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

    // 上横棒の上面
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

    // 上横棒の下面
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

    // 上横棒と中横棒の間面
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

    // 中横棒の上面
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

    // 中横棒の右面
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

    // 中横棒の下面
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

    // 下の部分の右面
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

    // 下面
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

    // 左面
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  return { positionBuffer, normalBuffer };
}

function drawScene() {
  assertHTMLCanvasElement(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(normalLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  let projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, Math.PI / 3, canvas.width / canvas.height, 1, 2000);

  let viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [100, 150, 200], [0, 35, 0], [0, 1, 0]);

  let viewProjectionMatrix = mat4.create();
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

  let worldMatrix = mat4.create();
  mat4.rotateY(worldMatrix, worldMatrix, rotate.y);

  let worldViewProjectionMatrix = mat4.create();
  mat4.multiply(worldViewProjectionMatrix, viewProjectionMatrix, worldMatrix);

  let worldInverseMatrix = mat4.create();
  mat4.invert(worldInverseMatrix, worldMatrix);

  let worldInverseTransposeMatrix = mat4.create();
  mat4.transpose(worldInverseTransposeMatrix, worldInverseMatrix);

  gl.uniformMatrix4fv(matrixLocation, false, worldViewProjectionMatrix);

  gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

  gl.uniform4fv(colorLocation, OBJECT_COLOR);
  gl.uniform3fv(reverseLightDirectionLocation, LIGHT_DIRECTION);
  gl.uniform3fv(reverseLightDirectionLocation, [0.5, 0.7, 1]);

  gl.drawArrays(gl.TRIANGLES, 0, 96);

  requestAnimationFrame(drawScene);
}
