import vertexShaderSource from "/shader/webgl2/test/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/test/fragmentShader.glsl?raw";
import { Clock, Program, utils } from "../WebGLUtil";

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let clock: Clock;
let program: Program;

let vao: WebGLVertexArrayObject;

function init() {
  configure();
  load();
  clock.on("tick", draw);

  // initControls();
}

function configure() {
  // configure canvas
  canvas = utils.getCanvas("myGLCanvas");
  utils.autoResizeCanvas(canvas);

  // configure gl
  gl = utils.getGL2Context(canvas);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);
  const attributes = ["aVertexPosition"];
  const uniforms = [
    "uResolution",
    // "uTime"
  ];
  program.load(attributes, uniforms);

  clock = new Clock();

  gl.uniform2f(program.location.uniforms.uResolution, canvas.width, canvas.height);
}

function load() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertex = [
    -1.0,
    -1.0, // 左下
    1.0,
    -1.0, // 右下
    -1.0,
    1.0, // 左上
    -1.0,
    1.0, // 左上
    1.0,
    -1.0, // 右下
    1.0,
    1.0, // 右上
  ];
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(program.location.attributes.aVertexPosition);
  gl.vertexAttribPointer(program.location.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  try {
    gl.uniform1f(program.location.uniforms.uTime, performance.now());

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  } catch (error) {
    console.error(error);
  }
}

// function initControls() {
//   const gui = new GUI();
//   const obj = {
//     model: selectedCar,
//     modelColor: [1, 1, 1],
//   };
//   gui
//     .add(obj, "model", ["BMW i8", "Audi R8", "Ford Mustang", "Lamborghini Gallardo"])
//     .onChange((v: "BMW i8" | "Audi R8" | "Ford Mustang" | "Lamborghini Gallardo") => {
//       loadCar(v);
//     });

//   gui.addColor(obj, "modelColor").onChange((v: [number, number, number]) => {
//     const paintAlias = carModelData[selectedCar].paintAlias;
//     scene.traverse((item) => {
//       if (!item.alias) return;

//       if (item.alias.includes(paintAlias)) {
//         item.Kd = v;
//       }
//     });
//   });
// }

init();
