"use client";

interface OrganizationOption {
  id: string;
  title: string;
}

interface SelectOrganizationProps {
  value: string;
  options: OrganizationOption[];
  onChange: (value: string) => void;
}

export default function SelectOrganization({
  value,
  options,
  onChange,
}: SelectOrganizationProps) {
  return (
    <div>

      <label className="mb-2 block font-medium">
        Universitas
      </label>

      <select
        className="w-full rounded-lg border px-4 py-3"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      >

        <option value="">
          Pilih Universitas
        </option>

        {options.map((organization) => (

          <option
            key={organization.id}
            value={organization.id}
          >
            {organization.title}
          </option>

        ))}

      </select>

    </div>
  );
}