interface StatusBadgeProps {

  label: string;

  color?:
    | "green"
    | "red"
    | "yellow"
    | "blue"
    | "gray";

}

const colors = {

  green:
    "bg-green-100 text-green-700",

  red:
    "bg-red-100 text-red-700",

  yellow:
    "bg-yellow-100 text-yellow-700",

  blue:
    "bg-blue-100 text-blue-700",

  gray:
    "bg-gray-100 text-gray-700",

};

export default function StatusBadge({

  label,

  color = "gray",

}: StatusBadgeProps) {

  return (

    <span
      className={`
        rounded-full
        px-3
        py-1
        text-sm
        font-medium
        ${colors[color]}
      `}
    >

      {label}

    </span>

  );

}