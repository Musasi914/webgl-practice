import vertexShaderSource from "/shader/webgl2/particle/vertexShader.glsl?raw";
import fragmentShaderSource from "/shader/webgl2/particle/fragmentShader.glsl?raw";
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

let particleArray: Float32Array;
let particles: { position: [number, number, number]; velocity: [number, number, number]; lifespan: number; remaingLife: number }[] = [];

let particleLifespan = 3;
let particleSize = 14;
let particleBuffer: WebGLBuffer;

let lastFrameTime: number;

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
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  program = new Program(gl, vertexShaderSource, fragmentShaderSource);
  const attributes = ["aParticle"];
  const uniforms = ["uModelViewMatrix", "uProjectionMatrix", "uPointSize", "uSampler"];
  program.load(attributes, uniforms);

  scene = new Scene(gl, program);

  clock = new Clock();

  camera = new Camera(Camera.ORBITING_TYPE);
  camera.goHome([0, 0, 40]);
  camera.setFocus([0, 0, 0]);
  camera.setAzimuth(-30);
  camera.setElevation(-30);

  controls = new Controls(camera, canvas);

  transforms = new Transforms(gl, program, camera, canvas);

  texture = new Texture(gl);
  texture.setImage("webgl2/spark.png");

  configureParticles(1024);
}

function configureParticles(count: number) {
  particleArray = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const particle = {
      position: [0, 0, 0] as [number, number, number],
      velocity: [0, 0, 0] as [number, number, number],
      lifespan: 0,
      remaingLife: 0,
    };
    resetParticle(particle);
    particles.push(particle);

    particleArray[i * 4] = particle.position[0];
    particleArray[i * 4 + 1] = particle.position[1];
    particleArray[i * 4 + 2] = particle.position[2];
    particleArray[i * 4 + 3] = particle.remaingLife / particle.lifespan;
  }

  particleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, particleArray, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function resetParticle(particle: {
  position: [number, number, number];
  velocity: [number, number, number];
  lifespan: number;
  remaingLife: number;
}) {
  particle.position = [0, 0, 0];
  particle.velocity = [(Math.random() - 0.5) * 20, Math.random() * 20, (Math.random() - 0.5) * 20];
  // ↓のランダムを消すと花火みたいになるよ
  particle.lifespan = Math.random() * particleLifespan;
  particle.remaingLife = particle.lifespan;
}

function updateParticle(elapsed: number) {
  particles.forEach((particle, i) => {
    particle.remaingLife -= elapsed;

    if (particle.remaingLife <= 0) {
      resetParticle(particle);
    }

    particle.position[0] += particle.velocity[0] * elapsed;
    particle.position[1] += particle.velocity[1] * elapsed;
    particle.position[2] += particle.velocity[2] * elapsed;
    particle.velocity[1] -= 9.8 * elapsed;
    if (particle.position[1] < 0) {
      particle.velocity[1] *= -0.75;
      particle.position[1] = 0;
    }

    particleArray[i * 4] = particle.position[0];
    particleArray[i * 4 + 1] = particle.position[1];
    particleArray[i * 4 + 2] = particle.position[2];
    particleArray[i * 4 + 3] = particle.remaingLife / particle.lifespan;
  });

  gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, particleArray, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function load() {
  // scene.add(new Floor(80, 20));
  lastFrameTime = Date.now();
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  transforms.updatePerspective();

  const now = Date.now();
  updateParticle((now - lastFrameTime) / 1000);
  lastFrameTime = now;

  try {
    transforms.calculateModelView();
    transforms.push();

    transforms.setMatrixUniforms();
    transforms.pop();

    gl.uniform1f(program.location.uniforms.uPointSize, particleSize);

    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    const aParticleLoc = program.location.attributes?.aParticle;
    if (typeof aParticleLoc === "number") {
      gl.enableVertexAttribArray(aParticleLoc);
      gl.vertexAttribPointer(aParticleLoc, 4, gl.FLOAT, false, 0, 0);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.glTexture);
    gl.uniform1i(program.location.uniforms.uSampler, 0);

    gl.drawArrays(gl.POINTS, 0, particles.length);

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
