import vertexShaderSource from "/shader/professional_webgl/shader_easy/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/professional_webgl/shader_easy/fragmentShader.glsl?raw";

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl");
if (gl == null) throw new Error("glコンテキストにエラー");

const { vertexPositionLocation, vertexColorLocation } = setupShaders(gl);

// hexagon
const hexagonVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, hexagonVertexBuffer);
const hexagonVertices = [
  -0.3,
  0.6,
  0.0, // v0
  -0.4,
  0.8,
  0.0, //v1
  -0.6,
  0.8,
  0.0, //v2
  -0.7,
  0.6,
  0.0, //v3
  -0.6,
  0.4,
  0.0, //v4
  -0.4,
  0.4,
  0.0, // v5
  -0.3,
  0.6,
  0.0, // v6
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hexagonVertices), gl.STATIC_DRAW);
const hexagonBufferData = { itemSize: 3, numOfItems: 7 };

// triangle
const triangleVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
const triangleVertices = [
  0.3,
  0.4,
  0.0, // v0
  0.7,
  0.4,
  0.0, // v1
  0.5,
  0.8,
  0.0, // v2
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
const triangleBufferData = { itemSize: 3, numOfItems: 3 };

const triangleVertexColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
const colors = [1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
const triangleVertexColorData = { itemSize: 4, numOfItems: 3 };

// strip
const stripVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, stripVertexBuffer);
const stripVertices = [
  -0.5,
  0.2,
  0.0, // v0
  -0.4,
  0.0,
  0.0, // v1
  -0.3,
  0.2,
  0.0, // v2
  -0.2,
  0.0,
  0.0, // v3
  -0.1,
  0.2,
  0.0, // v4
  0.0,
  0.0,
  0.0, // v5
  0.1,
  0.2,
  0.0, // v6
  0.2,
  0.0,
  0.0, // v7
  0.3,
  0.2,
  0.0, // v8
  0.4,
  0.0,
  0.0, // v9
  0.5,
  0.2,
  0.0, // v10
  -0.5,
  -0.3,
  0.0, // v11
  -0.4,
  -0.5,
  0.0, // v12
  -0.3,
  -0.3,
  0.0, // v13
  -0.2,
  -0.5,
  0.0, // v14
  -0.1,
  -0.3,
  0.0, // v15
  0.0,
  -0.5,
  0.0, // v16
  0.1,
  -0.3,
  0.0, // v17
  0.2,
  -0.5,
  0.0, // v18
  0.3,
  -0.3,
  0.0, // v19
  0.4,
  -0.5,
  0.0, // v20
  0.5,
  -0.3,
  0.0, // v21
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stripVertices), gl.STATIC_DRAW);
const stripBufferData = { itemSize: 3, numOfItems: 22 };

const stripElementBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stripElementBuffer);
const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
const stripElementBufferData = { numOfItems: 24 };

////////

gl.frontFace(gl.CCW);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

/////////

// draw
gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clear(gl.COLOR_BUFFER_BIT);

// draw hexagon
gl.disableVertexAttribArray(vertexColorLocation);
gl.vertexAttrib4f(vertexColorLocation, 0.0, 0.0, 0.0, 1.0);
gl.bindBuffer(gl.ARRAY_BUFFER, hexagonVertexBuffer);
gl.vertexAttribPointer(vertexPositionLocation, hexagonBufferData.itemSize, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.LINE_STRIP, 0, hexagonBufferData.numOfItems);

// draw triangle
gl.enableVertexAttribArray(vertexColorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
gl.vertexAttribPointer(vertexPositionLocation, triangleBufferData.itemSize, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
gl.vertexAttribPointer(vertexColorLocation, triangleVertexColorData.itemSize, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.TRIANGLES, 0, triangleBufferData.numOfItems);

// draw strip
gl.disableVertexAttribArray(vertexColorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, stripVertexBuffer);
gl.vertexAttribPointer(vertexPositionLocation, stripBufferData.itemSize, gl.FLOAT, false, 0, 0);
gl.vertexAttrib4f(vertexColorLocation, 1.0, 1.0, 0.0, 1.0);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stripElementBuffer);
gl.drawElements(gl.TRIANGLE_STRIP, stripElementBufferData.numOfItems, gl.UNSIGNED_SHORT, 0);
gl.vertexAttrib4f(vertexColorLocation, 0.0, 0.0, 0.0, 1.0);

gl.drawArrays(gl.LINE_STRIP, 0, 11);
gl.drawArrays(gl.LINE_STRIP, 11, 11);

//-------------------------------------------------------------------------------

function setupShaders(gl: WebGLRenderingContext) {
  const vertexShader = loadShader(gl, vertexShaderSource, "vertex");
  const fragmentShader = loadShader(gl, fragmentShaderSource, "fragment");

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) throw new Error(`${gl.getProgramInfoLog(shaderProgram)}`);
  gl.useProgram(shaderProgram);

  const vertexPositionLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  const vertexColorLocation = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexPositionLocation);
  gl.enableVertexAttribArray(vertexColorLocation);

  return {
    vertexPositionLocation,
    vertexColorLocation,
  };
}

function loadShader(gl: WebGLRenderingContext, shaderSource: string, type: "vertex" | "fragment") {
  const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER) as WebGLShader;
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`${gl.getShaderInfoLog(shader)}`);
  return shader;
}
