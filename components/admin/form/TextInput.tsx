interface TextInputProps {

  label: string;

  name: string;

  required?: boolean;

  defaultValue?: string;

  placeholder?: string;

}

export default function TextInput({

  label,

  name,

  required,

  defaultValue,

  placeholder,

}: TextInputProps) {

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
        type="text"
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
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