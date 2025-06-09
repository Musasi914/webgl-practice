import vertexShaderSource from "/shader/webgl2/pointProcess/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/pointProcess/fragmentShader.glsl?raw";
import grayVertexShaderSource from "/shader/webgl2/grayscale/vertexShader.glsl?raw";
import grayFragmentShaderSource from "/shader/webgl2/grayscale/fragmentShader.glsl?raw";
import invertFragmentShaderSource from "/shader/webgl2/invert/fragmentShader.glsl?raw";
import wavyFragmentShaderSource from "/shader/webgl2/wavy/fragmentShader.glsl?raw";
import {
  Camera,
  Clock,
  Controls,
  Floor,
  Light,
  LightsManager,
  PostProcess,
  Program,
  Scene,
  Texture,
  Transforms,
  utils,
} from "../WebGLUtil";
import GUI from "lil-gui";
import { mat4 } from "gl-matrix";

function init() {
  configure();
  load();
  clock.on("tick", render);

  // initControls();
}

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let program: Program;
let scene: Scene;
let clock: Clock;
let camera: Camera;
let controls: Controls;
let transforms: Transforms;
let texture: Texture;
let postProcess: PostProcess;

function configure() {
  // configure canvas
  canvas = utils.getCanvas("myGLCanvas");
  utils.autoResizeCanvas(canvas);

  // configure gl
  gl = utils.getGL2Context(canvas);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);
  const attributes = ["aVertexPosition", "aVertexNormal", "aVertexTextureCoords"];
  const uniforms = [
    "uModelViewMatrix",
    "uProjectionMatrix",
    "uNormalMatrix",

    "uLightPosition",
    "uLightAmbient",
    "uLightDiffuse",

    "uMaterialAmbient",
    "uMaterialDiffuse",

    "uOffscreen",
    "uSampler",
  ];
  program.load(attributes, uniforms);

  scene = new Scene(gl, program);

  clock = new Clock();

  camera = new Camera(Camera.ORBITING_TYPE);
  camera.goHome([0, 0, 25]);
  camera.setFocus([0, 0, 0]);
  camera.setAzimuth(-30);
  camera.setElevation(-30);

  controls = new Controls(camera, canvas);

  transforms = new Transforms(gl, program, camera, canvas);

  gl.uniform3fv(program.location.uniforms.uLightPosition, [0, 5, 20]);
  gl.uniform4fv(program.location.uniforms.uLightAmbient, [1, 1, 1, 1]);
  gl.uniform4fv(program.location.uniforms.uLightDiffuse, [1, 1, 1, 1]);

  texture = new Texture(gl);
  texture.setImage("webgl2/webgl-marble.png");

  postProcess = new PostProcess(gl, canvas, grayVertexShaderSource, wavyFragmentShaderSource);
}

function load() {
  scene.load("/models/geometries/cube-texture.json", "cube", { scale: [6, 6, 6] });
}

function render() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, postProcess.framebuffer);
  draw();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  postProcess.bind();

  postProcess.draw();
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  transforms.updatePerspective();

  try {
    gl.useProgram(program.program);

    let offscreen: WebGLUniformLocation;
    if (typeof program.location.uniforms.uOffscreen === "number") {
      offscreen = program.getUniform(program.location.uniforms.uOffscreen);
    }

    scene.traverse((object) => {
      transforms.calculateModelView();
      transforms.push();

      if (object.alias === "cube") {
        mat4.scale(transforms.modelViewMatrix, transforms.modelViewMatrix, object.scale ? object.scale : [1, 1, 1]);
      }

      transforms.setMatrixUniforms();
      transforms.pop();

      if (object.diffuse[3] < 1 && !offscreen) {
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
      } else {
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
      }

      gl.uniform4fv(program.location.uniforms.uMaterialDiffuse, object.diffuse);
      // gl.uniform3fv(program.location.uniforms.uKs, object.Ks);
      // gl.uniform1f(program.location.uniforms.uOffscreen, object.uOffscreen);
      // gl.uniform1f(program.location.uniforms.uD, object.d);
      // gl.uniform1i(program.location.uniforms.uIllum, object.illum);

      gl.bindVertexArray(object.vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

      if (object.textureCoords) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
        gl.uniform1i(program.location.uniforms.uSampler, 0);
      }

      gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);

      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    });
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
