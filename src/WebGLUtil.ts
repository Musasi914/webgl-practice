import { mat4, vec3, vec4 } from "gl-matrix";
// 以下コピペ
// const canvas = document.querySelector("#myGLCanvas") as HTMLCanvasElement;

// const util = new WebGLBasicUtility(canvas, vertexShaderSource, fragmentShaderSource);
// const gl = util.gl;
// const shaderProgram = util.shaderProgram;

// const PositionLocation = gl.getAttribLocation(shaderProgram, "");

// // buffer

// // draw

type AttributeLocations = {
  [attributeLocation: string]: number;
};
type UniformLocations = {
  [uniformLocation: string]: WebGLUniformLocation | number | null;
};
type Locations = {
  attributes: AttributeLocations;
  uniforms: UniformLocations;
};

export class WebGLBasicUtility {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  shaderProgram: WebGLProgram;

  constructor(canvas: HTMLCanvasElement, vertexShaderSource: string, fragmentShaderSource: string) {
    this.canvas = canvas;
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;

    const gl = this.canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL context could not be initialized");
    this.gl = gl;

    this.setupContextLostHandlers();

    this.vertexShader = this.createShader(vertexShaderSource, gl.VERTEX_SHADER);
    this.fragmentShader = this.createShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    this.shaderProgram = this.createProgram();
  }

  private setupContextLostHandlers() {
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.log("context lost");
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      console.log("context restored");
      // this.draw();
    });
  }
  private createShader(shaderSource: string, type: number) {
    const shader = this.gl.createShader(type) as WebGLShader;
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS) && !this.gl.isContextLost())
      throw new Error(`${this.gl.getShaderInfoLog(shader)}`);
    return shader;
  }
  private createProgram() {
    const shaderProgram = this.gl.createProgram();

    this.gl.attachShader(shaderProgram, this.vertexShader);
    this.gl.attachShader(shaderProgram, this.fragmentShader);

    this.gl.linkProgram(shaderProgram);

    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS) && !this.gl.isContextLost())
      throw new Error(`${this.gl.getProgramInfoLog(shaderProgram)}`);

    this.gl.useProgram(shaderProgram);

    return shaderProgram;
  }
  createTorus(radius: number, tubeRadius: number, radialSegments: number, tubularSegments: number) {
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
  calculateNormals(vs: number[], ind: number[]) {
    const x = 0,
      y = 1,
      z = 2,
      ns = [];

    // For each vertex, initialize normal x, normal y, normal z
    for (let i = 0; i < vs.length; i += 3) {
      ns[i + x] = 0.0;
      ns[i + y] = 0.0;
      ns[i + z] = 0.0;
    }

    // We work on triads of vertices to calculate
    for (let i = 0; i < ind.length; i += 3) {
      // Normals so i = i+3 (i = indices index)
      const v1 = [],
        v2 = [],
        normal = [];

      // p2 - p1
      v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x];
      v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y];
      v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z];

      // p0 - p1
      v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x];
      v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y];
      v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z];

      // Cross product by Sarrus Rule
      normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
      normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
      normal[z] = v1[x] * v2[y] - v1[y] * v2[x];

      // Update the normals of that triangle: sum of vectors
      for (let j = 0; j < 3; j++) {
        ns[3 * ind[i + j] + x] = ns[3 * ind[i + j] + x] + normal[x];
        ns[3 * ind[i + j] + y] = ns[3 * ind[i + j] + y] + normal[y];
        ns[3 * ind[i + j] + z] = ns[3 * ind[i + j] + z] + normal[z];
      }
    }

    // Normalize the result.
    // The increment here is because each vertex occurs.
    for (let i = 0; i < vs.length; i += 3) {
      // With an offset of 3 in the array (due to x, y, z contiguous values)
      const nn = [];
      nn[x] = ns[i + x];
      nn[y] = ns[i + y];
      nn[z] = ns[i + z];

      let len = Math.sqrt(nn[x] * nn[x] + nn[y] * nn[y] + nn[z] * nn[z]);
      if (len === 0) len = 1.0;

      nn[x] = nn[x] / len;
      nn[y] = nn[y] / len;
      nn[z] = nn[z] / len;

      ns[i + x] = nn[x];
      ns[i + y] = nn[y];
      ns[i + z] = nn[z];
    }

    return ns;
  }
}

export class WebGL2BasicUtility {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  shaderProgram: WebGLProgram;

  constructor(canvas: HTMLCanvasElement, vertexShaderSource: string, fragmentShaderSource: string) {
    this.canvas = canvas;
    this.autoResizeCanvas();

    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL context could not be initialized");
    this.gl = gl;

    this.setupContextLostHandlers();

    this.vertexShader = this.createShader(vertexShaderSource, gl.VERTEX_SHADER);
    this.fragmentShader = this.createShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    this.shaderProgram = this.createProgram();

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.gl.clearColor(0.9, 0.9, 0.9, 1.0);
    this.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.gl.enable(gl.CULL_FACE);
    this.gl.enable(gl.DEPTH_TEST);
  }

  private autoResizeCanvas() {
    const expandFullScreen = () => {
      this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
      this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
    };
    expandFullScreen();

    window.addEventListener("resize", expandFullScreen);
  }

