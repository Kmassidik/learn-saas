// app/auth/page.tsx
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          TaskFlow
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          The intelligent task management system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}

