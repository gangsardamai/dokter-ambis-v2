import RegisterForm from "@/components/auth/RegisterForm";

interface RegisterPageProps {
  searchParams: Promise<{
    next?: string | string[];
  }>;
}

function getParamValue(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getSafeStudentNextPath(value: string): string {
  if (
    value.startsWith("/dashboard/student/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "";
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = getSafeStudentNextPath(
    getParamValue(params.next),
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <RegisterForm nextPath={nextPath} />
    </main>
  );
}
