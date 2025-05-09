import vertexShaderSource from "/shader/professional_webgl/shader/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/professional_webgl/shader/fragmentShader.glsl?raw";
import { mat4 } from "gl-matrix";

function setupShaders(gl: WebGLRenderingContext) {
  const vertexShader = loadShader(gl, vertexShaderSource, "vertex");
  const fragmentShader = loadShader(gl, fragmentShaderSource, "fragment");

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost())
    throw new Error(`${gl.getProgramInfoLog(shaderProgram)}`);

  gl.useProgram(shaderProgram);

  const vertexPositionLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  const vertexColorLocation = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexPositionLocation);
  // gl.enableVertexAttribArray(vertexColorLocation);

  return {
    shaderProgram,
    vertexPositionLocation,
    vertexColorLocation,
  };
}

function loadShader(gl: WebGLRenderingContext, shaderSource: string, type: "vertex" | "fragment") {
  const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER) as WebGLShader;
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`${gl.getShaderInfoLog(shader)}`);
  return shader;
}

function draw(gl: WebGLRenderingContext, shaderProgram: WebGLProgram, projectionMatrix: mat4, modelViewMatrix: mat4) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  mat4.perspective(projectionMatrix, Math.PI / 3, canvas.width / canvas.height, 0.1, 100.0);
  uploadProjectionMatrixToShader(gl, shaderProgram, projectionMatrix);

  mat4.identity(modelViewMatrix);
  mat4.lookAt(modelViewMatrix, [8, 10, 15], [0, 0, 0], [0, 1, 0]);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 3.0, 0.0]);

  pushMatrix(modelViewMatrix, stack);
  drawFloor(vertexPositionLocation, vertexColorLocation, [1.0, 0.0, 0.0, 1.0], modelViewMatrix);
  modelViewMatrix = popMatrix(stack);

  pushMatrix(modelViewMatrix, stack);
  drawTable(gl, shaderProgram, modelViewMatrix, stack);
  modelViewMatrix = popMatrix(stack);

  // Draw box on top of the table
  drawBox(vertexPositionLocation, vertexColorLocation, [1.0, 1.0, 1.0, 1.0], modelViewMatrix, stack);
}

function uploadModelViewMatrixToShader(gl: WebGLRenderingContext, shaderProgram: WebGLProgram, modelViewMatrix: mat4) {
  const modelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  if (modelViewMatrixLocation) {
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
  }
}

function uploadProjectionMatrixToShader(gl: WebGLRenderingContext, shaderProgram: WebGLProgram, projectionMatrix: mat4) {
  const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uPMatrix");
  if (projectionMatrixLocation) {
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
  }
}

function pushMatrix(matrix: mat4, stack: mat4[]) {
  const copyToPush = mat4.copy(mat4.create(), matrix);
  stack.push(copyToPush);
}

function popMatrix(stack: mat4[]): mat4 {
  if (stack.length === 0) throw new Error("popmodelviewmatrixでエラー　配列が空");
  return stack.pop() as mat4;
}

function drawTable(gl: WebGLRenderingContext, shaderProgram: WebGLProgram, modelViewMatrix: mat4, stack: mat4[]) {
  // テーブルの天板を描画
  pushMatrix(modelViewMatrix, stack);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 1.0, 0.0]);
  mat4.scale(modelViewMatrix, modelViewMatrix, [2.0, 0.1, 2.0]);
  uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
  // 立方体（今は直方体にスケール変換されている）を茶色で描く
  drawCube(gl, shaderProgram, [0.72, 0.53, 0.04, 1.0]);
  modelViewMatrix = popMatrix(stack);

  // テーブルの脚を描画
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      pushMatrix(modelViewMatrix, stack);
      mat4.translate(modelViewMatrix, modelViewMatrix, [i * 1.9, -0.1, j * 1.9]);
      mat4.scale(modelViewMatrix, modelViewMatrix, [0.1, 1.0, 0.1]);
      uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
      drawCube(gl, shaderProgram, [0.72, 0.53, 0.04, 1.0]); // 引数で茶色を設定
      modelViewMatrix = popMatrix(stack);
    }
  }
}

function drawCube(gl: WebGLRenderingContext, shaderProgram: WebGLProgram, color: [number, number, number, number]) {
  const vertexPositionLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  const vertexColorLocation = gl.getAttribLocation(shaderProgram, "aVertexColor");

  // 立方体の頂点データ
  const vertices = [
    // 前面
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    // 背面
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
  ];

  const indices = [
    // 前面
    0, 1, 2, 0, 2, 3,
    // 背面
    4, 5, 6, 4, 6, 7,
    // 上面
    3, 2, 6, 3, 6, 5,
    // 底面
    0, 4, 7, 0, 7, 1,
    // 右面
    1, 7, 6, 1, 6, 2,
    // 左面
    0, 3, 5, 0, 5, 4,
  ];

  // バッファ
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  // 頂点属性設定
  gl.enableVertexAttribArray(vertexPositionLocation);
  gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);

  // 色設定
  gl.disableVertexAttribArray(vertexColorLocation);
  gl.vertexAttrib4f(vertexColorLocation, ...color);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

