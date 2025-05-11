// htmlに以下を追加してあげる
// <p>
//   FPS: <span class="fpsCounter">--</span>
// </p>;

import vertexShaderSource from "/shader/professional_webgl/shader_l5/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/professional_webgl/shader_l5/fragmentShader.glsl?raw";
import { mat4 } from "gl-matrix";

/** GLSLのプログラムを作成してGPUにアップロード */
function setupShaders(gl: WebGLRenderingContext) {
  const vertexShader = createShader(gl, vertexShaderSource, "vertex");
  const fragmentShader = createShader(gl, fragmentShaderSource, "fragment");

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost())
    throw new Error(`${gl.getProgramInfoLog(shaderProgram)}`);

  gl.useProgram(shaderProgram);

  const vertexPositionAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  const vertexTextureAttribLoc = gl.getAttribLocation(shaderProgram, "aTextureCoordinates");

  const uniformMVMatrixLoc = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  const uniformProjMatrixLoc = gl.getUniformLocation(shaderProgram, "uPMatrix");
  const uniformSamplerLoc = gl.getUniformLocation(shaderProgram, "uSampler");

  gl.enableVertexAttribArray(vertexPositionAttribLoc);
  gl.enableVertexAttribArray(vertexTextureAttribLoc);

  return {
    shaderProgram,
    vertexPositionAttribLoc,
    vertexTextureAttribLoc,
    uniformMVMatrixLoc,
    uniformProjMatrixLoc,
    uniformSamplerLoc,
  };
}

function createShader(gl: WebGLRenderingContext, shaderSource: string, type: "vertex" | "fragment") {
  const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER) as WebGLShader;
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`${gl.getShaderInfoLog(shader)}`);
  return shader;
}

function draw(elapsedTime_ms: number) {
  // fps
  requestId = requestAnimationFrame(draw);

  if (fpsCounter) {
    if (elapsedTime_ms - previousFrameTime >= 1000) {
      fpsCounter.innerHTML = `${numOfFramesForFPS}`;
      numOfFramesForFPS = 0;
      previousFrameTime = elapsedTime_ms;
    }
    numOfFramesForFPS++;
  }

  //
  if (pressedKeys.ArrowUp) {
    circleRadius += 0.1;
  }
  if (pressedKeys.ArrowDown) {
    circleRadius -= 0.1;
    if (circleRadius < 0) circleRadius = 0;
  }

  // 描画
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let modelViewMatrix = mat4.create();
  let projectionMatrix = mat4.create();
  let stack: mat4[] = [];

  mat4.perspective(projectionMatrix, Math.PI / 3, canvas.width / canvas.height, 1, 100.0);

  mat4.identity(modelViewMatrix);
  mat4.lookAt(modelViewMatrix, [8, 10, -10], [0, 0, 0], [0, 1, 0]);

  uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
  uploadProjectionMatrixToShader(gl, shaderProgram, projectionMatrix);

  gl.uniform1i(uniformSamplerLoc, 0);

  drawFloor(modelViewMatrix);

  pushMatrix(modelViewMatrix, stack);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 1.1, 0.0]);
  uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
  drawTable(modelViewMatrix, stack);
  modelViewMatrix = popMatrix(stack);

  // 箱
  pushMatrix(modelViewMatrix, stack);
  if (y < 5) {
    y = 2.7 + (elapsedTime_ms / 3000) * (5.0 - 2.7);
  } else {
    angle = (elapsedTime_ms / 2000) * 2 * Math.PI;
    x = Math.cos(angle) * circleRadius;
    z = Math.sin(angle) * circleRadius;
  }

  mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, z]);
  mat4.scale(modelViewMatrix, modelViewMatrix, [0.5, 0.5, 0.5]);
  uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
  drawCube(boxTexture);
  modelViewMatrix = popMatrix(stack);
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