  private setupContextLostHandlers() {
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.log("context lost");
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      console.log("context restored");
      // this.draw();
    });
  }
  private createShader(shaderSource: string, type: number) {
    const shader = this.gl.createShader(type) as WebGLShader;
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS) && !this.gl.isContextLost())
      throw new Error(`${this.gl.getShaderInfoLog(shader)}`);
    return shader;
  }
  private createProgram() {
    const shaderProgram = this.gl.createProgram();

    this.gl.attachShader(shaderProgram, this.vertexShader);
    this.gl.attachShader(shaderProgram, this.fragmentShader);

    this.gl.linkProgram(shaderProgram);

    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS) && !this.gl.isContextLost())
      throw new Error(`${this.gl.getProgramInfoLog(shaderProgram)}`);

    this.gl.useProgram(shaderProgram);

    return shaderProgram;
  }

  loadLocations(attributes: string[], uniforms: string[]) {
    const locations: Locations = { attributes: {}, uniforms: {} };
    attributes.forEach((attribute) => {
      const location = this.gl.getAttribLocation(this.shaderProgram, attribute);
      if (location === -1) throw new Error("attributeLocationが-1");
      locations.attributes[attribute] = location;
    });
    uniforms.forEach((uniform) => {
      const location = this.gl.getUniformLocation(this.shaderProgram, uniform);
      if (location === null) throw new Error("uniformLocationが不正な値");
      locations.uniforms[uniform] = location;
    });
    return locations;
  }

  createTorus(radius: number, tubeRadius: number, radialSegments: number, tubularSegments: number) {
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
  calculateNormals(vs: number[], ind: number[]) {
    const x = 0,
      y = 1,
      z = 2,
      ns = [];

    // For each vertex, initialize normal x, normal y, normal z
    for (let i = 0; i < vs.length; i += 3) {
      ns[i + x] = 0.0;
      ns[i + y] = 0.0;
      ns[i + z] = 0.0;
    }

    // We work on triads of vertices to calculate
    for (let i = 0; i < ind.length; i += 3) {
      // Normals so i = i+3 (i = indices index)
      const v1 = [],
        v2 = [],
        normal = [];

      // p2 - p1
      v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x];
      v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y];
      v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z];

      // p0 - p1
      v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x];
      v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y];
      v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z];

      // Cross product by Sarrus Rule
      normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
      normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
      normal[z] = v1[x] * v2[y] - v1[y] * v2[x];

      // Update the normals of that triangle: sum of vectors
      for (let j = 0; j < 3; j++) {
        ns[3 * ind[i + j] + x] = ns[3 * ind[i + j] + x] + normal[x];
        ns[3 * ind[i + j] + y] = ns[3 * ind[i + j] + y] + normal[y];
        ns[3 * ind[i + j] + z] = ns[3 * ind[i + j] + z] + normal[z];
      }
    }

    // Normalize the result.
    // The increment here is because each vertex occurs.
    for (let i = 0; i < vs.length; i += 3) {
      // With an offset of 3 in the array (due to x, y, z contiguous values)
      const nn = [];
      nn[x] = ns[i + x];
      nn[y] = ns[i + y];
      nn[z] = ns[i + z];

      let len = Math.sqrt(nn[x] * nn[x] + nn[y] * nn[y] + nn[z] * nn[z]);
      if (len === 0) len = 1.0;

      nn[x] = nn[x] / len;
      nn[y] = nn[y] / len;
      nn[z] = nn[z] / len;

      ns[i + x] = nn[x];
      ns[i + y] = nn[y];
      ns[i + z] = nn[z];
    }

    return ns;
  }
}

export class WebGLTextureUtility {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  shaderProgram: WebGLProgram;
  vertexPositionAttribLocation: number;
  vertexColorAttribLocation: number;
  private ongoingImageLoads: HTMLImageElement[] | undefined;
  texture: WebGLTexture | undefined;

  constructor(canvas: HTMLCanvasElement, vertexShaderSource: string, fragmentShaderSource: string) {
    this.canvas = canvas;
    const gl = this.canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL context could not be initialized");
    this.gl = gl;

    this.setupContextLostHandlers();

    this.vertexShader = this.createShader(vertexShaderSource, gl.VERTEX_SHADER);
    this.fragmentShader = this.createShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    this.shaderProgram = this.createProgram();

    this.vertexPositionAttribLocation = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    this.vertexColorAttribLocation = this.gl.getAttribLocation(this.shaderProgram, "aVertexColor");
  }

  private setupContextLostHandlers() {
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.log("context lost");

      if (this.ongoingImageLoads && this.ongoingImageLoads.length !== 0) {
        for (let i = 0; i < this.ongoingImageLoads.length; i++) {
          this.ongoingImageLoads[i].onload = null;
        }
        this.ongoingImageLoads = [];
      }
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      console.log("context restored");
      // this.draw();
    });
  }

  /** vertexShader, fragmenShaderをコンパイル, shaderProgramとリンク */
  private createProgram() {
    const shaderProgram = this.gl.createProgram();

    this.gl.attachShader(shaderProgram, this.vertexShader);
    this.gl.attachShader(shaderProgram, this.fragmentShader);

    this.gl.linkProgram(shaderProgram);

    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS) && !this.gl.isContextLost())
      throw new Error(`${this.gl.getProgramInfoLog(shaderProgram)}`);

    this.gl.useProgram(shaderProgram);

    return shaderProgram;
  }

  private createShader(shaderSource: string, type: number) {
    const shader = this.gl.createShader(type) as WebGLShader;
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS) && !this.gl.isContextLost())
      throw new Error(`${this.gl.getShaderInfoLog(shader)}`);
    return shader;
  }

  loadImageForTexture(url: string) {
    const texture = this.gl.createTexture();
    this.ongoingImageLoads = [];

    const image = new Image();
    image.addEventListener("load", () => {
      this.ongoingImageLoads?.splice(this.ongoingImageLoads.indexOf(image), 1);
      this.textureFinishLoading(texture, image);
    });
    this.ongoingImageLoads.push(image);
    image.src = url;
  }

  private textureFinishLoading(texture: WebGLTexture, image: HTMLImageElement) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // 画像を水平方向に反転
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    // テクスチャをGPUにアップロード
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

    // テクスチャのパラメータを指定
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
  }

  getAttribLocation(name: string): number {
    const location = this.gl.getAttribLocation(this.shaderProgram, name);
    if (location === -1) throw new Error(`Attribute ${name} not found`);
    return location;
  }
}

