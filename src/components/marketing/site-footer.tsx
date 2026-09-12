export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-slate-700">Citas Pro</span> ·
          by ZentroSoft
        </p>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <a href="#precios" className="hover:text-slate-900">
            Precios
          </a>
          <a href="#contacto" className="hover:text-slate-900">
            Contacto
          </a>
          <a href="/login" className="hover:text-slate-900">
            Acceso profesional
          </a>
        </div>
      </div>
    </footer>
  );
}