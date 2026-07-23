interface Option {

  label: string;

  value: string;

}

import type { ChangeEventHandler } from "react";

interface SelectInputProps {

  label: string;

  name: string;

  options: Option[];

  defaultValue?: string;

  value?: string;

  onChange?: ChangeEventHandler<HTMLSelectElement>;

  placeholder?: string;

  required?: boolean;

  disabled?: boolean;

}

export default function SelectInput({

  label,

  name,

  options,

  defaultValue,

  value,

  onChange,

  placeholder,

  required,

  disabled,

}: SelectInputProps) {

  return (

    <div className="space-y-2">

      <label
        htmlFor={name}
        className="font-medium"
      >

        {label}

      </label>

      <select
        id={name}
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        required={required}
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
          disabled:text-slate-400
        "
      >

        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}

        {options.map((option) => (

          <option
            key={option.value}
            value={option.value}
          >

            {option.label}

          </option>

        ))}

      </select>

    </div>

  );

}