function drawTable(modelViewMatrix: mat4, stack: mat4[]) {
  // テーブルの天板を描画
  pushMatrix(modelViewMatrix, stack);
  mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 1.0, 0.0]);
  mat4.scale(modelViewMatrix, modelViewMatrix, [2.0, 0.1, 2.0]);
  uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
  // 立方体（今は直方体にスケール変換されている）を茶色で描く
  drawCube(woodTexture);
  modelViewMatrix = popMatrix(stack);

  // テーブルの脚を描画
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      pushMatrix(modelViewMatrix, stack);
      mat4.translate(modelViewMatrix, modelViewMatrix, [i * 1.9, -0.1, j * 1.9]);
      mat4.scale(modelViewMatrix, modelViewMatrix, [0.1, 1.0, 0.1]);
      uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
      drawCube(woodTexture);
      modelViewMatrix = popMatrix(stack);
    }
  }
}

function drawFloor(modelViewMatrix: mat4) {
  // position
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  gl.vertexAttribPointer(vertexPositionAttribLoc, floorVertexPosBufferData.itemSize, gl.FLOAT, false, 0, 0);

  // coordinate
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTextureCoordinateBuffer);
  gl.vertexAttribPointer(vertexTextureAttribLoc, floorVertexCoordBufferData.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, groundTexture);

  // idx
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIndexBuffer);

  gl.drawElements(gl.TRIANGLE_FAN, floorVertexIndexBufferData.numOfItems, gl.UNSIGNED_SHORT, 0);

  // pushMatrix(modelViewMatrix, stack);
  // mat4.translate(modelViewMatrix, modelViewMatrix, [0, -1.1, 0]);
  // uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);
  // modelViewMatrix = popMatrix(stack);

  // gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);
}

function drawCube(texture: WebGLTexture) {
  // pushMatrix(modelViewMatrix, stack);
  // mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 2.0, 0.0]);
  // uploadModelViewMatrixToShader(gl, shaderProgram, modelViewMatrix);

  // pos
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(vertexPositionAttribLoc, cubeVertexPositionBufferData.itemSize, gl.FLOAT, false, 0, 0);

  // tex
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordinateBuffer);
  gl.vertexAttribPointer(vertexTextureAttribLoc, cubeVertexTexCoordBufferData.itemSize, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // idx
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

  gl.drawElements(gl.TRIANGLE_FAN, cubeVertexIndexBufferData.numOfItems, gl.UNSIGNED_SHORT, 0);
}

function setupFloorBuffers(gl: WebGLRenderingContext) {
  const floorVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  const floorVertexPosition = [5.0, 0.0, 5.0, 5.0, 0.0, -5.0, -5.0, 0.0, -5.0, -5.0, 0.0, 5.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexPosition), gl.STATIC_DRAW);
  const floorVertexPosBufferData = { itemSize: 3, numOfItems: 4 };

  const floorVertexTextureCoordinateBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTextureCoordinateBuffer);
  const floorVertexTextureCoordinates = [
    1.0,
    0.0, // v0
    1.0,
    1.0, // v1
    0.0,
    1.0, // v2
    0.0,
    0.0, // v3
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertexTextureCoordinates), gl.STATIC_DRAW);
  const floorVertexCoordBufferData = { itemSize: 2, numOfItems: 4 };

  const floorIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIndexBuffer);
  const floorVertexIndices = [0, 1, 2, 3];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorVertexIndices), gl.STATIC_DRAW);
  const floorVertexIndexBufferData = { itemSize: 1, numOfItems: 4 };

  return {
    floorVertexPositionBuffer,
    floorVertexPosBufferData,
    floorVertexTextureCoordinateBuffer,
    floorVertexCoordBufferData,
    floorIndexBuffer,
    floorVertexIndexBufferData,
  };
}

