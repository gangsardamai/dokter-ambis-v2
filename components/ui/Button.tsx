import Link from "next/link";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function Button({
  href,
  children,
}: ButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
    >
      {children}
    </Link>
  );
}