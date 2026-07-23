import Link from "next/link";

interface PrimaryButtonProps {

  href?: string;

  children: React.ReactNode;

  type?: "button" | "submit";

  className?: string;

}

export default function PrimaryButton({

  href,

  children,

  type = "button",

  className = "",

}: PrimaryButtonProps) {

  if (href) {

    return (

      <Link

        href={href}

        className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}

      >

        {children}

      </Link>

    );

  }

  return (

    <button

      type={type}

      className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}

    >

      {children}

    </button>

  );

}