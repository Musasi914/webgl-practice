export class WebGLBasicUtility {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  shaderProgram: WebGLProgram;

  constructor(canvas: HTMLCanvasElement, vertexShaderSource: string, fragmentShaderSource: string) {
    this.canvas = canvas;
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
