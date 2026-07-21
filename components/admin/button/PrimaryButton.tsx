import Link from "next/link";

interface PrimaryButtonProps {

  href?: string;

  children: React.ReactNode;

  type?: "button" | "submit";

}

export default function PrimaryButton({

  href,

  children,

  type = "button",

}: PrimaryButtonProps) {

  if (href) {

    return (

      <Link

        href={href}

        className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"

      >

        {children}

      </Link>

    );

  }

  return (

    <button

      type={type}

      className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"

    >

      {children}

    </button>

  );

}