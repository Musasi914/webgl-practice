import fragmentShaderSource from "/shader/webglfundamentals/3d-projection/fragmentShader.glsl?raw";
import vertexShaderSource from "/shader/webglfundamentals/3d-projection/vertexShader.glsl?raw";
import { WebGLBasicUtility } from "../WebGLUtil";
import { mat4 } from "gl-matrix";
// import gsap from "gsap";

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;

const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const vertexPositionAttribLocation = gl.getAttribLocation(shaderProgram, "a_position");
const colorAttribLocation = gl.getAttribLocation(shaderProgram, "a_color");
const matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
// const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "u_projectionMatrix");

// buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// 「F」を描画
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
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
  ]),
  gl.STATIC_DRAW
);

// colorbuffer
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Uint8Array([
    // left column front
    200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,

    // top rung front
    200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,

    // middle rung front
    200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,

    // left column back
    80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,

    // top rung back
    80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,

    // middle rung back
    80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,

    // top
    70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210,

    // top rung right
    200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70,

    // under top rung
    210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70,

    // between top rung and middle
    210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70,

    // top of middle rung
    70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210,

    // right of middle rung
    100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210,

    // bottom of middle rung.
    76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100,

    // right of bottom
    140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80,

    // bottom
    90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110,

    // left side
    160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220,
  ]),
  gl.STATIC_DRAW
);

// draw
// const radian = { x: (0 * Math.PI) / 180, y: (0 * Math.PI) / 180, z: (0 * Math.PI) / 180 };
// gsap.to(radian, { x: (360 * Math.PI) / 180, repeat: -1, duration: 5, ease: "none" });
drawScene();

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);

  gl.enableVertexAttribArray(vertexPositionAttribLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(vertexPositionAttribLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(colorAttribLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  // let projectionMatrix = mat4.create();
  // mat4.perspective(projectionMatrix, Math.PI / 3, canvas.width / canvas.height, 0.1, 1000);
  // mat4.ortho(projectionMatrix, -150, 150, -150, 150, 0.1, 1000);
  // gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

  const translation = [-30, 0, -400];
  // const radian = [(40 * Math.PI) / 180, (25 * Math.PI) / 180, (325 * Math.PI) / 180];
  // const scale = [1, 1, 1];

  let modelViewMatrix = mat4.create();
  mat4.identity(modelViewMatrix);
  mat4.perspective(modelViewMatrix, Math.PI / 3, canvas.width / canvas.height, 0.1, 1000);
  mat4.translate(modelViewMatrix, modelViewMatrix, Float32Array.from(translation));
  // mat4.rotateX(modelViewMatrix, modelViewMatrix, radian.x);
  // mat4.rotateY(modelViewMatrix, modelViewMatrix, radian.y);
  // mat4.rotateZ(modelViewMatrix, modelViewMatrix, radian.z);
  // mat4.scale(modelViewMatrix, modelViewMatrix, Float32Array.from(scale));
  gl.uniformMatrix4fv(matrixLocation, false, modelViewMatrix);

  gl.drawArrays(gl.TRIANGLES, 0, 96);

  requestAnimationFrame(drawScene);
}
