interface FormCardProps {

  children: React.ReactNode;

}

export default function FormCard({

  children,

}: FormCardProps) {

  return (

    <div
      className="
        rounded-xl
        border
        bg-white
        p-8
        shadow-sm
      "
    >

      {children}

    </div>

  );

}