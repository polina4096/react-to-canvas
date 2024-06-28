import { useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import css from './MonakoEditor.module.css';

export type MonakoEditorProps = {
  defaultValue: string;
  onChange: (value: string) => void;
};

export const MonakoEditor = (props: MonakoEditorProps) => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);

  editor?.onDidChangeModelContent(_ => {
    const value = editor.getValue();
    props.onChange(value);
  });

  useEffect(() => {
    if (monacoEl) {
      setEditor((editor) => {
        if (editor) return editor;

        return monaco.editor.create(monacoEl.current!, {
          value: props.defaultValue,
          language: 'javascript',
          automaticLayout: true,
        });
      });
    }

    return () => editor?.dispose();
  }, [monacoEl.current]);

  return <div className={css.editor} ref={monacoEl} />;
};
