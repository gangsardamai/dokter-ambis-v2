interface Option {

  label: string;

  value: string;

}

interface SelectInputProps {

  label: string;

  name: string;

  options: Option[];

  defaultValue?: string;

}

export default function SelectInput({

  label,

  name,

  options,

  defaultValue,

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
        defaultValue={defaultValue}
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