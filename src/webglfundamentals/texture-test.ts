import fragmentShaderSource from "/shader/webglfundamentals/texture-test/fragmentShader.glsl?raw";
import vertexShaderSource from "/shader/webglfundamentals/texture-test/vertexShader.glsl?raw";
import { WebGLBasicUtility } from "../WebGLUtil";

function main() {
  const image = new Image();
  image.src = "professional_webgl/wicker_256.jpg";
  image.addEventListener("load", () => {
    render(image);
  });
}
function render(image: HTMLImageElement) {
  const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;

  const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
  const gl = util.gl;
  const shaderProgram = util.shaderProgram;

  const PositionAttribLocation = gl.getAttribLocation(shaderProgram, "a_position");
  const texcoordAttribLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");

  const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
  const textureSizeLocation = gl.getUniformLocation(shaderProgram, "u_textureSize");
  const kernelLocation = gl.getUniformLocation(shaderProgram, "u_kernel");
  const kernelWeightLocation = gl.getUniformLocation(shaderProgram, "u_kernelWeight");

  // buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const width = image.width;
  const height = image.height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, width, 0, 0, height, 0, height, width, 0, width, height]), gl.STATIC_DRAW);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW);

  // const texture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // draw
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.enableVertexAttribArray(PositionAttribLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(PositionAttribLocation, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(texcoordAttribLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texcoordAttribLocation, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
  gl.uniform2f(textureSizeLocation, image.width, image.height);

  const edgeDetectKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  gl.uniform1fv(kernelLocation, edgeDetectKernel);
  gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

main();

function computeKernelWeight(kernel: number[]) {
  const weight = kernel.reduce((prev, curr) => prev + curr);
  return weight <= 0 ? 1 : weight;
}

// function createAndSetupTexture(gl: WebGLRenderingContext) {
//   const texture = gl.createTexture();
//   gl.bindTexture(gl.TEXTURE_2D, texture);

//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

//   return texture;
// }
