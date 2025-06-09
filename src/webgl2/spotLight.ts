import { Axis, Camera, Clock, Controls, Floor, Light, LightsManager, Program, Scene, Transforms, utils } from "../WebGLUtil";
import vertexShaderSource from "/shader/webgl2/spotLight/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/spotLight/fragmentShader.glsl?raw";
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
let lights: LightsManager;

let lightCutOff = 0.75;
let lightsData = [
  {
    id: "redLight",
    name: "Red Light",
    position: [0, 7, 3],
    diffuse: [1, 0, 0, 1],
    direction: [0, -2, -0.1],
  },
  {
    id: "greenLight",
    name: "Green Light",
    position: [2.5, 3, 3],
    diffuse: [0, 1, 0, 1],
    direction: [-0.5, 1, -0.1],
  },
  {
    id: "blueLight",
    name: "Blue Light",
    position: [-2.5, 3, 3],
    diffuse: [0, 0, 1, 1],
    direction: [0.5, 1, -0.1],
  },
];

function configure() {
  canvas = utils.getCanvas("myGLCanvas");
  utils.autoResizeCanvas(canvas);

  gl = utils.getGL2Context(canvas);
  gl.clearColor(0.9, 0.9, 0.9, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.depthFunc(gl.LEQUAL);

  clock = new Clock();

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);

  const attributes = ["aVertexPosition", "aVertexNormal"];
  const uniforms = [
    "uModelViewMatrix",
    "uProjectionMatrix",
    "uNormalMatrix",
    "uMaterialDiffuse",
    // "uMaterialAmbient",

    // "uLightAmbient",
    "uLightDiffuse",
    "uLightDirection",
    "uLightPosition",
    "uLightSource",

    "uWireframe",
    "uCutOff",
  ];

  program.load(attributes, uniforms);

  scene = new Scene(gl, program);

  camera = new Camera(Camera.ORBITING_TYPE);
  camera.goHome([0, 5, 30]);
  camera.setAzimuth(0);
  camera.setElevation(0);

  transforms = new Transforms(gl, program, camera, canvas);

  lights = new LightsManager();

  lightsData.forEach(({ id, position, diffuse, direction }) => {
    const light = new Light(id);
    light.setPosition(position as [number, number, number]);
    light.setDiffuse(diffuse as [number, number, number, number]);
    light.setDirection(direction as [number, number, number]);

    lights.add(light);
  });

  gl.uniform3fv(program.location.uniforms.uLightPosition, lights.getArray("position"));
  gl.uniform3fv(program.location.uniforms.uLightDirection, lights.getArray("direction"));
  gl.uniform4fv(program.location.uniforms.uLightDiffuse, lights.getArray("diffuse"));

  gl.uniform1f(program.location.uniforms.uCutOff, lightCutOff);
  gl.uniform4fv(program.location.uniforms.uLightAmbient, [1, 1, 1, 1]);

  new Controls(camera, canvas);
}

async function load() {
  scene.add(new Floor(80, 2));
  // scene.add(new Axis(82));

  await scene.load("/models/geometries/wall.json", "wall");
  await Promise.all(
    lightsData.map(({ id }) => {
      scene.load("/models/geometries/sphere3.json", id);
    })
  );
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

      gl.uniform1i(program.location.uniforms.uLightSource, Number(false));

      const light = lightsData.find(({ id }) => object.alias === id);
      if (light) {
        const lightObj = lights.get(light.id);
        if (!lightObj) return;
        const { position, diffuse } = lightObj;
        mat4.translate(transforms.modelViewMatrix, transforms.modelViewMatrix, position);
        object.diffuse = diffuse;
        gl.uniform1i(program.location.uniforms.uLightSource, Number(true));
      }

      transforms.setMatrixUniforms();
      transforms.pop();

      gl.uniform3fv(program.location.uniforms.uLightPosition, lights.getArray("position"));
      gl.uniform4fv(program.location.uniforms.uMaterialDiffuse, object.diffuse);
      gl.uniform4fv(program.location.uniforms.uMaterialAmbient, object.ambient);
      gl.uniform1i(program.location.uniforms.uWireframe, object.wireframe ? Number(object.wireframe) : Number(false));

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

  // initControls();
}
init();

// function initControls() {
//   const gui = new GUI();
//   const obj = {
//     redLightPositionX: redLightPosition[0],
//     redLightPositionY: redLightPosition[1],
//     redLightPositionZ: redLightPosition[2],
//   };
//   gui.add(obj, "redLightPositionX", -100, 100, 1).onChange((v: number) => {
//     redLightPosition[0] = v;
//     gl.uniform3fv(program.location.uniforms.uPositionRedLight, redLightPosition);
//   });
//   gui.add(obj, "redLightPositionY", -100, 100, 1).onChange((v: number) => {
//     redLightPosition[1] = v;
//     gl.uniform3fv(program.location.uniforms.uPositionRedLight, redLightPosition);
//   });
//   gui.add(obj, "redLightPositionZ", -100, 100, 1).onChange((v: number) => {
//     redLightPosition[2] = v;
//     gl.uniform3fv(program.location.uniforms.uPositionRedLight, redLightPosition);
//   });
// }
