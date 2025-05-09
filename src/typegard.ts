export function assertHTMLCanvasElement(el: unknown): asserts el is HTMLCanvasElement {
  if (!(el instanceof HTMLCanvasElement)) {
    throw new Error("要素がHTMLCanvasElementでない");
  }
}
