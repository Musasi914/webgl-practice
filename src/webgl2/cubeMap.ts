import { Axis, Camera, Clock, Controls, Floor, Light, LightsManager, Program, Scene, Texture, Transforms, utils } from "../WebGLUtil";
import vertexShaderSource from "/shader/webgl2/cubeMap/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/cubeMap/fragmentShader.glsl?raw";
import GUI from "lil-gui";
import { mat4 } from "gl-matrix";
import gsap from "gsap";

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;
let program: Program;

let clock: Clock;
let scene: Scene;
let camera: Camera;
let transforms: Transforms;

let useVertexColor = false;

let texture: Texture;
let cubeTexture: WebGLTexture;

function configure() {
  canvas = utils.getCanvas("myGLCanvas");
  utils.autoResizeCanvas(canvas);

  gl = utils.getGL2Context(canvas);
  gl.clearColor(0.9, 0.9, 0.9, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  clock = new Clock();

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);

  const attributes = ["aVertexPosition", "aVertexNormal", "aVertexColor", "aVertexTextureCoords"];
  const uniforms = [
    "uModelViewMatrix",
    "uProjectionMatrix",
    "uNormalMatrix",

    "uMaterialDiffuse",
    "uMaterialAmbient",

    "uLightAmbient",
    "uLightDiffuse",
    "uLightPosition",

    "uAlpha",
    "uUseLambert",
    "uUseVertexColor",

    "uSampler",
    "uCubeSampler",
  ];

  program.load(attributes, uniforms);

  scene = new Scene(gl, program);

  camera = new Camera(Camera.ORBITING_TYPE);
  camera.goHome([0, 0, 4]);
  camera.setAzimuth(45);
  camera.setElevation(-30);

  transforms = new Transforms(gl, program, camera, canvas);

  gl.uniform4fv(program.location.uniforms.uLightAmbient, [1, 1, 1, 1]);
  gl.uniform4fv(program.location.uniforms.uLightDiffuse, [1, 1, 1, 1]);
  gl.uniform3fv(program.location.uniforms.uLightPosition, [0, 5, 20]);

  gl.uniform1f(program.location.uniforms.uAlpha, 1.0);
  gl.uniform1i(program.location.uniforms.uUseLambert, Number(true));
  gl.uniform1i(program.location.uniforms.uUseVertexColor, Number(useVertexColor));

  new Controls(camera, canvas);

  texture = new Texture(gl, "webgl2/webgl.png");

  cubeTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  loadCubemapFace(gl, cubeTexture, gl.TEXTURE_CUBE_MAP_POSITIVE_X, "webgl2/cubemap/positive-x.png");
  loadCubemapFace(gl, cubeTexture, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, "webgl2/cubemap/positive-y.png");
  loadCubemapFace(gl, cubeTexture, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, "webgl2/cubemap/positive-z.png");
  loadCubemapFace(gl, cubeTexture, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, "webgl2/cubemap/negative-x.png");
  loadCubemapFace(gl, cubeTexture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, "webgl2/cubemap/negative-y.png");
  loadCubemapFace(gl, cubeTexture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, "webgl2/cubemap/negative-z.png");
}

function loadCubemapFace(gl: WebGL2RenderingContext, texture: WebGLTexture, target: GLenum, url: string) {
  const image = new Image();
  image.src = url;
  image.addEventListener("load", () => {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  });
}

async function load() {
  // scene.add(new Floor(80, 2));
  // scene.add(new Axis(82));

  await scene.load("/models/geometries/cube-texture.json");
}

function animate() {
  draw();
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  try {
    scene.traverse((object) => {
      transforms.calculateModelView();
      transforms.push();

      transforms.setMatrixUniforms();
      transforms.pop();

      gl.uniform4fv(program.location.uniforms.uMaterialDiffuse, object.diffuse);
      gl.uniform4fv(program.location.uniforms.uMaterialAmbient, object.ambient);
      gl.uniform1i(program.location.uniforms.uWireframe, object.wireframe ? Number(object.wireframe) : Number(false));
      gl.uniform1i(program.location.uniforms.uUseVertexColor, Number(useVertexColor));

      if (object.textureCoords) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
        gl.uniform1i(program.location.uniforms.uSampler, 0);
      }

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
      gl.uniform1i(program.location.uniforms.uCubeSampler, 1);

      gl.bindVertexArray(object.vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

      if (object.wireframe) {
        gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
      }

      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    });
  } catch (error) {
    console.error(error);
  }
}

function init() {
  configure();
  load();
  clock.on("tick", animate);

  initControls();
}
init();

function initControls() {
  const gui = new GUI();
  const obj = {
    useLambert: true,
    useVertexColor: useVertexColor,
    alpha: 1.0,
  };

  gui.add(obj, "useLambert").onChange((v: boolean) => {
    gl.uniform1i(program.location.uniforms.uUseLambert, Number(v));
  });
  gui.add(obj, "useVertexColor").onChange((v: boolean) => {
    useVertexColor = v;
  });
  gui.add(obj, "alpha", 0, 1, 0.1).onChange((v: number) => {
    gl.uniform1f(program.location.uniforms.uAlpha, v);
  });
}
