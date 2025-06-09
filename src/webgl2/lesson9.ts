import vertexShaderSource from "/shader/webgl2/lesson9/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/lesson9/fragmentShader.glsl?raw";
import { Camera, Clock, Controls, Floor, Light, LightsManager, Program, Scene, Transforms, utils } from "../WebGLUtil";
import GUI from "lil-gui";

function init() {
  configure();
  load();
  clock.on("tick", draw);

  initControls();
}

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let program: Program;
let scene: Scene;
let clock: Clock;
let camera: Camera;
let controls: Controls;
let transforms: Transforms;
let lights: LightsManager;
let selectedCar: "BMW i8" | "Audi R8" | "Ford Mustang" | "Lamborghini Gallardo";

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

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);
  const attributes = ["aVertexPosition", "aVertexNormal"];
  const uniforms = [
    "uModelViewMatrix",
    "uProjectionMatrix",
    "uNormalMatrix",

    "uLightPosition",

    "uLd",
    "uLs",
    "uLightPosition",

    "uKd",
    "uKs",

    "uNs",
    "uD",
    "uIllum",
    "uWireframe",
  ];
  program.load(attributes, uniforms);

  scene = new Scene(gl, program);

  clock = new Clock();

  camera = new Camera(Camera.ORBITING_TYPE);
  camera.goHome([0, 0.5, 5]);
  camera.setFocus([0, 0, 0]);
  camera.setAzimuth(25);
  camera.setElevation(-10);

  controls = new Controls(camera, canvas);

  transforms = new Transforms(gl, program, camera, canvas);

  lights = new LightsManager();

  const lightPositions: {
    farLeft: [number, number, number];
    farRight: [number, number, number];
    nearLeft: [number, number, number];
    nearRight: [number, number, number];
  } = {
    farLeft: [-1000, 1000, -1000],
    farRight: [1000, 1000, -1000],
    nearLeft: [-1000, 1000, 1000],
    nearRight: [1000, 1000, 1000],
  };

  (Object.keys(lightPositions) as ["farLeft", "farRight", "nearLeft", "nearRight"]).forEach((key) => {
    const light = new Light(key);
    light.setPosition(lightPositions[key]);
    light.setDiffuse([0.4, 0.4, 0.4]);
    light.setSpecular([0.8, 0.8, 0.8]);
    lights.add(light);
  });

  gl.uniform3fv(program.location.uniforms.uLightPosition, lights.getArray("position"));
  gl.uniform3fv(program.location.uniforms.uLd, lights.getArray("diffuse"));
  gl.uniform3fv(program.location.uniforms.uLs, lights.getArray("specular"));

  gl.uniform3fv(program.location.uniforms.uKd, [1, 1, 1]);
  gl.uniform3fv(program.location.uniforms.uKs, [1, 1, 1]);

  gl.uniform1f(program.location.uniforms.uNs, 1.0);
}

const carModelData = {
  "BMW i8": {
    // This is the alias that's used to determine whether the item being
    // loaded is a body panel with paint. Each object within the model has particular
    // aliases that were set by the 3D artists.
    paintAlias: "BMW",
    // This is the number of parts to load for this particular model
    partsCount: 25,
    // The path to the model
    path: "/models/bmw-i8/part",
  },
  "Audi R8": {
    paintAlias: "Lack",
    partsCount: 150,
    path: "/models/audi-r8/part",
  },
  "Ford Mustang": {
    paintAlias: "pintura_carro",
    partsCount: 103,
    path: "/models/ford-mustang/part",
  },
  "Lamborghini Gallardo": {
    paintAlias: "Yellow",
    partsCount: 66,
    path: "/models/lamborghini-gallardo/part",
  },
};

function load() {
  loadCar("BMW i8");
  console.log(scene);
}

function loadCar(model: "BMW i8" | "Audi R8" | "Ford Mustang" | "Lamborghini Gallardo") {
  // reset
  scene.objects = [];

  scene.add(new Floor(200, 2));

  const { path, partsCount } = carModelData[model];
  scene.loadByParts(path, partsCount);
  selectedCar = model;
}

function draw() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  transforms.updatePerspective();

  try {
    scene.traverse((object) => {
      if (!object.visible) return;

      transforms.calculateModelView();
      transforms.push();
      transforms.setMatrixUniforms();
      transforms.pop();

      gl.uniform3fv(program.location.uniforms.uKd, object.Kd);
      gl.uniform3fv(program.location.uniforms.uKs, object.Ks);
      gl.uniform1f(program.location.uniforms.uNs, object.Ns);
      gl.uniform1f(program.location.uniforms.uD, object.d);
      gl.uniform1i(program.location.uniforms.uIllum, object.illum);

      gl.bindVertexArray(object.vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

      if (object.wireframe) {
        gl.uniform1i(program.location.uniforms.uWireframe, 1);
        gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.uniform1i(program.location.uniforms.uWireframe, 0);
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

function initControls() {
  const gui = new GUI();
  const obj = {
    model: selectedCar,
    modelColor: [1, 1, 1],
  };
  gui
    .add(obj, "model", ["BMW i8", "Audi R8", "Ford Mustang", "Lamborghini Gallardo"])
    .onChange((v: "BMW i8" | "Audi R8" | "Ford Mustang" | "Lamborghini Gallardo") => {
      loadCar(v);
    });

  gui.addColor(obj, "modelColor").onChange((v: [number, number, number]) => {
    const paintAlias = carModelData[selectedCar].paintAlias;
    scene.traverse((item) => {
      if (!item.alias) return;

      if (item.alias.includes(paintAlias)) {
        item.Kd = v;
      }
    });
    // Object.kd = v
  });
}

init();
