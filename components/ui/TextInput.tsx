interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;

  placeholder?: string;

  required?: boolean;

  disabled?: boolean;

  type?:
    | "text"
    | "email"
    | "number"
    | "datetime-local";
}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  type = "text",
}: TextInputProps) {

  return (

    <div className="space-y-2">

      <label className="block text-sm font-medium">

        {label}

      </label>

      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />

    </div>

  );

}