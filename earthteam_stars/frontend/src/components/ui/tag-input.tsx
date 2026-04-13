"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TagInputProps {
  label?: string;
  suggestions: readonly string[] | string[];
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function TagInput({ label, suggestions, value, onChange, className }: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const addTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const available = (suggestions as string[]).filter((s) => !value.includes(s));

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-emerald-500 hover:text-emerald-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm text-gray-500 shadow-sm hover:bg-gray-50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {available.length > 0 ? "Click to add tags..." : "All tags selected"}
        </button>

        {isOpen && available.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {available.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  addTag(tag);
                  if (available.length <= 1) setIsOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
