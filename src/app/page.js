// src/app/page.js
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Eletricista <span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-lg text-slate-600">
          Sua plataforma de gestão de orçamentos e clientes.
        </p>
        <div className="pt-4">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full md:w-auto">
            Começar Agora
          </button>
        </div>
      </div>
    </main>
  );
}