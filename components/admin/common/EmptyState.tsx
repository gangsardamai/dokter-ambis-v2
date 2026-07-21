interface EmptyStateProps {

  title: string;

  description?: string;

}

export default function EmptyState({

  title,

  description,

}: EmptyStateProps) {

  return (

    <div
      className="
        rounded-lg
        border
        p-12
        text-center
      "
    >

      <h2
        className="
          text-lg
          font-semibold
        "
      >

        {title}

      </h2>

      {

        description && (

          <p
            className="
              mt-2
              text-gray-500
            "
          >

            {description}

          </p>

        )

      }

    </div>

  );

}