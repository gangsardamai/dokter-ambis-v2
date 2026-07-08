interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

export default function TextArea({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
  disabled = false,
}: TextAreaProps) {
  return (
    <div>
      <label className="mb-2 block font-medium">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border px-4 py-3 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
    </div>
  );
}