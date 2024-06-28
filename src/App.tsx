import css from "./App.module.css";

import ReactDOM from "react-dom/client";
import React, { useCallback, useRef, useState } from "react";
import * as Babel from "@babel/standalone";
import { flushSync } from "react-dom";

const defaultSource = `
function TestComponent() {
  return <div>Test</div>;
}
`.trimStart();

const defaultRoot = `
return <TestComponent />;
`.trimStart();

const scopedEval = (scope: any, script: string) => Function(`with(this) { ${script} }`).bind(scope)();

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [root, setRoot] = useState<string>(defaultRoot);
  const [source, setSource] = useState<string>(defaultSource);

  const handleRender = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

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

    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const svgObjectUrl = URL.createObjectURL(svgBlob);

    const tempImg = new Image();
    tempImg.addEventListener('load', function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempImg, 0, 0);
      URL.revokeObjectURL(svgObjectUrl);
    });

    tempImg.src = svgObjectUrl;

  }, [canvasRef, source, root]);

  return (
    <div className={css.container}>
      <div>source</div>
      <textarea className={css.code} value={source} onChange={e => setSource(e.currentTarget.value ?? "")} />
      <div>root</div>
      <textarea className={css.code} value={root} onChange={e => setRoot(e.currentTarget.value ?? "")} />
      <button onClick={handleRender}>render</button>
      <canvas ref={canvasRef} className={css.canvas} width={512} height={512} />
    </div>
  );
}
