interface TextAreaInputProps {

  label: string;

  name: string;

  defaultValue?: string;

}

export default function TextAreaInput({

  label,

  name,

  defaultValue,

}: TextAreaInputProps) {

  return (

    <div className="space-y-2">

      <label
        htmlFor={name}
        className="font-medium"
      >

        {label}

      </label>

      <textarea
        id={name}
        name={name}
        rows={4}
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