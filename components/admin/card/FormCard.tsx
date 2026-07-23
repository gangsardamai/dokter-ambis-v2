interface FormCardProps {

  children: React.ReactNode;

}

export default function FormCard({

  children,

}: FormCardProps) {

  return (

    <div
      className="
        rounded-3xl
        border
        border-blue-100/80
        bg-white
        p-4
        shadow-sm
        sm:p-6
        lg:p-8
      "
    >

      {children}

    </div>

  );

}