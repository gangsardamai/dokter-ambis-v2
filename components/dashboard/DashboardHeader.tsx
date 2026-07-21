import type { Profile } from "@/types";
import {
  logoutAction,
} from "@/app/actions/auth.actions";
interface DashboardHeaderProps {
  profile: Profile;
}

export default function DashboardHeader({
  profile,
}: DashboardHeaderProps) {

  const initials =
    profile.full_name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase();

  return (

    <header className="flex h-16 items-center justify-between border-b bg-white px-8">

      <div>

        <h1 className="text-lg font-semibold">

          Dashboard

        </h1>

      </div>

      <div className="flex items-center gap-4">

        <div className="text-right">

          <p className="font-medium">

            {profile.full_name}

          </p>

          <p className="text-sm text-gray-500 capitalize">

            {profile.role}

          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">

          {initials}

        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="
              rounded-lg
              border
              border-gray-300
              px-3
              py-2
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
            "
          >
            Logout
          </button>
        </form>
      </div>

    </header>

  );

}