export const utils = {
  getCanvas(id: string) {
    const canvas = document.getElementById(id);
    if (!canvas) {
      throw new Error(`There is no canvas with id ${id} on this page.`);
    }
    return canvas as HTMLCanvasElement;
  },

  getGL2Context(canvas: HTMLCanvasElement) {
    const glContext = canvas.getContext("webgl2");
    if (!glContext) {
      throw new Error("WebGL2 is not available in your browser");
    }
    return glContext;
  },

  autoResizeCanvas(canvas: HTMLCanvasElement) {
    const expandFullScreen = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    };
    expandFullScreen();

    window.addEventListener("resize", expandFullScreen);
  },

  createShader(
    gl: WebGL2RenderingContext,
    shaderSource: string,
    type: WebGL2RenderingContext["VERTEX_SHADER"] | WebGL2RenderingContext["FRAGMENT_SHADER"]
  ) {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) console.error(gl.getShaderInfoLog(shader));
    return shader;
  },

  calculateNormals(vs: number[], ind: number[]) {
    const x = 0,
      y = 1,
      z = 2,
      ns = [];

    // For each vertex, initialize normal x, normal y, normal z
    for (let i = 0; i < vs.length; i += 3) {
      ns[i + x] = 0.0;
      ns[i + y] = 0.0;
      ns[i + z] = 0.0;
    }

    // We work on triads of vertices to calculate
    for (let i = 0; i < ind.length; i += 3) {
      // Normals so i = i+3 (i = indices index)
      const v1 = [],
        v2 = [],
        normal = [];

      // p2 - p1
      v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x];
      v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y];
      v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z];

      // p0 - p1
      v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x];
      v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y];
      v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z];

      // Cross product by Sarrus Rule
      normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
      normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
      normal[z] = v1[x] * v2[y] - v1[y] * v2[x];

      // Update the normals of that triangle: sum of vectors
      for (let j = 0; j < 3; j++) {
        ns[3 * ind[i + j] + x] = ns[3 * ind[i + j] + x] + normal[x];
        ns[3 * ind[i + j] + y] = ns[3 * ind[i + j] + y] + normal[y];
        ns[3 * ind[i + j] + z] = ns[3 * ind[i + j] + z] + normal[z];
      }
    }

    // Normalize the result.
    // The increment here is because each vertex occurs.
    for (let i = 0; i < vs.length; i += 3) {
      // With an offset of 3 in the array (due to x, y, z contiguous values)
      const nn = [];
      nn[x] = ns[i + x];
      nn[y] = ns[i + y];
      nn[z] = ns[i + z];

      let len = Math.sqrt(nn[x] * nn[x] + nn[y] * nn[y] + nn[z] * nn[z]);
      if (len === 0) len = 1.0;

      nn[x] = nn[x] / len;
      nn[y] = nn[y] / len;
      nn[z] = nn[z] / len;

      ns[i + x] = nn[x];
      ns[i + y] = nn[y];
      ns[i + z] = nn[z];
    }

    return ns;
  },
};

export class Program {
  private gl: WebGL2RenderingContext;
  program: WebGLProgram;
  location: Locations = { attributes: {}, uniforms: {} };

  constructor(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
    this.gl = gl;
    this.program = gl.createProgram();

    const vertexShader = utils.createShader(this.gl, vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = utils.createShader(this.gl, fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error("Could not initialize shaders");
    }
    this.useProgram();
  }

  private useProgram() {
    this.gl.useProgram(this.program);
  }

  load(attributes: string[], uniforms: string[]) {
    this.useProgram();
    this.setAttributeLocations(attributes);
    this.setUniformLocations(uniforms);
  }
  private setAttributeLocations(attributes: string[]) {
    attributes.forEach((attribute) => {
      const location = this.gl.getAttribLocation(this.program, attribute);
      if (location === -1) throw new Error(`attributeLocationの${attribute}が-1`);
      this.location.attributes[`${attribute}`] = location;
    });
  }
  private setUniformLocations(uniforms: string[]) {
    uniforms.forEach((uniform) => {
      const location = this.gl.getUniformLocation(this.program, uniform);
      if (location === null) {
        throw new Error(`uniformLocationの${uniform}が不正な値`);
      }
      this.location.uniforms[`${uniform}`] = location;
    });
  }

  getUniform(uniformLocation: number) {
    return this.gl.getUniform(this.program, uniformLocation);
  }
}

export class EventEmitter {
  events: { [key: string]: Array<() => void> };

  constructor() {
    this.events = {};
  }

