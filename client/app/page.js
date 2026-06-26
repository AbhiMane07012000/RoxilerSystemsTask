import Link from "next/link";

export default function Home() {
  return (
   <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans text-gray-900 dark:text-zinc-100">

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Store Ratings Platform
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl leading-relaxed">
          The easiest way to discover and rate local stores. Share your experiences, find highly-rated businesses, and see what the community recommends.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="flex items-center justify-center px-8 py-3 text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center px-8 py-3 text-base font-semibold rounded-lg text-blue-600 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-blue-400 dark:border-zinc-800 dark:hover:bg-zinc-800 transition shadow-sm"
          >
            Create an Account
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-zinc-800">
        &copy; {new Date().getFullYear()} Store Ratings Platform. Built for the community.
      </footer>
      
    </div>
  );
}
