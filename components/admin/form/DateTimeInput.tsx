interface DateTimeInputProps {

  label: string;

  name: string;

  required?: boolean;

  defaultValue?: string;

  disabled?: boolean;

}

export default function DateTimeInput({

  label,

  name,

  required,

  defaultValue,

  disabled,

}: DateTimeInputProps) {

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
        type="datetime-local"
        required={required}
        defaultValue={defaultValue}
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
        "
      />

    </div>

  );

}