  /** 登録 */
  on(event: string, callback: () => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  remove(event: string, listener: () => void): void {
    if (this.events[event]) {
      const index = this.events[event].indexOf(listener);
      if (~index) {
        this.events[event].splice(index, 1);
      }
    }
  }

  emit(event: string): void {
    const events = this.events[event];
    if (events) {
      events.forEach((callback) => callback());
    }
  }
}

/** instance.on("tick", callback)とすること */
export class Clock extends EventEmitter {
  isRunning: boolean;
  elapsedTime: number | null;

  constructor() {
    super();
    this.isRunning = true;
    this.elapsedTime = null;

    this.tick = this.tick.bind(this);
    this.tick();

    window.addEventListener("blur", () => {
      this.stop();
      console.info("Clock stopped");
    });
    window.addEventListener("focus", () => {
      this.start();
      console.info("Clock resumed");
    });
  }

  tick(elapsedTime?: number) {
    if (this.isRunning) {
      this.emit("tick");
      this.elapsedTime = elapsedTime ? elapsedTime : null;
    }
    requestAnimationFrame(this.tick);
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }
}

type Object = {
  vertices: number[];
  indices: number[];
  scalars?: number[];
  alias?: string;
  diffuse?: [number, number, number, number];
  Kd?: [number, number, number];
  ambient?: [number, number, number, number];
  Ka?: [number, number, number];
  specular?: [number, number, number, number];
  Ks?: [number, number, number];
  specularExponent?: number;
  Ns?: number;
  d?: number;
  transparency?: number;
  illum?: number;
  dimension?: number;
  lines?: number;
  wireframe?: boolean;
  visible?: boolean;
  ibo?: WebGLBuffer;
  vao?: WebGLVertexArrayObject;
  textureCoords?: number[];
};

export type TraversedObject = {
  vertices: number[];
  indices: number[];
  scalars?: number[];
  alias?: string;
  diffuse: [number, number, number, number];
  Kd: [number, number, number];
  ambient: [number, number, number, number];
  Ka: [number, number, number];
  specular: [number, number, number, number];
  Ks: [number, number, number];
  specularExponent: number;
  Ns: number;
  d: number;
  transparency: number;
  illum: number;
  dimension?: number;
  lines?: number;
  wireframe?: boolean;
  visible?: boolean;
  ibo: WebGLBuffer;
  vao: WebGLVertexArrayObject;
  textureCoords?: number[];
  position?: [number, number, number];
  scale?: [number, number, number];
  pickingColor?: [number, number, number, number];
  previous?: [number, number, number, number];
};

/** scene.add() then init Buffer */
export class Scene {
  gl: WebGL2RenderingContext;
  program: Program;
  objects: TraversedObject[];

  constructor(gl: WebGL2RenderingContext, program: Program) {
    this.gl = gl;
    this.program = program;
    this.objects = [];
  }

  loadByParts(path: string, count: number, alias?: string) {
    for (let i = 1; i <= count; i++) {
      const part = `${path}${i}.json`;
      this.load(part, alias);
    }
  }

  // Asynchronously load a file
  async load(filename: string, alias?: string, attributes?: Record<string, any>) {
    try {
      const res = await fetch(filename);
      const rawObject = await res.json();
      const object: Object = {
        vertices: rawObject.vertices || [],
        indices: rawObject.indices || [],
        scalars: rawObject.scalars,
        alias: alias || rawObject.alias,
        diffuse: rawObject.diffuse || [1, 1, 1, 1],
        Kd: rawObject.Kd || rawObject.diffuse?.slice(0, 3) || [1, 1, 1],
        ambient: rawObject.ambient || [0.2, 0.2, 0.2, 1],
        Ka: rawObject.Ka || rawObject.ambient?.slice(0, 3) || [0.2, 0.2, 0.2],
        specular: rawObject.specular || [1, 1, 1, 1],
        Ks: rawObject.Ks || rawObject.specular?.slice(0, 3) || [1, 1, 1],
        specularExponent: rawObject.specularExponent || 0,
        Ns: rawObject.Ns || rawObject.specularExponent || 0,
        d: rawObject.d || 1,
        transparency: rawObject.transparency || rawObject.d || 1,
        illum: rawObject.illum || 1,
        dimension: rawObject.dimension,
        lines: rawObject.lines,
        wireframe: rawObject.wireframe,
        visible: true,
        ibo: undefined,
        vao: undefined,
        textureCoords: rawObject.textureCoords || [],
      };

      // Merge if any attributes are provided
      Object.assign(object, attributes);

      this.add(object);
    } catch (err) {
      console.error(err);
    }
  }

  // Add object to scene, by settings default and configuring all necessary
  // buffers and textures
  add(object: Object, attributes?: Record<string, any>) {
    const { gl } = this;

    // Since we've used both the OBJ convention here (e.g. Ka, Kd, Ks, etc.)
    // and descriptive terms throughout the book for educational purposes, we will set defaults for
    // each that doesn't exist to ensure the entire series of demos work.
    // That being said, it's best to stick to one convention throughout your application.
    object.diffuse = object.diffuse || [1, 1, 1, 1];
    object.Kd = object.Kd || (object.diffuse.slice(0, 3) as [number, number, number]);
    object.ambient = object.ambient || [0.2, 0.2, 0.2, 1];
    object.Ka = object.Ka || (object.ambient.slice(0, 3) as [number, number, number]);
    object.specular = object.specular || [1, 1, 1, 1];
    object.Ks = object.Ks || (object.specular.slice(0, 3) as [number, number, number]);
    object.specularExponent = object.specularExponent || 0;
    object.Ns = object.Ns || object.specularExponent;
    object.d = object.d || 1;
    object.transparency = object.transparency || object.d;
    object.illum = object.illum || 1;

    // Merge if any attributes are provided
    Object.assign(object, attributes);

    // Attach a new VAO instance
    object.vao = gl.createVertexArray();
    // Enable it to start working on it
    gl.bindVertexArray(object.vao);

    // Indices
    object.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW);

