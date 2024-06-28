import css from "./App.module.css";

import ReactDOM from "react-dom/client";
import React, { useCallback, useRef, useState } from "react";
import * as Babel from "@babel/standalone";
import { flushSync } from "react-dom";
import { MonakoEditor } from "./components/MonakoEditor";

const defaultSource = `
function TestComponent() {
  return <div>Test</div>;
}
`.trimStart();

const defaultRoot = `
return <TestComponent />;
`.trimStart();

const scopedEval = (scope: any, script: string) => Function(`with(this) { ${script} }`).bind(scope)();

function setupCanvas(canvas: HTMLCanvasElement) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx?.scale(dpr, dpr);
  return ctx;
}


export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [root, setRoot] = useState<string>(defaultRoot);
  const [source, setSource] = useState<string>(defaultSource);

  const handleRender = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    setupCanvas(canvas);

    const container = document.createElement("div");

    const sourceOutput = Babel.transform(source, { presets: ["env", "react"] }).code;
    const rootOutput = Babel.transform(`function __Root() {${root}}`, { presets: ["env", "react"] }).code;
    const src = `
    ${sourceOutput}
    ${rootOutput}

    return __Root();
    `;

    console.log(src);

    if (!sourceOutput) {
      return;
    }

    const component = scopedEval({
      React: React,
    }, src);

    console.log(component);

    flushSync(() => {
      ReactDOM
        .createRoot(container)
        .render(<React.StrictMode>{component}</React.StrictMode>);
    });

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
    <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${container.innerHTML}</div>
    </foreignObject>
    </svg>`;

    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgObjectUrl = URL.createObjectURL(svgBlob);

    const tempImg = new Image();
    tempImg.addEventListener("load", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempImg, 0, 0);
      URL.revokeObjectURL(svgObjectUrl);
    });

    window.addEventListener("resize", () => {
      setupCanvas(canvas);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempImg, 0, 0);
    });

    tempImg.src = svgObjectUrl;

  }, [canvasRef, source, root]);

  return (
    <div className={css.container}>
      <div className={css.monakoContainer}>
        <MonakoEditor defaultValue={defaultSource} onChange={e => setSource(e)} />
        <MonakoEditor defaultValue={defaultRoot} onChange={e => setRoot(e)} />
      </div>
      <div className={css.canvasContainer}>
        <canvas ref={canvasRef} className={css.canvas} />
        <div className={css.buttonsContainer}>
          <button onClick={handleRender}>render</button>
        </div>
      </div>
    </div>
  );
}
