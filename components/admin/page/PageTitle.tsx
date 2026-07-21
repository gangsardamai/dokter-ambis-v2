interface PageTitleProps {

  title: string;

  description?: string;

  action?: React.ReactNode;

}

export default function PageTitle({

  title,

  description,

  action,

}: PageTitleProps) {

  return (

    <div className="mb-8 flex items-start justify-between">

      <div>

        <h1 className="text-3xl font-bold">

          {title}

        </h1>

        {

          description && (

            <p className="mt-2 text-gray-500">

              {description}

            </p>

          )

        }

      </div>

      {action}

    </div>

  );

}