    const attribLoc = this.program.location.attributes;

    // Positions
    if (attribLoc.aVertexPosition !== undefined && attribLoc.aVertexPosition >= 0) {
      const vertexBufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attribLoc.aVertexPosition);
      gl.vertexAttribPointer(attribLoc.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    }

    // Normals
    if (attribLoc.aVertexNormal !== undefined && attribLoc.aVertexNormal >= 0) {
      const normalBufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferObject);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(utils.calculateNormals(object.vertices, object.indices)), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attribLoc.aVertexNormal);
      gl.vertexAttribPointer(attribLoc.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
    }

    // Color Scalars
    if (object.scalars && attribLoc.aVertexColor !== undefined && attribLoc.aVertexColor >= 0) {
      const colorBufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferObject);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.scalars), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attribLoc.aVertexColor);
      gl.vertexAttribPointer(attribLoc.aVertexColor, 4, gl.FLOAT, false, 0, 0);
    }

    // Texture Coords
    if (object.textureCoords && attribLoc.aVertexTextureCoords >= 0) {
      const textureBufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, textureBufferObject);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.textureCoords), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attribLoc.aVertexTextureCoords);
      gl.vertexAttribPointer(attribLoc.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);
    }

    // Push to our objects list for later access
    this.objects.push(object as TraversedObject);

    // Clean up
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // Traverses over every item in the scene
  traverse(cb: (object: TraversedObject, index: number) => void | true) {
    for (let i = 0; i < this.objects.length; i++) {
      // Break out of the loop as long as any value is returned
      if (cb(this.objects[i], i) !== undefined) break;
    }
  }

  get(alias: string) {
    return this.objects.find((object) => object.alias === alias);
  }
}

export class Floor {
  alias: string;
  dimension: number;
  lines: number;
  vertices: number[];
  indices: number[];
  wireframe: boolean;
  visible: boolean;
  constructor(dimension = 50, lines = 5) {
    this.alias = "floor";

    this.dimension = dimension;
    this.lines = lines;
    this.vertices = [];
    this.indices = [];

    this.wireframe = true;
    this.visible = true;

    this.build(this.dimension, this.lines);
  }

  build(dimension: number, lines: number) {
    if (dimension) {
      this.dimension = dimension;
    }

    if (lines) {
      this.lines = (2 * this.dimension) / lines;
    }

    const inc = (2 * this.dimension) / this.lines;
    const v = [];
    const i = [];

    for (let l = 0; l <= this.lines; l++) {
      v[6 * l] = -this.dimension;
      v[6 * l + 1] = 0;
      v[6 * l + 2] = -this.dimension + l * inc;

      v[6 * l + 3] = this.dimension;
      v[6 * l + 4] = 0;
      v[6 * l + 5] = -this.dimension + l * inc;

      v[6 * (this.lines + 1) + 6 * l] = -this.dimension + l * inc;
      v[6 * (this.lines + 1) + 6 * l + 1] = 0;
      v[6 * (this.lines + 1) + 6 * l + 2] = -this.dimension;

      v[6 * (this.lines + 1) + 6 * l + 3] = -this.dimension + l * inc;
      v[6 * (this.lines + 1) + 6 * l + 4] = 0;
      v[6 * (this.lines + 1) + 6 * l + 5] = this.dimension;

      i[2 * l] = 2 * l;
      i[2 * l + 1] = 2 * l + 1;
      i[2 * (this.lines + 1) + 2 * l] = 2 * (this.lines + 1) + 2 * l;
      i[2 * (this.lines + 1) + 2 * l + 1] = 2 * (this.lines + 1) + 2 * l + 1;
    }

    this.vertices = v;
    this.indices = i;
  }
}

export class Axis {
  alias: string;
  wireframe: boolean;
  indices: number[];
  dimension: number;
  vertices: number[];

  constructor(dimension = 10) {
    this.alias = "axis";

    this.wireframe = true;
    this.indices = [0, 1, 2, 3, 4, 5];
    this.dimension = dimension;
    this.vertices = [];

    this.build(this.dimension);
  }

  build(dimension: number) {
    if (dimension) {
      this.dimension = dimension;
    }

    this.vertices = [
      -dimension,
      0.0,
      0.0,
      dimension,
      0.0,
      0.0,
      0.0,
      -dimension / 2,
      0.0,
      0.0,
      dimension / 2,
      0.0,
      0.0,
      0.0,
      -dimension,
      0.0,
      0.0,
      dimension,
    ];
  }
}

export class Camera {
  static TYPES = ["ORBITING_TYPE", "TRACKING_TYPE"];
  static ORBITING_TYPE = "ORBITING_TYPE";
  static TRACKING_TYPE = "TRACKING_TYPE";
  type = Camera.ORBITING_TYPE;

  position: vec3;
  home: vec3;
  up: vec3;
  right: vec3;
  normal: vec3;
  focus: vec3;

  /** cameraMatrix */
  matrix: mat4;

  azimuth: number;
  elevation: number;
  private steps: number;

  fov: number;
  minZ: number;
  maxZ: number;

