import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <main
      className={`max-w-6xl mx-auto px-6 py-12 ${className}`}
    >
      {children}
    </main>
  );
}