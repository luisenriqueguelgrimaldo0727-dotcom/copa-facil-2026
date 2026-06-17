import React, { useEffect, useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const TeamManager = () => {
  const teams = useTournamentStore((state) => state.teams);
  const addTeam = useTournamentStore((state) => state.addTeam);
  const updateTeamName = useTournamentStore((state) => state.updateTeamName);
  const updateTeamGroup = useTournamentStore((state) => state.updateTeamGroup);
  const updateTeamLogo = useTournamentStore((state) => state.updateTeamLogo);
  const removeTeam = useTournamentStore((state) => state.removeTeam);
  const generateSchedule = useTournamentStore((state) => state.generateSchedule);
  const settings = useTournamentStore((state) => state.settings || {});
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);
  const [editNames, setEditNames] = useState(
    teams.reduce((acc, team) => ({ ...acc, [team.id]: team.name }), {})
  );
  const isWorldCup = settings.tournamentFormat === 'worldCup';
  const groupLetters = Array.from(
    { length: Math.max(2, Number(settings.groupCount) || 2) },
    (_, index) => String.fromCharCode(65 + index)
  );

  useEffect(() => {
    setEditNames(teams.reduce((acc, team) => ({ ...acc, [team.id]: team.name }), {}));
  }, [teams]);

  const handleAddTeam = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setStatus({ type: 'error', text: 'El nombre del equipo no puede estar vacío.' });
      return;
    }

    if (teams.some((team) => team.name.toLowerCase() === trimmedName.toLowerCase())) {
      setStatus({ type: 'error', text: 'Ya existe un equipo con ese nombre.' });
      return;
    }

    addTeam(trimmedName);
    setName('');
    setStatus({ type: 'success', text: `Equipo '${trimmedName}' agregado.` });
  };

  const handleUpdateTeam = (teamId) => {
    const trimmedName = editNames[teamId].trim();
    if (!trimmedName) {
      setStatus({ type: 'error', text: 'El nombre del equipo no puede estar vacío.' });
      return;
    }

    const duplicate = teams.some(
      (team) => team.id !== teamId && team.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      setStatus({ type: 'error', text: 'Ya existe un equipo con ese nombre.' });
      return;
    }

    updateTeamName(teamId, trimmedName);
    setStatus({ type: 'success', text: `Equipo actualizado a '${trimmedName}'.` });
  };

  const handleTeamLogoUpload = (teamId, file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result && typeof result === 'string') {
        updateTeamLogo(teamId, result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/60">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Equipos</p>
          <h2 className="text-3xl font-extrabold text-white">Gestión de plantillas</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Agrega, edita y organiza los equipos del torneo con un estilo inspirado en paneles de liga profesional.</p>
        </div>
        <div className="rounded-3xl bg-slate-900/90 px-5 py-4 text-right shadow-inner shadow-slate-950/30">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Total de equipos</p>
          <p className="mt-2 text-2xl font-semibold text-white">{teams.length}</p>
        </div>
      </div>

      <form onSubmit={handleAddTeam} className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-5 shadow-inner shadow-slate-950/20">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-300">Nuevo equipo</span>
            <input
              id="team-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Nombre del equipo"
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-3xl bg-sky-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
          >
            Agregar equipo
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={() => {
            if (teams.length < 2) {
              setStatus({ type: 'error', text: 'Se necesitan al menos 2 equipos para generar el calendario.' });
              return;
            }
            generateSchedule();
            setStatus({ type: 'success', text: 'Se generó el calendario de partidos automáticamente.' });
          }}
          className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Generar calendario
        </button>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 px-5 py-4 text-right shadow-inner shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Cantidad de equipos</p>
          <p className="mt-2 text-2xl font-semibold text-white">{teams.length}</p>
        </div>
      </div>

      {isWorldCup && (
        <div className="mt-6 rounded-[1.75rem] border border-sky-500/20 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Mundial por grupos</p>
          <h3 className="mt-2 text-lg font-bold text-white">Asigna cada equipo a su grupo</h3>
          <p className="mt-2 text-sm text-slate-400">
            El calendario se generara usando estos grupos. Puedes cambiar equipos de grupo antes de generar o regenerar el calendario.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <label key={team.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <span className="mb-2 block text-sm font-semibold text-white">{team.name}</span>
                <select
                  value={team.group || ''}
                  onChange={(event) => {
                    updateTeamGroup(team.id, event.target.value);
                    setStatus({ type: 'success', text: `${team.name} asignado al Grupo ${event.target.value}.` });
                  }}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                >
                  <option value="">Auto</option>
                  {groupLetters.map((letter) => (
                    <option key={letter} value={letter}>Grupo {letter}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      {status && (
        <div
          className={`mt-6 rounded-3xl px-5 py-4 text-sm font-medium ${
            status.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-5 shadow-inner shadow-slate-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {team.logo ? (
                  <img src={team.logo} alt={`${team.name} logo`} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-700" />
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Equipo {team.id.toUpperCase()}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{team.name}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleUpdateTeam(team.id)}
                  className="inline-flex items-center justify-center rounded-3xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeTeam(team.id);
                    setStatus({ type: 'success', text: `Equipo '${team.name}' eliminado.` });
                  }}
                  className="inline-flex items-center justify-center rounded-3xl border border-rose-500 bg-slate-950 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={editNames[team.id] ?? team.name}
                onChange={(event) =>
                  setEditNames((current) => ({ ...current, [team.id]: event.target.value }))
                }
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              <label className="flex cursor-pointer items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-4 text-sm text-slate-200 transition hover:bg-slate-800">
                Subir logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleTeamLogoUpload(team.id, file);
                    event.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamManager;
