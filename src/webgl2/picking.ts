import {
  Axis,
  Camera,
  Clock,
  Controls,
  Floor,
  Light,
  LightsManager,
  Picker,
  Program,
  Scene,
  Texture,
  Transforms,
  utils,
  type TraversedObject,
} from "../WebGLUtil";
import vertexShaderSource from "/shader/webgl2/picking/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/picking/fragmentShader.glsl?raw";
import GUI from "lil-gui";
import { mat4, vec3 } from "gl-matrix";
import gsap from "gsap";

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;
let program: Program;

let clock: Clock;
let scene: Scene;
let camera: Camera;
let transforms: Transforms;
let picker: Picker;
let controls: Controls;

let useVertexColor = false;

let showPickingImage = false;

function configure() {
  canvas = utils.getCanvas("myGLCanvas");
  utils.autoResizeCanvas(canvas);

  gl = utils.getGL2Context(canvas);
  gl.clearColor(0.9, 0.9, 0.9, 1);
  // gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  // gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  clock = new Clock();

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);

  const attributes = ["aVertexPosition", "aVertexNormal"];
  const uniforms = [
    "uModelViewMatrix",
    "uProjectionMatrix",
    "uNormalMatrix",

    "uMaterialDiffuse",
    "uMaterialAmbient",

    "uLightAmbient",
    "uLightDiffuse",
    "uLightPosition",

    "uWireframe",
    "uOffscreen",
    "uPickingColor",
  ];

  program.load(attributes, uniforms);

  scene = new Scene(gl, program);

  picker = new Picker(gl, canvas, scene, {
    hitPropertyCallback: hitProperty,
    addHitCallback: addHit,
    removeHitCallback: removeHit,
    processHitsCallback: processHits,
    moveCallback: movePickedObjects,
  });

  camera = new Camera(Camera.ORBITING_TYPE);
  camera.goHome([0, 0, 192]);
  camera.setAzimuth(37);
  camera.setElevation(-22);

  transforms = new Transforms(gl, program, camera, canvas);

  gl.uniform4fv(program.location.uniforms.uLightAmbient, [0, 0, 0, 1]);
  gl.uniform4fv(program.location.uniforms.uLightDiffuse, [1, 1, 1, 1]);
  gl.uniform3fv(program.location.uniforms.uLightPosition, [0, 5, 20]);

  controls = new Controls(camera, canvas);
  controls.setPicker(picker);
}

function positionGenerator() {
  let x = Math.floor((Math.random() - 0.5) * 120);
  let z = Math.floor((Math.random() - 0.5) * 120);

  return [x, 0, z];
}

// [r,g,b,1]: true とか
const colorset: { [key: string]: boolean } = {};
function objectLabelGenerator() {
  const color = [Math.random(), Math.random(), Math.random(), 1];
  const key = color.toString();

  if (key in colorset) {
    return objectLabelGenerator();
  } else {
    colorset[key] = true;
    return color;
  }
}

function diffuseColorGenerator(index: number) {
  // 0.2 ~ 0.7 グレースケール
  const color = (index % 30) / 60 + 0.2;
  return [color, color, color, 1];
}

function scaleGenerator() {
  const scale = Math.random() + 0.3;
  return [scale, scale, scale];
}

function hitProperty(obj: TraversedObject) {
  return obj.pickingColor;
}
function addHit(obj: TraversedObject) {
  obj.previous = [...obj.diffuse];
  if (obj.pickingColor) obj.diffuse = obj.pickingColor;
}
function removeHit(obj: TraversedObject) {
  if (obj.previous) obj.diffuse = [...obj.previous];
}
function processHits(hits: TraversedObject[]) {
  hits.forEach((hit) => {
    if (hit.previous) {
      return (hit.diffuse = hit.previous);
    }
  });
}
function movePickedObjects(dx: number, dy: number) {
  const hits = picker.getHits();

  if (!hits) return;

  const factor = Math.max(Math.max(camera.position[0], camera.position[1]), camera.position[2]) / 2000;

  hits.forEach((hit) => {
    const scaleX = vec3.create();
    const scaleY = vec3.create();

    vec3.scale(scaleY, camera.up, -dy * factor);
    vec3.scale(scaleX, camera.right, dx * factor);

    if (!hit.position) return;
    vec3.add(hit.position, hit.position, scaleY);
    vec3.add(hit.position, hit.position, scaleX);
  });
}

async function load() {
  scene.add(new Floor(80, 20));
  // scene.add(new Axis(82));

  for (let i = 0; i < 100; i++) {
    const objectType = Math.floor(Math.random() * 2);

    const options = {
      position: positionGenerator(),
      scale: scaleGenerator(),
      diffuse: diffuseColorGenerator(i),
      pickingColor: objectLabelGenerator(),
    };

    switch (objectType) {
      case 1:
        scene.load("/models/geometries/sphere1.json", `ball_${i}`, options);
        break;
      case 0:
        scene.load("/models/geometries/cylinder.json", `cylinder_${i}`, options);
        break;
    }
  }
}

function render() {
  // Off-screen rendering
  gl.bindFramebuffer(gl.FRAMEBUFFER, picker.framebuffer);
  gl.uniform1i(program.location.uniforms.uOffscreen, Number(true));
  draw();

  // On-screen rendering
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.uniform1i(program.location.uniforms.uOffscreen, Number(showPickingImage));
  draw();
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  try {
    const offscreen = gl.getUniform(program.program, program.location.uniforms.uOffscreen!);
    const flatShadingMode = showPickingImage || offscreen;

    scene.traverse((object) => {
      if (object.alias === "floor" && flatShadingMode) return;

      transforms.calculateModelView();
      transforms.push();

      if (object.alias !== "floor") {
        if (object.position) mat4.translate(transforms.modelViewMatrix, transforms.modelViewMatrix, object.position);
        if (object.scale) mat4.scale(transforms.modelViewMatrix, transforms.modelViewMatrix, object.scale);
      }

      transforms.setMatrixUniforms();
      transforms.pop();

      gl.uniform4fv(program.location.uniforms.uMaterialDiffuse, object.diffuse);
      gl.uniform4fv(program.location.uniforms.uMaterialAmbient, object.ambient);
      gl.uniform1i(program.location.uniforms.uWireframe, object.wireframe ? Number(object.wireframe) : Number(false));
      gl.uniform4fv(program.location.uniforms.uPickingColor, object.pickingColor || [0, 0, 0, 0]);
      gl.uniform1i(program.location.uniforms.uOffscreen, flatShadingMode);

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
  clock.on("tick", render);

  // initControls();
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
