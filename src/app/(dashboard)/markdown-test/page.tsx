'use client';
import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownEditor() {
    const [markdownContent, setMarkdownContent] = useState("## Start writing your note here\n");
    const [editing, setEditing] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Switch to preview after 2 seconds of inactivity
    useEffect(() => {
        if (editing) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setEditing(false), 2000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [markdownContent, editing]);

    // Focus textarea when switching back to edit mode
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (editing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [editing]);

    return (
        <div className="flex flex-col md:flex-row gap-6 w-full h-full p-4">
            <div className="w-full h-full">
                {editing ? (
                    <textarea
                        ref={textareaRef}
                        className="w-full h-screen p-2 border rounded resize-y font-mono text-base bg-white text-black"
                        value={markdownContent}
                        onChange={e => {
                            setMarkdownContent(e.target.value);
                            setEditing(true);
                        }}
                        placeholder="Write your markdown here..."
                        spellCheck={true}
                        onBlur={() => setEditing(false)}
                    />
                ) : (
                    <div
                        className="w-full h-full p-4 border rounded bg-gray-50 overflow-auto cursor-pointer prose prose-sm sm:prose lg:prose-lg xl:prose-xl prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:text-foreground prose-blockquote:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-table:text-foreground prose-th:text-foreground prose-td:text-foreground"
                        onClick={() => setEditing(true)}
                        title="Click to edit"
                    >
                        <Markdown remarkPlugins={[remarkGfm]}>{markdownContent}</Markdown>
                    </div>
                )}
            </div>
        </div>
    );
}