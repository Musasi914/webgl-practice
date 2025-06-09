import { Axis, Camera, Clock, Controls, Floor, Program, Scene, Transforms, utils } from "../WebGLUtil";
import vertexShaderSource from "/shader/webgl2/animation/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/animation/fragmentShader.glsl?raw";
import GUI from "lil-gui";
import { mat4 } from "gl-matrix";
import gsap from "gsap";

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;
let program: Program;

let homePosition: [number, number, number] = [0, 2, 50];

let clock: Clock;
let scene: Scene;
let camera: Camera;
let transforms: Transforms;

let fixedLight = true;

let dxSphere = 0.3;
let dxCone = 0.45;
let spherePosition = 0;
let conePosition = 0;

function configure() {
  canvas = utils.getCanvas("myGLCanvas");
  utils.autoResizeCanvas(canvas);

  gl = utils.getGL2Context(canvas);
  gl.clearColor(0.9, 0.9, 0.9, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  clock = new Clock();

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);

  const attributes = ["aVertexPosition", "aVertexNormal"];
  const uniforms = [
    "uModelViewMatrix",
    "uProjectionMatrix",
    "uNormalMatrix",
    "uMaterialDiffuse",
    "uMaterialAmbient",
    "uMaterialSpecular",
    "uLightPosition",
    "uLightDiffuse",
    "uLightAmbient",
    "uLightSpecular",
    "uShininess",
    "uUpdateLight",
    "uWireframe",
  ];
  program.load(attributes, uniforms);

  scene = new Scene(gl, program);

  camera = new Camera(Camera.ORBITING_TYPE);
  camera.goHome(homePosition);
  camera.setFocus([0, 0, 0]);

  transforms = new Transforms(gl, program, camera, canvas);

  gl.uniform3fv(program.location.uniforms.uLightPosition, [0, 120, 120]);
  gl.uniform4fv(program.location.uniforms.uLightAmbient, [0.2, 0.2, 0.2, 1]);
  gl.uniform4fv(program.location.uniforms.uLightDiffuse, [1, 1, 1, 1]);
  gl.uniform4fv(program.location.uniforms.uLightSpecular, [1, 1, 1, 1]);
  gl.uniform1f(program.location.uniforms.uShininess, 230);

  new Controls(camera, canvas);
}

function load() {
  scene.add(new Floor(80, 2));
  scene.add(new Axis(82));
  scene.load("/models/geometries/cone3.json", "cone");
  scene.load("/models/geometries/sphere2.json", "sphere");
}

function animate() {
  spherePosition += dxSphere;

  if (spherePosition >= 30 || spherePosition <= -30) {
    dxSphere = -dxSphere;
  }

  conePosition += dxCone;
  if (conePosition >= 35 || conePosition <= -35) {
    dxCone = -dxCone;
  }

  draw();
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  transforms.updatePerspective();

  try {
    gl.uniform1i(program.location.uniforms.uUpdateLight, Number(fixedLight));

    scene.traverse((object) => {
      transforms.calculateModelView();
      transforms.push();

      if (object.alias === "sphere") {
        const sphereTransform = transforms.modelViewMatrix;
        mat4.translate(sphereTransform, sphereTransform, [0, 0, spherePosition]);
      } else if (object.alias === "cone") {
        const coneTransform = transforms.modelViewMatrix;
        mat4.translate(coneTransform, coneTransform, [conePosition, 0, 0]);
      }

      transforms.setMatrixUniforms();
      transforms.pop();

      gl.uniform4fv(program.location.uniforms.uMaterialAmbient, object.ambient);
      gl.uniform4fv(program.location.uniforms.uMaterialDiffuse, object.diffuse);
      gl.uniform4fv(program.location.uniforms.uMaterialSpecular, object.specular);
      gl.uniform1i(program.location.uniforms.uWireframe, object.wireframe ? Number(true) : Number(false));

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
  let position = homePosition;
  const obj = {
    cameraType: Camera.TRACKING_TYPE,
    transformX: position[0],
    transformY: position[1],
    transformZ: position[2],
    elevation: camera.elevation,
    azimuth: camera.azimuth,
    dolly: 0,
  };
  gui.add(obj, "cameraType", [Camera.TRACKING_TYPE, Camera.ORBITING_TYPE]).onChange((v: string) => {
    camera.setType(v);
  });
  gui.add(obj, "transformX", -50, 50, 1).onChange((v: number) => {
    position[0] = v;
    camera.setPosition(position);
  });
  gui.add(obj, "transformY", -50, 50, 1).onChange((v: number) => {
    position[1] = v;
    camera.setPosition(position);
  });
  gui.add(obj, "transformZ", -50, 50, 1).onChange((v: number) => {
    position[2] = v;
    camera.setPosition(position);
  });
  gui.add(obj, "elevation", -180, 180, 1).onChange((v: number) => {
    camera.setElevation(v);
  });
  gui.add(obj, "azimuth", -180, 180, 1).onChange((v: number) => {
    camera.setAzimuth(v);
  });
  gui.add(obj, "dolly", -100, 100, 1).onChange((v: number) => {
    camera.dolly(v);
  });
}