function setupCubeBuffers(gl: WebGLRenderingContext) {
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
  const cubeVertexPositionBufferData = { itemSize: 3, numOfItems: 24 };

  const cubeVertexTextureCoordinateBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordinateBuffer);
  const textureCoordinates = [
    //Front face
    0.0,
    0.0, //v0
    1.0,
    0.0, //v1
    1.0,
    1.0, //v2
    0.0,
    1.0, //v3

    // Back face
    0.0,
    1.0, //v4
    1.0,
    1.0, //v5
    1.0,
    0.0, //v6
    0.0,
    0.0, //v7

    // Left face
    0.0,
    1.0, //v8
    1.0,
    1.0, //v9
    1.0,
    0.0, //v10
    0.0,
    0.0, //v11

    // Right face
    0.0,
    1.0, //v12
    1.0,
    1.0, //v13
    1.0,
    0.0, //v14
    0.0,
    0.0, //v15

    // Top face
    0.0,
    1.0, //v16
    1.0,
    1.0, //v17
    1.0,
    0.0, //v18
    0.0,
    0.0, //v19

    // Bottom face
    0.0,
    1.0, //v20
    1.0,
    1.0, //v21
    1.0,
    0.0, //v22
    0.0,
    0.0, //v23
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  const cubeVertexTexCoordBufferData = { itemSize: 2, numOfItems: 24 };

  const cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  const cubeVertexIndices = [
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
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  const cubeVertexIndexBufferData = { itemSize: 1, numOfItems: 36 };

  return {
    cubeVertexPositionBuffer,
    cubeVertexPositionBufferData,
    cubeVertexTextureCoordinateBuffer,
    cubeVertexTexCoordBufferData,
    cubeVertexIndexBuffer,
    cubeVertexIndexBufferData,
  };
}

function setupTextures(gl: WebGLRenderingContext) {
  const woodTexture = gl.createTexture();
  loadImageForTexture("professional_webgl/wood_128x128.jpg", woodTexture);

  const groundTexture = gl.createTexture();
  loadImageForTexture("professional_webgl/wood_floor_256.jpg", groundTexture);

  const boxTexture = gl.createTexture();
  loadImageForTexture("professional_webgl/wicker_256.jpg", boxTexture);

  return { woodTexture, groundTexture, boxTexture };
}

function loadImageForTexture(url: string, texture: WebGLTexture) {
  const image = new Image();
  image.addEventListener("load", () => {
    ongoingImageLoads.splice(ongoingImageLoads.indexOf(image), 1);
    textureFinishedLoading(image, texture);
  });
  ongoingImageLoads.push(image);
  image.src = url;
}

function textureFinishedLoading(image: HTMLImageElement, texture: WebGLTexture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // GPUに画像をアップロード
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

  // gl.bindTexture(gl.TEXTURE_2D, null);
}

function handleContextLost(e: Event) {
  e.preventDefault();
  console.log("context lost");

  cancelAnimationFrame(requestId);

  ongoingImageLoads.forEach((imageLoad) => {
    imageLoad.onload = null;
  });
  ongoingImageLoads = [];
}

function handleContextRestored() {
  console.log("context restored");
}

let requestId: number;

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl") as WebGLRenderingContext;

canvas.addEventListener("webglcontextlost", handleContextLost);
canvas.addEventListener("webglcontextrestored", handleContextRestored);

const { shaderProgram, vertexPositionAttribLoc, vertexTextureAttribLoc, uniformSamplerLoc } = setupShaders(gl);

const {
  floorVertexPositionBuffer,
  floorVertexPosBufferData,
  floorVertexTextureCoordinateBuffer,
  floorVertexCoordBufferData,
  floorIndexBuffer,
  floorVertexIndexBufferData,
} = setupFloorBuffers(gl);

const {
  cubeVertexPositionBuffer,
  cubeVertexPositionBufferData,
  cubeVertexTextureCoordinateBuffer,
  cubeVertexTexCoordBufferData,
  cubeVertexIndexBuffer,
  cubeVertexIndexBufferData,
} = setupCubeBuffers(gl);

let ongoingImageLoads: HTMLImageElement[] = [];
const { woodTexture, groundTexture, boxTexture } = setupTextures(gl);

gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.enable(gl.DEPTH_TEST);

// 動く箱
let x = 0.0;
let y = 2.7;
let z = 0.0;
let circleRadius = 4.0;
let angle = 0;

let previousFrameTime = 0;
let numOfFramesForFPS = 0;
const fpsCounter = document.querySelector(".fpsCounter") as HTMLElement;

let pressedKeys: { [key: string]: boolean } = {};
draw(0);

//

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

function handleKeyDown(e: KeyboardEvent) {
  pressedKeys[e.key] = true;
}
function handleKeyUp(e: KeyboardEvent) {
  pressedKeys[e.key] = false;
}
