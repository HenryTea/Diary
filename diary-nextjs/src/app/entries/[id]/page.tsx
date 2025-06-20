"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Entry {
  id: string | number;
  date: string;
  text: string;
}

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/entries");
        const data: Entry[] = await res.json();
        const found = data.find((e) => e.id.toString() === id);
        if (!found) throw new Error("Entry not found");
        setEntry(found);
        setText(found.text);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  const handleSaveAndBack = async () => {
    if (text.trim() !== "") {
      const res = await fetch("/api/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text }),
      });
      if (res.ok) {
        // Update entry in state for real-time UI update
        setEntry((prev) => (prev ? { ...prev, text } : prev));
      }
    }
    router.push("/");
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await fetch("/api/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.push("/");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!entry) return <div>Entry not found.</div>;

  return (
    <div className="min-h-screen bg-[#f5fafc] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#e9f3f6] flex flex-col items-center border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-4 py-2">
          <button
            className="text-2xl text-red-600 hover:bg-red-100 rounded transition-colors px-2 py-1 mr-2"
            onClick={handleDelete}
            title="Delete entry"
          >
            🗑️
          </button>
          {text !== entry.text ? (
            <button
              className="flex items-center hover:bg-green-100 rounded transition-colors px-2 py-1"
              onClick={handleSaveAndBack}
              title="Save and back to Entries"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-7 h-7 text-green-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              <span
                className="mr-1 text-green-600 font-medium"
                style={{ marginRight: "5px" }}
              >
                Save and back to Entries
              </span>
            </button>
          ) : (
            <button
              className="text-2xl hover:bg-gray-300 rounded transition-colors px-2 py-1"
              onClick={() => router.push("/")}
              title="Back to main page"
            >
              &#8592;
            </button>
          )}
          <span className="text-xs font-semibold tracking-widest">
            {new Date(entry.date).toLocaleString("en-US")}
          </span>
          <div className="w-8" />
        </div>
        <div className="flex items-center gap-2 py-2">
          <button className="px-2 py-1 rounded hover:bg-gray-200">+</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">T</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">
            &#8226;&#8226;&#8226;
          </button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 font-bold">
            B
          </button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 italic">
            I
          </button>
          <button className="px-2 py-1 rounded hover:bg-gray-200 underline">
            U
          </button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">🎨</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">✏️</button>
          <button className="px-2 py-1 rounded hover:bg-gray-200">👁️</button>
        </div>
      </div>
      {/* Editor Area */}
      <div className="flex-1 bg-white mx-2 my-4 rounded shadow-sm p-4 min-h-[60vh]">
        <textarea
          className="w-full h-full min-h-[50vh] resize-none outline-none bg-transparent text-base text-black placeholder-gray-400"
          placeholder="Edit your diary entry here..."
          style={{ fontFamily: "inherit" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {/* Bottom Bar */}
      <div className="sticky bottom-0 z-30 w-full bg-[#f5fafc] border-t border-gray-200 flex items-center justify-between px-4 py-2">
        <div className="flex gap-3 items-center">
          <button className="text-xl">🖼️</button>
          <button className="text-xl">📍</button>
          <button className="text-xl">☀️</button>
          <button className="text-xl">🏃</button>
          <button className="text-xl">🏷️</button>
        </div>
        <div className="text-xs text-gray-500">
          Words{" "}
          {text
            .trim()
            .split(/\s+/)
            .filter(Boolean).length}{" "}
          · Characters {text.length}
        </div>
      </div>
    </div>
  );
}