  constructor(type = Camera.ORBITING_TYPE) {
    this.position = vec3.create();
    this.home = vec3.create();
    this.up = vec3.create();
    this.right = vec3.create();
    this.normal = vec3.create();
    this.focus = vec3.create();

    /** cameraMatrix */
    this.matrix = mat4.create();

    this.azimuth = 0;
    this.elevation = 0;
    this.steps = 0;

    this.fov = (45 * Math.PI) / 180;
    this.minZ = 0.1;
    this.maxZ = 10000;

    this.setType(type);
  }

  setType(type: string) {
    ~Camera.TYPES.indexOf(type) ? (this.type = type) : console.error(`${type} not supported`);
  }

  isOrbiting() {
    return this.type === Camera.ORBITING_TYPE;
  }
  isTracking() {
    return this.type === Camera.TRACKING_TYPE;
  }

  goHome(home: vec3) {
    if (home) {
      this.home = home;
    }

    this.setPosition(this.home);
    this.setAzimuth(0);
    this.setElevation(0);
  }

  setPosition(position: vec3) {
    vec3.copy(this.position, position);
    this.update();
  }

  setAzimuth(azimuth: number) {
    this.changeAzimuth(azimuth - this.azimuth);
  }
  changeAzimuth(azimuth: number) {
    this.azimuth += azimuth;
    this.azimuth = this.azimuth % 360;

    this.update();
  }

  setElevation(elevation: number) {
    this.changeElevation(elevation - this.elevation);
  }
  changeElevation(elevation: number) {
    this.elevation += elevation;
    this.elevation = this.elevation % 360;

    this.update();
  }

  update() {
    mat4.identity(this.matrix);

    if (this.isTracking()) {
      mat4.translate(this.matrix, this.matrix, this.position);
      mat4.rotateY(this.matrix, this.matrix, (this.azimuth * Math.PI) / 180);
      mat4.rotateX(this.matrix, this.matrix, (this.elevation * Math.PI) / 180);
    } else {
      mat4.rotateY(this.matrix, this.matrix, (this.azimuth * Math.PI) / 180);
      mat4.rotateX(this.matrix, this.matrix, (this.elevation * Math.PI) / 180);
      mat4.translate(this.matrix, this.matrix, this.position);
    }

    if (this.isTracking()) {
      const position = vec4.create();
      vec4.set(position, 0, 0, 0, 1);
      vec4.transformMat4(position, position, this.matrix);
      vec3.copy(this.position, [position[0], position[1], position[2]]);
    }

    this.calculateOrientation();
  }

  calculateOrientation() {
    const right = vec4.create();
    vec4.set(right, 1, 0, 0, 0);
    vec4.transformMat4(right, right, this.matrix);
    vec3.copy(this.right, [right[0], right[1], right[2]]);

    const up = vec4.create();
    vec4.set(up, 0, 1, 0, 0);
    vec4.transformMat4(up, up, this.matrix);
    vec3.copy(this.up, [up[0], up[1], up[2]]);

    const normal = vec4.create();
    vec4.set(normal, 0, 0, 1, 0);
    vec4.transformMat4(normal, normal, this.matrix);
    vec3.copy(this.normal, [normal[0], normal[1], normal[2]]);
  }

  /** return ModelViewMatrix */
  getViewTransform() {
    const matrix = mat4.create();
    mat4.invert(matrix, this.matrix);
    return matrix;
  }

  dolly(stepIncrement: number) {
    const normal = vec3.normalize(vec3.create(), this.normal);
    const newPosition = vec3.create();

    const step = stepIncrement - this.steps;

    if (this.isTracking()) {
      newPosition[0] = this.position[0] - step * normal[0];
      newPosition[1] = this.position[1] - step * normal[1];
      newPosition[2] = this.position[2] - step * normal[2];
    } else {
      newPosition[0] = this.position[0];
      newPosition[1] = this.position[1];
      newPosition[2] = this.position[2];
    }

    this.steps = stepIncrement;
    this.setPosition(newPosition);
  }

  setFocus(focus: vec3) {
    vec3.copy(this.focus, focus);
    this.update();
  }
}

export class Transforms {
  stack: mat4[];

  gl: WebGL2RenderingContext;
  program: Program;
  camera: Camera;
  canvas: HTMLCanvasElement;

  modelViewMatrix: mat4;
  projectionMatrix: mat4;
  normalMatrix: mat4;

  constructor(gl: WebGL2RenderingContext, program: Program, camera: Camera, canvas: HTMLCanvasElement) {
    this.stack = [];

    this.gl = gl;
    this.program = program;
    this.camera = camera;
    this.canvas = canvas;

    this.modelViewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.normalMatrix = mat4.create();

    this.calculateModelView();
    this.updatePerspective();
    this.calculateNormalMatrix();
  }

  calculateModelView() {
    this.modelViewMatrix = this.camera.getViewTransform();
  }

  updatePerspective() {
    mat4.perspective(this.projectionMatrix, this.camera.fov, this.canvas.width / this.canvas.height, this.camera.minZ, this.camera.maxZ);
  }

  private calculateNormalMatrix() {
    mat4.copy(this.normalMatrix, this.modelViewMatrix);
    mat4.invert(this.normalMatrix, this.normalMatrix);
    mat4.transpose(this.normalMatrix, this.normalMatrix);
  }

  push() {
    const matrix = mat4.create();
    mat4.copy(matrix, this.modelViewMatrix);
    this.stack.push(matrix);
  }

