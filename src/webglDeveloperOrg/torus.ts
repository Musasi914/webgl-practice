import { WebGLBasicUtility } from "../WebGLUtil";
import vertexShaderSource from "/shader/webglDeveloperOrg/recursive/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webglDeveloperOrg/recursive/fragmentShader.glsl?raw";
import { mat4 } from "gl-matrix";

const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;
const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
const gl = util.gl;
const shaderProgram = util.shaderProgram;

const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
const colorLocation = gl.getAttribLocation(shaderProgram, "a_color");
const matrixLocation = gl.getUniformLocation(shaderProgram, "u_mvpMatrix");

const { positions, colors, indices } = createTorus(1.0, 0.4, 5, 5);

// buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

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
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  count++;
  requestAnimationFrame(draw);
}

function createTorus(radius: number, tubeRadius: number, radialSegments: number, tubularSegments: number) {
  const positions = [];
  const colors = [];
  const indices = [];

  for (let j = 0; j <= radialSegments; j++) {
    const theta = (j / radialSegments) * Math.PI * 2;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let i = 0; i <= tubularSegments; i++) {
      const phi = (i / tubularSegments) * Math.PI * 2;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      // 頂点の位置
      const x = (radius + tubeRadius * cosPhi) * cosTheta;
      const y = (radius + tubeRadius * cosPhi) * sinTheta;
      const z = tubeRadius * sinPhi;
      positions.push(x, y, z);

      // 頂点の色（ランダムな色）
      const a = Math.random();
      colors.push(Math.random(), a, a, 1.0);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = j * (tubularSegments + 1) + i;
      const b = j * (tubularSegments + 1) + i + 1;
      const c = (j + 1) * (tubularSegments + 1) + i;
      const d = (j + 1) * (tubularSegments + 1) + i + 1;

      // インデックス
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  return { positions, colors, indices };
}
