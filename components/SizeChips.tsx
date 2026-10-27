"use client";
import { useId } from "react";
import type { Size } from "@/data/products";
export function SizeChips({
  sizes,
  value,
  onChange,
  invalid,
}: {
  sizes: readonly Size[];
  value: Size | null;
  onChange: (size: Size) => void;
  invalid: boolean;
}) {
  const id = useId();
  return (
    <fieldset
      className={`size-fieldset ${invalid ? "invalid" : ""}`}
      aria-describedby={invalid ? `${id}-error` : undefined}
    >
      <legend>РАЗМЕР:</legend>
      <div className="size-chips" role="radiogroup" aria-label="Размер">
        {sizes.map((size) => (
          <label className="size-chip" key={size}>
            <input
              type="radio"
              name={id}
              value={size}
              checked={value === size}
              onChange={() => onChange(size)}
            />
            <span>{size}</span>
          </label>
        ))}
      </div>
      {invalid ? (
        <p role="alert" className="field-error" id={`${id}-error`}>
          Выберите размер
        </p>
      ) : null}
    </fieldset>
  );
}
