"use client";

import React from "react";

export function Slider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-plum-700/80">{label}</label>
        <span className="text-lilac-500 font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-lilac-400 h-2"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-plum-700/40 mt-1">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

export function ChipSelect({
  options,
  selected,
  onToggle,
  multi = true,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onToggle(opt)}
          className={`chip ${selected.includes(opt) ? "chip-active" : "chip-inactive"}`}
          aria-pressed={selected.includes(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8" role="progressbar" aria-valuenow={step} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === step ? "w-8 bg-plum-700" : i < step ? "w-2 bg-plum-700/50" : "w-2 bg-plum-700/15"
          }`}
        />
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-lilac-200 border-t-lilac-500 animate-spin" />
      {label && <p className="text-plum-700/60 text-sm">{label}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-blush-50 border border-blush-200 text-plum-700 rounded-xl p-4 text-sm">
      {message}
    </div>
  );
}
