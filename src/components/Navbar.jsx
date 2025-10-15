export default function Navbar() {
  return (
    <nav className="bg-white shadow-md w-full fixed top-0 left-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">Twin Day</h1>
        <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition">
          + Add Routine
        </button>
      </div>
    </nav>
  );
}
