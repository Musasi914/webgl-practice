import fragmentShaderSource from "/shader/webglfundamentals/manyRect/fragmentShader.glsl?raw";
import vertexShaderSource from "/shader/webglfundamentals/manyRect/vertexShader.glsl?raw";
import { WebGLBasicUtility } from "../WebGLUtil";

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;

const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
const vertexPositionAttribLocation = gl.getAttribLocation(shaderProgram, "a_position");
const vertexColorUniformLocation = gl.getUniformLocation(shaderProgram, "u_color");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// const positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30];
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.9, 0.9, 0.9, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.enableVertexAttribArray(vertexPositionAttribLocation);
gl.vertexAttribPointer(vertexPositionAttribLocation, 2, gl.FLOAT, false, 0, 0);

gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

for (let i = 0; i < 50; i++) {
  const x = randomInt(300);
  const width = randomInt(300);
  const y = randomInt(300);
  const height = randomInt(300);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x, y, x + width, y, x, y + height, x, y + height, x + width, y, x + width, y + height]),
    gl.STATIC_DRAW
  );
  gl.uniform4f(vertexColorUniformLocation, Math.random(), Math.random(), Math.random(), 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}
