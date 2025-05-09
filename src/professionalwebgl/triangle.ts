import vertexShaderSource from "/shader/professional_webgl/shader_easy/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/professional_webgl/shader_easy/fragmentShader.glsl?raw";
import { assertHTMLCanvasElement } from "../typegard.js";

const canvas = document.querySelector("#myGLCanvas");
assertHTMLCanvasElement(canvas);
const gl = canvas.getContext("webgl") as WebGLRenderingContext;
const vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

const vertexPositionLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
const vertexColorLocation = gl.getAttribLocation(shaderProgram, "aVertexColor");

const triangleVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
const triangleVertices = [0.0, 0.5, 0.0, 255, 0, 0, 255, 0.5, -0.5, 0.0, 0, 255, 0, 255, -0.5, -0.5, 0.0, 0, 0, 255, 255];
const NUM_OF_VERTICES = 3;
const vertexSizeInBytes = 3 * Float32Array.BYTES_PER_ELEMENT + 4 * Uint8Array.BYTES_PER_ELEMENT;
const vertexSizeInFloats = vertexSizeInBytes / Float32Array.BYTES_PER_ELEMENT;

const buffer = new ArrayBuffer(NUM_OF_VERTICES * vertexSizeInBytes);
const positionView = new Float32Array(buffer);
const colorView = new Uint8Array(buffer);
let k = 0;
let positionOffsetInFloats = 0;
let colorOffsetInBytes = 12;
for (let i = 0; i < NUM_OF_VERTICES; i++) {
  positionView[positionOffsetInFloats] = triangleVertices[k];
  positionView[positionOffsetInFloats + 1] = triangleVertices[k + 1];
  positionView[positionOffsetInFloats + 2] = triangleVertices[k + 2];
  colorView[colorOffsetInBytes] = triangleVertices[k + 3];
  colorView[colorOffsetInBytes + 1] = triangleVertices[k + 4];
  colorView[colorOffsetInBytes + 2] = triangleVertices[k + 5];
  colorView[colorOffsetInBytes + 3] = triangleVertices[k + 6];

  positionOffsetInFloats += vertexSizeInFloats;
  colorOffsetInBytes += vertexSizeInBytes;
  k += 7;
}
gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);

gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.enableVertexAttribArray(vertexPositionLocation);
gl.enableVertexAttribArray(vertexColorLocation);
gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 16, 0);
gl.vertexAttribPointer(vertexColorLocation, 4, gl.UNSIGNED_BYTE, true, 16, 12);
gl.drawArrays(gl.TRIANGLES, 0, 3);
