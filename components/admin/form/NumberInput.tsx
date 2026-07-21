interface NumberInputProps {

  label: string;

  name: string;

  required?: boolean;

  defaultValue?: number;

}

export default function NumberInput({

  label,

  name,

  required,

  defaultValue,

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
      />

    </div>

  );

}