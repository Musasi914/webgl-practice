import { assertHTMLCanvasElement } from "../typegard";
import { WebGLBasicUtility } from "../WebGLUtil";
import vertexShaderSource from "/shader/webglfundamentals/pointLight/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webglfundamentals/pointLight/fragmentShader.glsl?raw";
import { mat4, vec3 } from "gl-matrix";
import gsap from "gsap";

const canvas = document.querySelector("#myGLCanvas");
assertHTMLCanvasElement(canvas);

const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
const normalLocation = gl.getAttribLocation(shaderProgram, "a_normal");

const lightLocation = gl.getUniformLocation(shaderProgram, "u_lightWorldPosition");
const worldLocation = gl.getUniformLocation(shaderProgram, "u_world");
const worldViewProjectionLocation = gl.getUniformLocation(shaderProgram, "u_worldViewProjection");
const worldInverseTransposeLocation = gl.getUniformLocation(shaderProgram, "u_worldInverseTranspose");
const colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
const viewWorldPositionLocation = gl.getUniformLocation(shaderProgram, "u_viewWorldPosition");
const shininessLocation = gl.getUniformLocation(shaderProgram, "u_shininess");
const lightColorLocation = gl.getUniformLocation(shaderProgram, "u_lightColor");
const specularColorLocation = gl.getUniformLocation(shaderProgram, "u_specularColor");

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
mat4.translate(positionMatrix, positionMatrix, [-50, -75, -15]);
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
  resizeCanvasToDisplaySize(canvas);

  gl.viewport(0, 0, canvas.width, canvas.height);
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
  let projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 3, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  let viewMatrix = mat4.lookAt(mat4.create(), [100, 150, 200], [0, 35, 0], [0, 1, 0]);
  let worldMatrix = mat4.create();
  // mat4.translate(worldMatrix, worldMatrix, [0, 50, -100]);
  mat4.rotateY(worldMatrix, worldMatrix, rotate.y);
  gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

  let worldViewMatrix = mat4.multiply(mat4.create(), viewMatrix, worldMatrix);
  let worldViewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, worldViewMatrix);
  gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);

  let worldInverseTransposeMatrix = mat4.create();
  mat4.invert(worldInverseTransposeMatrix, worldMatrix);
  mat4.transpose(worldInverseTransposeMatrix, worldInverseTransposeMatrix);
  gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

  //
  gl.uniform3fv(viewWorldPositionLocation, [100, 150, 200]);
  gl.uniform4fv(colorLocation, [0.2, 0.9, 0.2, 1.0]);
  gl.uniform3fv(lightLocation, [20, 30, 60]);
  gl.uniform1f(shininessLocation, 150);
  gl.uniform3fv(lightColorLocation, vec3.normalize(vec3.create(), vec3.set(vec3.create(), 1, 0.6, 0.6)));
  gl.uniform3fv(specularColorLocation, vec3.normalize(vec3.create(), vec3.set(vec3.create(), 1, 0.6, 0.6)));

  //
  gl.drawArrays(gl.TRIANGLES, 0, 96);

  requestAnimationFrame(draw);
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const displayWidth = canvas.clientWidth * window.devicePixelRatio;
  const displayHeight = canvas.clientHeight * window.devicePixelRatio;

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}
