"use client";

import React, { useRef, useEffect, useCallback } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export function OTPInput({ value, onChange, disabled = false, length = 6 }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ensure value is always the right length
  const paddedValue = value.padEnd(length, "").slice(0, length);
  const digits = paddedValue.split("");

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  }, [length]);

  const handleChange = useCallback((index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow single digit
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join("").trim();
    onChange(newValue);

    // Auto-focus next input if a digit was entered
    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  }, [digits, disabled, length, onChange, focusInput]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];

      if (newDigits[index]) {
        // Current box has a value: clear it and stay
        newDigits[index] = "";
        onChange(newDigits.join("").trim());
      } else if (index > 0) {
        // Current box is empty: move back and clear previous
        newDigits[index - 1] = "";
        onChange(newDigits.join("").trim());
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    } else if (e.key === "Delete") {
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join("").trim());
    }
  }, [digits, disabled, length, onChange, focusInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();

    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      // Focus the next empty input or the last one
      const focusIndex = Math.min(pastedData.length, length - 1);
      setTimeout(() => focusInput(focusIndex), 0);
    }
  }, [disabled, length, onChange, focusInput]);

  // Auto-focus first empty input when value changes externally
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex((d) => !d);
    if (firstEmptyIndex !== -1 && firstEmptyIndex < length) {
      // Only auto-focus if the user is already interacting with the component
      const activeElement = document.activeElement;
      const isInteracting = inputRefs.current.some((ref) => ref === activeElement);
      if (isInteracting) {
        focusInput(firstEmptyIndex);
      }
    }
  }, [value, digits, length, focusInput]);

  return (
    <div className="flex items-center gap-2 sm:gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`
            w-10 h-12 sm:w-12 sm:h-14
            text-center text-xl sm:text-2xl font-semibold
            rounded-xl border-2
            outline-none transition-all duration-200
            ${disabled
              ? "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 cursor-not-allowed"
              : digits[index]
                ? "border-primary bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white hover:border-gray-300 dark:hover:border-white/20"
            }
            focus:border-primary focus:ring-2 focus:ring-primary/20
          `}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
