"use client";

interface ProgramOption {
  id: string;
  title: string;
}

interface SelectProgramProps {
  value: string;
  options: ProgramOption[];
  onChange: (value: string) => void;
}

export default function SelectProgram({
  value,
  options,
  onChange,
}: SelectProgramProps) {
  return (
    <div>

      <label className="mb-2 block font-medium">
        Program
      </label>

      <select
        className="w-full rounded-lg border px-4 py-3"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      >

        <option value="">
          Pilih Program
        </option>

        {options.map((program) => (

          <option
            key={program.id}
            value={program.id}
          >
            {program.title}
          </option>

        ))}

      </select>

    </div>
  );
}