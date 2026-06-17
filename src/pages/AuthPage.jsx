import React, { useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const AuthPage = () => {
  const loginUser = useTournamentStore((state) => state.loginUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = loginUser(username.trim(), password.trim());
    setMessage(result.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/80 ring-1 ring-slate-700/50">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-sky-500/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.28em] text-sky-300">
            Copa Facil
          </div>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-white">
            Acceso privado
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Ingresa con una cuenta autorizada por el administrador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-sm font-semibold text-slate-300">Usuario</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              type="text"
              placeholder="Nombre de usuario"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-slate-300">Contrasena</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              type="password"
              placeholder="Contrasena"
              autoComplete="current-password"
              required
            />
          </label>

          {message && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3.5 text-center text-sm font-semibold text-slate-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-3xl bg-sky-500 px-5 py-4 text-sm font-bold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
          >
            Entrar al Panel
          </button>
        </form>
      </div>
    </main>
  );
};

export default AuthPage;
