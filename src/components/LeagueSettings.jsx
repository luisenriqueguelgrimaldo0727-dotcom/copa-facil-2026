import React, { useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const LeagueSettings = () => {
  const currentTournamentId = useTournamentStore((state) => state.currentTournamentId);
  const currentUser = useTournamentStore((state) => state.currentUser);
  const users = useTournamentStore((state) => state.users || []);
  const tournaments = useTournamentStore((state) => state.tournaments || {});
  const activeTournament = tournaments[currentUser]?.find((t) => t.id === currentTournamentId);
  
  const settings = useTournamentStore((state) => state.settings || { category: 'Varonil Libre', fieldDefault: 'Campos de Saltillo', pointForWin: 3 });
  const updateSettings = useTournamentStore((state) => state.updateSettings);
  const createManagedUser = useTournamentStore((state) => state.createManagedUser);
  const currentUserRecord = users.find((user) => user.username === currentUser);
  const isAdmin = currentUserRecord?.role === 'admin';

  const [name, setName] = useState(activeTournament?.name || 'Mi Liga');
  const [category, setCategory] = useState(settings.category || 'Varonil Libre');
  const [fieldDefault, setFieldDefault] = useState(settings.fieldDefault || 'Campos de Saltillo');
  const [pointForWin, setPointForWin] = useState(settings.pointForWin || 3);
  const [tournamentFormat, setTournamentFormat] = useState(settings.tournamentFormat || 'ligaMx');
  const [groupCount, setGroupCount] = useState(settings.groupCount || 4);
  const [status, setStatus] = useState(null);
  const [personName, setPersonName] = useState('');
  const [userStatus, setUserStatus] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setStatus({ type: 'error', text: 'El nombre de la liga es obligatorio.' });
      return;
    }

    updateSettings({
      name: name.trim(),
      category,
      fieldDefault: fieldDefault.trim(),
      pointForWin: Number(pointForWin),
      tournamentFormat,
      groupCount: Number(groupCount),
    });

    setStatus({ type: 'success', text: '¡Configuraciones guardadas y aplicadas con éxito!' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleCreateManagedUser = (event) => {
    event.preventDefault();
    const result = createManagedUser(personName);
    setUserStatus({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setGeneratedCredentials(result.credentials);
      setPersonName('');
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/60">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Configuraciones</p>
          <h2 className="text-3xl font-extrabold text-white">Ajustes del Torneo</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Modifica el nombre, categoría, campos de juego locales en Saltillo y reglas de puntuación para esta liga en específico.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-inner shadow-slate-950/20">
          <h3 className="text-lg font-bold text-white">Personalizar Información de la Liga</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Nombre de la Liga</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Ej. Liga Premier Saltillo"
                  required
                />
              </label>
            </div>

            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Categoría</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="Varonil Libre">Varonil Libre</option>
                  <option value="Femenil Libre">Femenil Libre</option>
                  <option value="Mixto Libre">Mixto Libre</option>
                  <option value="Veteranos">Veteranos (+35)</option>
                  <option value="Infantil / Juvenil">Infantil / Juvenil</option>
                  <option value="Empresarial / Maquila">Empresarial / Maquila</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4">
            <span className="mb-3 block text-sm font-semibold text-slate-300">Formato deportivo</span>
            <div className="grid gap-2">
              {[
                { id: 'long', title: 'Torneo largo', desc: 'Un solo campeon por tabla general.' },
                { id: 'ligaMx', title: 'Formato Liga MX', desc: 'Tabla general con liguilla.' },
                { id: 'worldCup', title: 'Mundial por grupos', desc: 'Equipos divididos por grupos.' },
              ].map((format) => (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => setTournamentFormat(format.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    tournamentFormat === format.id
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="block text-sm font-bold">{format.title}</span>
                  <span className="mt-1 block text-xs text-slate-400">{format.desc}</span>
                </button>
              ))}
            </div>

            {tournamentFormat === 'worldCup' && (
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Cantidad de grupos</span>
                <input
                  type="number"
                  min="2"
                  max="64"
                  value={groupCount}
                  onChange={(event) => setGroupCount(Number(event.target.value))}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
                <span className="mt-2 block text-[10px] text-slate-500">Puedes capturar 2, 3, 4, 5, 6, 7, 8, 9, 10 o más grupos.</span>
              </label>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Sede Principal (Campos en Saltillo)</span>
                <input
                  type="text"
                  value={fieldDefault}
                  onChange={(event) => setFieldDefault(event.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Ej. Deportivo Rancho Seco"
                />
              </label>
            </div>

            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">Puntos por Victoria</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={pointForWin}
                  onChange={(event) => setPointForWin(Number(event.target.value))}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </label>
            </div>
          </div>

          {status && (
            <div
              className={`rounded-3xl px-5 py-4 text-sm font-medium ${
                status.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'
              }`}
            >
              {status.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-3xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
            >
              Guardar Configuraciones
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {isAdmin && (
            <div className="rounded-[1.75rem] border border-sky-500/30 bg-slate-900/80 p-6 shadow-inner ring-1 ring-sky-500/10">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Administrador</p>
              <h3 className="mt-2 text-lg font-bold text-white">Crear usuarios automaticos</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Escribe el nombre de la persona y Copa Facil generara su usuario, contrasena y una liga inicial.
              </p>

              <form onSubmit={handleCreateManagedUser} className="mt-5 space-y-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Nombre de la persona</span>
                  <input
                    type="text"
                    value={personName}
                    onChange={(event) => setPersonName(event.target.value)}
                    className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Ej. Juan Perez"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Generar usuario y contrasena
                </button>
              </form>

              {userStatus && (
                <div
                  className={`mt-4 rounded-3xl px-4 py-3 text-sm font-medium ${
                    userStatus.type === 'success'
                      ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'
                  }`}
                >
                  {userStatus.text}
                </div>
              )}

              {generatedCredentials && (
                <div className="mt-4 rounded-3xl border border-slate-700 bg-slate-950 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Acceso generado</p>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Nombre:</span>
                      <span className="font-semibold text-white">{generatedCredentials.fullName}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Usuario:</span>
                      <span className="font-mono font-semibold text-sky-300">{generatedCredentials.username}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Contrasena:</span>
                      <span className="font-mono font-semibold text-emerald-300">{generatedCredentials.password}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Usuarios registrados</p>
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {users.map((user) => (
                    <div key={user.username} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{user.fullName || user.username}</p>
                          <p className="font-mono text-xs text-slate-400">{user.username}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-sky-500/15 text-sky-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/60 p-6 shadow-inner ring-1 ring-slate-800">
            <h3 className="text-lg font-bold text-sky-300">💡 Guía de Venta para Saltillo</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              ¿Quieres vender esta aplicación a otras ligas en Saltillo? Sigue estos consejos para comercializarla con éxito:
            </p>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-400">
              <li className="flex gap-2">
                <span className="text-sky-400 font-bold">1.</span>
                <span>
                  <strong>Monetización Local:</strong> Destaca el módulo de <strong>Patrocinadores</strong>. Los presidentes de ligas pueden vender banners publicitarios a refaccionarias, taquerías o gimnasios locales y recuperar su inversión en días.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-sky-400 font-bold">2.</span>
                <span>
                  <strong>Vista Pública Limpia:</strong> Muéstrales cómo el "Modo Vista Pública" permite proyectar los resultados y tablas en pantallas gigantes en los campos los fines de semana o compartir capturas perfectas en Facebook.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-sky-400 font-bold">3.</span>
                <span>
                  <strong>Múltiples Torneos:</strong> Explícales que pueden gestionar la Categoría Libre los sábados, la de Veteranos los domingos y una Infantil en la semana, todo bajo la misma cuenta y de forma totalmente independiente.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/40 p-6 shadow-inner">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Detalles Técnicos</h4>
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-800 py-2">
                <span>Liga ID:</span>
                <span className="font-mono text-slate-300">{currentTournamentId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 py-2">
                <span>Administrador:</span>
                <span className="text-slate-300">{currentUser}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 py-2">
                <span>Sede actual:</span>
                <span className="text-slate-300">{fieldDefault}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Puntos por Victoria:</span>
                <span className="text-slate-300 font-semibold">{pointForWin} PTS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueSettings;
