import React, { useMemo, useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const AdminUsersPanel = () => {
  const users = useTournamentStore((state) => state.users || []);
  const currentUser = useTournamentStore((state) => state.currentUser);
  const createManagedUser = useTournamentStore((state) => state.createManagedUser);
  const logoutUser = useTournamentStore((state) => state.logoutUser);
  const [personName, setPersonName] = useState('');
  const [status, setStatus] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const managedUsers = useMemo(
    () => users.filter((user) => user.role !== 'admin'),
    [users]
  );

  const handleCreateUser = (event) => {
    event.preventDefault();
    const result = createManagedUser(personName);
    setStatus({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setGeneratedCredentials(result.credentials);
      setPersonName('');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-[1.5rem] border border-slate-800 bg-slate-900/90 p-5 shadow-2xl sm:flex sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Administracion</p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-4xl">Control de usuarios</h1>
            <p className="mt-2 text-sm text-slate-400">Crea cuentas y consulta todos los accesos generados.</p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4 sm:mt-0 sm:border-0 sm:pt-0">
            <span className="text-sm font-semibold text-slate-300">{currentUser}</span>
            <button
              type="button"
              onClick={logoutUser}
              className="rounded-xl bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Cerrar sesion
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
          <section className="rounded-[1.5rem] border border-sky-500/30 bg-slate-900/80 p-5 ring-1 ring-sky-500/10 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Nuevo acceso</p>
            <h2 className="mt-2 text-xl font-bold text-white">Crear usuario</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Escribe el nombre de la persona. El usuario y la contrasena se generan automaticamente.
            </p>

            <form onSubmit={handleCreateUser} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Nombre de la persona</span>
                <input
                  type="text"
                  value={personName}
                  onChange={(event) => setPersonName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Ej. Juan Perez"
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-sky-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-sky-400"
              >
                Generar usuario y contrasena
              </button>
            </form>

            {status && (
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                status.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'
              }`}>
                {status.text}
              </div>
            )}

            {generatedCredentials && (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-slate-950 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Ultimo acceso generado</p>
                <p className="mt-3 text-sm font-semibold text-white">{generatedCredentials.fullName}</p>
                <p className="mt-2 break-all font-mono text-sm text-sky-300">Usuario: {generatedCredentials.username}</p>
                <p className="mt-1 break-all font-mono text-sm text-emerald-300">Contrasena: {generatedCredentials.password}</p>
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Accesos creados</p>
                <h2 className="mt-2 text-xl font-bold text-white">Usuarios y contrasenas</h2>
              </div>
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-bold text-sky-300">{managedUsers.length}</span>
            </div>

            <div className="mt-5 space-y-3">
              {managedUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                  Todavia no has creado usuarios.
                </div>
              ) : managedUsers.map((user) => (
                <article key={user.username} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="font-semibold text-white">{user.fullName || user.username}</p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="min-w-0 rounded-xl bg-slate-900 px-3 py-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Usuario</span>
                      <span className="mt-1 block break-all font-mono text-sky-300">{user.username}</span>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-900 px-3 py-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Contrasena</span>
                      <span className="mt-1 block break-all font-mono text-emerald-300">{user.password}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminUsersPanel;
