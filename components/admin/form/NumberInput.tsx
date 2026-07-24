import type { ChangeEventHandler } from "react";

interface NumberInputProps {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: number;
  value?: number | "";
  onChange?: ChangeEventHandler<HTMLInputElement>;
  min?: number;
  max?: number;
  step?: number | "any";
  disabled?: boolean;
  helperText?: string;
}

export default function NumberInput({
  label,
  name,
  required,
  defaultValue,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  helperText,
}: NumberInputProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="font-medium"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="number"
        required={required}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="
          w-full
          rounded-lg
          border
          px-4
          py-2
          outline-none
          focus:ring-2
          focus:ring-blue-500
          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-500
        "
      />

      {helperText ? (
        <p className="text-xs leading-5 text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
