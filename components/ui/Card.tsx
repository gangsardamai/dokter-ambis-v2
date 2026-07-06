interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        border
        bg-white
        p-5
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}