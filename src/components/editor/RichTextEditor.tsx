// ============================================================
// ListingDesk Pro — Rich Text Editor
// Full WYSIWYG editor with font family, size, formatting, alignment, lists
// ============================================================

import React, { useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link2, Image as ImageIcon, Type, Undo2, Redo2,
  Sparkles, Code, Minus,
} from 'lucide-react';
import { Button } from '../ui';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  label?: string;
  required?: boolean;
  allowHtml?: boolean;
  helpText?: string;
  error?: string;
}

const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Impact', label: 'Impact' },
];

const FONT_SIZES = [
  { value: '1', label: '8pt' },
  { value: '2', label: '10pt' },
  { value: '3', label: '12pt' },
  { value: '4', label: '14pt' },
  { value: '5', label: '18pt' },
  { value: '6', label: '24pt' },
  { value: '7', label: '36pt' },
];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#00cc00', '#00cccc', '#0066ff',
  '#9900ff', '#ff00ff', '#cc0000', '#cc6600', '#cccc00', '#009900',
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Describe your item...',
  maxLength,
  label,
  required,
  allowHtml = true,
  helpText,
  error,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlCode, setHtmlCode] = useState(value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !showHtml) {
      if (value && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, showHtml]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlCode(html);
      onChange(html);
    }
  };

  const handleInput = () => {
    updateContent();
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setHtmlCode(newHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = newHtml;
    }
    onChange(newHtml);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) execCommand('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) execCommand('insertImage', url);
  };

  const insertHorizontalRule = () => {
    execCommand('insertHorizontalRule');
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
  };

  const charCount = editorRef.current?.innerText?.length || 0;

  return (
    <div className="space-y-1">
      {(label || helpText) && (
        <div>
          {label && (
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {helpText && <p className="text-xs text-gray-500 mt-0.5">{helpText}</p>}
        </div>
      )}

      <div className={clsx(
        'rounded-lg border overflow-hidden',
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
      )}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
          {/* Undo/Redo */}
          <ToolbarButton icon={<Undo2 className="h-3.5 w-3.5" />} onClick={() => execCommand('undo')} title="Undo" />
          <ToolbarButton icon={<Redo2 className="h-3.5 w-3.5" />} onClick={() => execCommand('redo')} title="Redo" />

          <ToolbarDivider />

          {/* Font Family */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontFamily(!showFontFamily)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 min-w-[100px] justify-between"
            >
              <span className="truncate">Arial</span>
              <span className="text-gray-400">▾</span>
            </button>
            {showFontFamily && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => {
                      execCommand('fontName', font.value);
                      setShowFontFamily(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontSize(!showFontSize)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 min-w-[60px] justify-between"
            >
              <Type className="h-3 w-3" />
              <span className="text-gray-400">▾</span>
            </button>
            {showFontSize && (
              <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => {
                      execCommand('fontSize', size.value);
                      setShowFontSize(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarButton icon={<Bold className="h-3.5 w-3.5" />} onClick={() => execCommand('bold')} title="Bold" />
          <ToolbarButton icon={<Italic className="h-3.5 w-3.5" />} onClick={() => execCommand('italic')} title="Italic" />
          <ToolbarButton icon={<Underline className="h-3.5 w-3.5" />} onClick={() => execCommand('underline')} title="Underline" />

          {/* Text Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="rounded p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Text Color"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold" style={{ color: '#000' }}>A</span>
                <div className="h-0.5 w-4 bg-red-500" />
              </div>
            </button>
            {showColorPicker && (
              <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-6 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      execCommand('foreColor', color);
                      setShowColorPicker(false);
                    }}
                    className="h-5 w-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton icon={<AlignLeft className="h-3.5 w-3.5" />} onClick={() => execCommand('justifyLeft')} title="Align Left" />
          <ToolbarButton icon={<AlignCenter className="h-3.5 w-3.5" />} onClick={() => execCommand('justifyCenter')} title="Align Center" />
          <ToolbarButton icon={<AlignRight className="h-3.5 w-3.5" />} onClick={() => execCommand('justifyRight')} title="Align Right" />

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton icon={<List className="h-3.5 w-3.5" />} onClick={() => execCommand('insertUnorderedList')} title="Bullet List" />
          <ToolbarButton icon={<ListOrdered className="h-3.5 w-3.5" />} onClick={() => execCommand('insertOrderedList')} title="Numbered List" />

          <ToolbarDivider />

          {/* Insert */}
          <ToolbarButton icon={<Link2 className="h-3.5 w-3.5" />} onClick={insertLink} title="Insert Link" />
          {allowHtml && <ToolbarButton icon={<ImageIcon className="h-3.5 w-3.5" />} onClick={insertImage} title="Insert Image" />}
          <ToolbarButton icon={<Minus className="h-3.5 w-3.5" />} onClick={insertHorizontalRule} title="Horizontal Line" />

          <ToolbarDivider />

          {/* Clear / HTML */}
          <ToolbarButton icon={<Code className="h-3.5 w-3.5" />} onClick={() => setShowHtml(!showHtml)} title="HTML Code" active={showHtml} />
        </div>

        {/* Editor Area */}
        {showHtml ? (
          <textarea
            value={htmlCode}
            onChange={handleHtmlChange}
            placeholder={placeholder}
            className="w-full min-h-[200px] bg-white px-3 py-2 text-xs font-mono focus:outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={updateContent}
            data-placeholder={placeholder}
            className={clsx(
              'w-full min-h-[200px] bg-white px-3 py-2 text-sm focus:outline-none dark:bg-gray-800 dark:text-gray-100',
              'prose prose-sm max-w-none',
              'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400'
            )}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
          <span className="text-xs text-gray-500">
            {allowHtml ? 'HTML supported' : 'Plain text only'}
          </span>
          {maxLength && (
            <span className={clsx(
              'text-xs',
              charCount > maxLength ? 'text-red-500' : 'text-gray-500'
            )}>
              {charCount}/{maxLength} characters
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================
// Toolbar Button
// ============================================================
function ToolbarButton({ icon, onClick, title, active }: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'rounded p-1.5 transition-colors',
        active
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
      )}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />;
}