function drawFloor(
  vertexPositionLocation: number,
  vertexColorLocation: number,
  color: [number, number, number, number],
  modelViewMatrix: mat4
) {
  gl.disableVertexAttribArray(vertexColorLocation);
  gl.vertexAttrib4f(vertexColorLocation, ...color);

  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIndexBuffer);

  // pushMatrix(modelViewMatrix, stack);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0, -1.1, 0]);
  uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
  // modelViewMatrix = popMatrix(stack);

  gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);
}

function drawBox(
  vertexPositionLocation: number,
  vertexColorLocation: number,
  color: [number, number, number, number],
  modelViewMatrix: mat4,
  stack: mat4[]
) {
  pushMatrix(modelViewMatrix, stack);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 2.0, 0.0]);
  mat4.scale(modelViewMatrix, modelViewMatrix, [0.5, 0.5, 0.5]);
  uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);

  gl.disableVertexAttribArray(vertexColorLocation);
  gl.vertexAttrib4f(vertexColorLocation, ...color);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  modelViewMatrix = popMatrix(stack);
}

function setupFloorBuffers(gl: WebGLRenderingContext) {
  const floorVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  const floorVertexPosition = [5.0, 0.0, 5.0, 5.0, 0.0, -5.0, -5.0, 0.0, -5.0, -5.0, 0.0, 5.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPosition), gl.STATIC_DRAW);

  const floorIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIndexBuffer);
  const floorIndices = [0, 1, 2, 3];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorIndices), gl.STATIC_DRAW);

  return { floorVertexPositionBuffer, floorIndexBuffer };
}

function setupBoxBuffers(gl: WebGLRenderingContext) {
  const cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  const cubeVertexPosition = [
    // Front face
    1.0,
    1.0,
    1.0, //v0
    -1.0,
    1.0,
    1.0, //v1
    -1.0,
    -1.0,
    1.0, //v2
    1.0,
    -1.0,
    1.0, //v3

    // Back face
    1.0,
    1.0,
    -1.0, //v4
    -1.0,
    1.0,
    -1.0, //v5
    -1.0,
    -1.0,
    -1.0, //v6
    1.0,
    -1.0,
    -1.0, //v7

    // Left face
    -1.0,
    1.0,
    1.0, //v8
    -1.0,
    1.0,
    -1.0, //v9
    -1.0,
    -1.0,
    -1.0, //v10
    -1.0,
    -1.0,
    1.0, //v11

    // Right face
    1.0,
    1.0,
    1.0, // v12
    1.0,
    -1.0,
    1.0, // v13
    1.0,
    -1.0,
    -1.0, // v14
    1.0,
    1.0,
    -1.0, // v15

    // Top face
    1.0,
    1.0,
    1.0, // v16
    1.0,
    1.0,
    -1.0, // v17
    -1.0,
    1.0,
    -1.0, // v18
    -1.0,
    1.0,
    1.0, // v19

    // Bottom face
    1.0,
    -1.0,
    1.0, // v20
    1.0,
    -1.0,
    -1.0, // v21
    -1.0,
    -1.0,
    -1.0, // v22
    -1.0,
    -1.0,
    1.0, // v23
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexPosition), gl.STATIC_DRAW);

  const cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  const cuveVertexIndices = [
    0,
    1,
    2,
    0,
    2,
    3, // Front face
    4,
    6,
    5,
    4,
    7,
    6, // Back face
    8,
    9,
    10,
    8,
    10,
    11, // Left face
    12,
    13,
    14,
    12,
    14,
    15, // Right face
    16,
    17,
    18,
    16,
    18,
    19, // Top face
    20,
    22,
    21,
    20,
    23,
    22, // Bottom face
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cuveVertexIndices), gl.STATIC_DRAW);

  return { cubeVertexPositionBuffer, cubeVertexIndexBuffer };
}

function handleContextLost() {
  console.log("context lost");
}

function handleContextRestored() {
  console.log("context restored");
}

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl") as WebGLRenderingContext;

canvas.addEventListener("webglcontextlost", handleContextLost);
canvas.addEventListener("webglcontextrestored", handleContextRestored);

const { shaderProgram, vertexPositionLocation, vertexColorLocation } = setupShaders(gl);

const { floorVertexPositionBuffer, floorIndexBuffer } = setupFloorBuffers(gl);
const { cubeVertexPositionBuffer, cubeVertexIndexBuffer } = setupBoxBuffers(gl);

let modelViewMatrix = mat4.create();
let projectionMatrix = mat4.create();
let stack: mat4[] = [];
gl.clearColor(0.9, 0.9, 0.9, 1.0);
gl.enable(gl.DEPTH_TEST);

draw(gl, shaderProgram, projectionMatrix, modelViewMatrix);
