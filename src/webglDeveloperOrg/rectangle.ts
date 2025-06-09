import { WebGLBasicUtility } from "../WebGLUtil";
import vertexShaderSource from "/shader/webglDeveloperOrg/recursive/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webglDeveloperOrg/recursive/fragmentShader.glsl?raw";
import { mat4 } from "gl-matrix";

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;
const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

canvas.width = canvas.clientWidth * window.devicePixelRatio;
canvas.height = canvas.clientHeight * window.devicePixelRatio;

const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
const colorLocation = gl.getAttribLocation(shaderProgram, "a_color");
const matrixLocation = gl.getUniformLocation(shaderProgram, "u_mvpMatrix");

// buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const position = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, -1.0, 0.0];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
const color = [1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
const index = [0, 1, 2, 1, 2, 3];
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), gl.STATIC_DRAW);

const modelMatrix = mat4.create();
const viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 3], [0, 0, 0], [0, 1, 0]);
const projectionMatrix = mat4.perspective(mat4.create(), (90 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100);
const viewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);

gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

// draw
let count = 0;
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.9, 0.9, 0.9, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

draw();

function draw() {
  const radian = (((count % 360) * Math.PI) / 180) * 2;
  mat4.identity(modelMatrix);
  mat4.rotateY(modelMatrix, modelMatrix, radian);
  const modelViewProjectonMatrix = mat4.multiply(mat4.create(), viewProjectionMatrix, modelMatrix);
  gl.uniformMatrix4fv(matrixLocation, false, modelViewProjectonMatrix);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  count++;
  requestAnimationFrame(draw);
}