  pop() {
    return this.stack.length ? (this.modelViewMatrix = this.stack.pop()!) : null;
  }

  setMatrixUniforms() {
    this.calculateNormalMatrix();
    this.gl.uniformMatrix4fv(this.program.location.uniforms.uModelViewMatrix, false, this.modelViewMatrix);
    this.gl.uniformMatrix4fv(this.program.location.uniforms.uProjectionMatrix, false, this.projectionMatrix);
    this.gl.uniformMatrix4fv(this.program.location.uniforms.uNormalMatrix, false, this.normalMatrix);
  }
}

export class Controls {
  camera: Camera;
  canvas: HTMLCanvasElement;

  dragging: boolean = false;

  x = 0;
  y = 0;
  lastX = 0;
  lastY = 0;
  /** 左クリック0,中央ボタン1,右クリック2 */
  button: number = 0;

  motionFactor = 10;

  picker: Picker | null = null;
  picking = false;

  constructor(camera: Camera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.canvas = canvas;

    canvas.addEventListener("mousedown", (event: MouseEvent) => this.onMouseDown(event));
    canvas.addEventListener("mousemove", (event: MouseEvent) => this.onMouseMove(event));
    canvas.addEventListener("mouseup", (event: MouseEvent) => this.onMouseUp(event));
  }

  onMouseDown(event: MouseEvent) {
    this.dragging = true;

    this.x = event.clientX;
    this.y = event.clientY;
    this.button = event.button;

    if (!this.picker) return;

    const coordinates = this.get2DCoords(event);
    this.picking = this.picker.find(coordinates);

    if (!this.picking) this.picker.stop();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.dragging) return;

    this.lastX = this.x;
    this.lastY = this.y;

    this.x = event.clientX;
    this.y = event.clientY;

    const dx = this.x - this.lastX;
    const dy = this.y - this.lastY;

    if (this.picking && this.picker?.moveCallback) {
      this.picker.moveCallback(dx, dy);
      return;
    }

    this.rotate(dx, dy);
  }

  onMouseUp(event: MouseEvent) {
    this.dragging = false;

    if (!event.shiftKey && this.picker) {
      this.picking = false;
      this.picker.stop();
    }
  }

  rotate(dx: number, dy: number) {
    // const width = this.canvas.clientWidth;
    // const height = this.canvas.clientHeight;
    const { width, height } = this.canvas;

    const deltaAzimuth = -20 / width;
    const deltaElevation = -20 / height;

    const azimuth = dx * deltaAzimuth * this.motionFactor;
    const elevation = dy * deltaElevation * this.motionFactor;

    this.camera.changeAzimuth(azimuth);
    this.camera.changeElevation(elevation);
  }

  setPicker(picker: Picker) {
    this.picker = picker;
  }

  get2DCoords(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: this.canvas.clientHeight - (event.clientY - rect.top),
    };
  }
}

export class Light {
  id: string;
  position: [number, number, number] = [0, 0, 0];
  ambient: [number, number, number, number] | [number, number, number] = [0, 0, 0, 0];
  diffuse: [number, number, number, number] | [number, number, number] = [0, 0, 0, 0];
  specular: [number, number, number, number] | [number, number, number] = [0, 0, 0, 0];
  direction?: [number, number, number];

  constructor(id: string) {
    this.id = id;
  }

  setPosition(position: typeof this.position) {
    this.position = [...position];
  }

  setAmbient(ambient: typeof this.ambient) {
    this.ambient = [...ambient];
  }

  setDiffuse(diffuse: typeof this.diffuse) {
    this.diffuse = [...diffuse];
  }

  setSpecular(specular: typeof this.specular) {
    this.specular = [...specular];
  }

  setDirection(value: typeof this.direction) {
    this.direction = value;
  }
}

export class LightsManager {
  list: Light[];

  constructor() {
    this.list = [];
  }

  add(light: Light) {
    if (!(light instanceof Light)) {
      console.error("The parameter is nor a light");
    }

    this.list.push(light);
  }

  getArray(type: "position" | "ambient" | "diffuse" | "specular" | "direction") {
    return this.list.reduce((result: number[], light: Light) => {
      if (!light[type]) throw new Error(`Lightにtype:${type}がありません`);
      result = result.concat(light[type]);
      return result;
    }, []);
  }

  get(index: string | number) {
    if (typeof index === "string") {
      return this.list.find((light: Light) => light.id === index);
    } else if (typeof index === "number") {
      return this.list[index];
    }
  }
}

export class Texture {
  private gl: WebGL2RenderingContext;
  glTexture: WebGLTexture;
  private image: HTMLImageElement;

  constructor(gl: WebGL2RenderingContext, source?: string) {
    this.gl = gl;
    this.glTexture = gl.createTexture();

    this.image = new Image();
    this.image.addEventListener("load", () => this.handleLoadedTexture());

    if (source) {
      this.setImage(source);
    }
  }

  setImage(source: string) {
    this.image.src = source;
  }

