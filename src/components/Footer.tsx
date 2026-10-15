export default function Footer() {
  return (
    <footer className="mt-8 w-full border-t border-[#38383d] bg-[#202023] text-[#f1f1f2] shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-[#b5b5bb]">
          © {new Date().getFullYear()} PokéBinder Studio
        </p>
      </div>
    </footer>
  );
}
