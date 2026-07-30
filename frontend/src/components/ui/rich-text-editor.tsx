"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Strikethrough } from 'lucide-react';

export function RichTextEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-input">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-surface-hover p-1">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-brand/20 text-brand' : 'hover:bg-black/5'}`}>
          <Bold className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-brand/20 text-brand' : 'hover:bg-black/5'}`}>
          <Italic className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded ${editor.isActive('strike') ? 'bg-brand/20 text-brand' : 'hover:bg-black/5'}`}>
          <Strikethrough className="size-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-brand/20 text-brand' : 'hover:bg-black/5'}`}>
          <List className="size-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-brand/20 text-brand' : 'hover:bg-black/5'}`}>
          <ListOrdered className="size-4" />
        </button>
      </div>
      <EditorContent editor={editor} className="p-2" />
    </div>
  );
}