  private handleLoadedTexture() {
    const { gl, glTexture, image } = this;
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

export class Picker {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;

  texture: WebGLTexture | null = null;
  framebuffer: WebGLFramebuffer | null = null;
  renderbuffer: WebGLRenderbuffer | null = null;

  pickedList: TraversedObject[];

  scene: Scene;

  hitPropertyCallback?: (obj: TraversedObject) => number[];
  addHitCallback?: (obj: TraversedObject) => void;
  removeHitCallback?: (obj: TraversedObject) => void;
  processHitsCallback?: (obj: TraversedObject[]) => void;
  moveCallback?: (x: number, y: number) => void;

  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    scene: Scene,
    callbacks: {
      hitPropertyCallback?: (obj: TraversedObject) => [number, number, number, number] | undefined;
      addHitCallback?: (obj: TraversedObject) => void;
      removeHitCallback?: (obj: TraversedObject) => void;
      processHitsCallback?: (hits: any[]) => void;
      moveCallback?: (x: number, y: number) => void;
    }
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.scene = scene;
    this.pickedList = [];

    Object.assign(this, callbacks);

    this.configure();
  }

  configure() {
    const { gl } = this;
    // const width = this.canvas.clientWidth;
    // const height = this.canvas.clientHeight;
    const { width, height } = this.canvas;

    // 色を保存するテクスチャの作成
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // 深度を保存するためのレンダーバッファの作成
    this.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    // オフスクリーンレンダリングのためのフレームバッファの作成
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    // テクスチャを設定
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    // レンダーバッファを設定
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  find(coords: { x: number; y: number }) {
    const readout: Uint8Array = new Uint8Array(1 * 1 * 4);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.readPixels(coords.x, coords.y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, readout);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    let found = false;

    this.scene.traverse((obj) => {
      if (obj.alias === "floor") return;

      const property = this.hitPropertyCallback && this.hitPropertyCallback(obj);
      if (!property) return;

      if (this.compare(readout, property)) {
        const idx = this.pickedList.indexOf(obj);
        if (~idx) {
          this.pickedList.splice(idx, 1);
          if (this.removeHitCallback) {
            this.removeHitCallback(obj);
          }
        } else {
          this.pickedList.push(obj);
          if (this.addHitCallback) {
            this.addHitCallback(obj);
          }
        }
        found = true;
        return found;
      }
    });

    return found;
  }

  compare(readout: Uint8Array, color: number[]) {
    return (
      Math.abs(Math.round(color[0] * 255) - readout[0]) <= 1 &&
      Math.abs(Math.round(color[1] * 255) - readout[1]) <= 1 &&
      Math.abs(Math.round(color[2] * 255) - readout[2]) <= 1
    );
  }

  getHits() {
    return this.pickedList;
  }

  stop() {
    if (this.processHitsCallback && this.pickedList.length) {
      this.processHitsCallback(this.pickedList);
    }
    this.pickedList = [];
  }

  update() {
    // const width = this.canvas.clientWidth;
    // const height = this.canvas.clientHeight;
    const { width, height } = this.canvas;
    const { gl } = this;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  }
}

export class PostProcess {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;

  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  renderbuffer: WebGLRenderbuffer | null;

  vertexBuffer: WebGLBuffer | null;
  textureBuffer: WebGLBuffer | null;

  program: WebGLProgram | null;
  attributeLocs: { [key: string]: number };
  uniformLocs: { [key: string]: WebGLUniformLocation | null };
  startTime: number;

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, vertexShaderRaw: string, fragmentShaderRaw: string) {
    this.gl = gl;
    this.canvas = canvas;

    this.texture = null;
    this.framebuffer = null;
    this.renderbuffer = null;

    this.vertexBuffer = null;
    this.textureBuffer = null;

    this.program = null;
    this.attributeLocs = {};
    this.uniformLocs = {};
    this.startTime = Date.now();

    this.configureFramebuffer();
    this.configureGeometry();
    this.configureShader(vertexShaderRaw, fragmentShaderRaw);
  }

  configureFramebuffer() {
    const { gl } = this;
    // const width = this.canvas.clientWidth;
    // const height = this.canvas.clientHeight;
    const { width, height } = this.canvas;

    // カラーテクスチャを初期化
    this.texture = this.gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Renderbuffer初期化
    this.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    // framebuffer初期化
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

    // clean
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  configureGeometry() {
    const { gl } = this;

    const vertices = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    const textureCoords = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];

    this.vertexBuffer = this.gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  configureShader(vertexShaderRaw: string, fragmentShaderRaw: string) {
    const { gl } = this;

    const vertexShader = utils.createShader(gl, vertexShaderRaw, gl.VERTEX_SHADER);
    const fragmentShader = utils.createShader(gl, fragmentShaderRaw, gl.FRAGMENT_SHADER);

    if (this.program) {
      gl.deleteProgram(this.program);
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("Could not initialize post-process shader");
    }

    this.attributeLocs = {};
    const attributesCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributesCount; i++) {
      const attrib = gl.getActiveAttrib(this.program, i);
      if (!attrib) throw new Error(`えら`);
      this.attributeLocs[attrib.name] = gl.getAttribLocation(this.program, attrib.name);
    }

    this.uniformLocs = {};
    const uniformsCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformsCount; i++) {
      const uniform = gl.getActiveUniform(this.program, i);
      if (!uniform) throw new Error(`えら`);
      this.uniformLocs[uniform.name] = gl.getUniformLocation(this.program, uniform.name);
    }
  }

  bind() {
    const { gl } = this;
    // const { width, height } = this.canvas;

    gl.useProgram(this.program);

    gl.enableVertexAttribArray(this.attributeLocs.aVertexPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.attributeLocs.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.attributeLocs.aVertexTextureCoords);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.vertexAttribPointer(this.attributeLocs.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uniformLocs.uSampler, 0);

    if (this.uniformLocs.uTime) {
      gl.uniform1f(this.uniformLocs.uTime, (Date.now() - this.startTime) / 1000);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  draw() {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
