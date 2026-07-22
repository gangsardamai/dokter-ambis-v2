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

}

export default function SelectInput({

  label,

  name,

  options,

  defaultValue,

  value,

  onChange,

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
        className="
          w-full
          rounded-lg
          border
          px-4
          py-2
          outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      >

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