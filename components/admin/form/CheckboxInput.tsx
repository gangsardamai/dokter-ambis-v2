interface CheckboxInputProps {

  label: string;

  name: string;

  defaultChecked?: boolean;

}

export default function CheckboxInput({

  label,

  name,

  defaultChecked,

}: CheckboxInputProps) {

  return (

    <label
      className="
        flex
        items-center
        gap-3
      "
    >

      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
      />

      {label}

    </label>

  );

}