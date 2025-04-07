// app/page.tsx (landing page)
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-indigo-700 flex flex-col">
      <header className="px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">TaskFlow</h1>
        </div>
        <div>
          <Link
            href="/auth"
            className="px-4 py-2 text-sm font-medium text-indigo-800 bg-white rounded-md shadow-sm hover:bg-gray-100"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
          Task Management that{" "}
          <span className="text-indigo-300">Works Like You Do</span>
        </h2>
        <p className="mt-3 max-w-md mx-auto text-base text-indigo-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          TaskFlow adapts to your natural work patterns instead of forcing you
          into rigid systems
        </p>
        <div className="mt-8 sm:mt-10">
          <Link
            href="/auth"
            className="px-8 py-3 text-base font-medium text-indigo-700 bg-white rounded-md shadow-lg hover:bg-gray-100 md:py-4 md:text-lg md:px-10"
          >
            Get Started
          </Link>
        </div>
      </main>

      <footer className="px-4 py-6 sm:px-6 lg:px-8 text-center text-indigo-200">
        <p>© 2025 TaskFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
