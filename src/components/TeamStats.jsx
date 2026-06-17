import React, { useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const TeamStats = () => {
  const teams = useTournamentStore((s) => s.teams);
  const groupMatches = useTournamentStore((s) => s.groupMatches);
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || '');

  const team = teams.find((t) => t.id === selectedTeam);
  if (!team) return null;

  const players = team.players || [];
  const teamMatches = groupMatches.filter((m) => m.homeId === team.id || m.awayId === team.id);

  const stats = {
    totalGoals: players.reduce((sum, p) => sum + (p.goals || 0), 0),
    totalYellowCards: players.reduce((sum, p) => sum + (p.yellowCards || 0), 0),
    totalRedCards: players.reduce((sum, p) => sum + (p.redCards || 0), 0),
    matchesPlayed: teamMatches.length,
    goalsFor: teamMatches.reduce((sum, m) => {
      if (m.homeGoals === null || m.awayGoals === null) return sum;
      return sum + (m.homeId === team.id ? m.homeGoals : m.awayGoals);
    }, 0),
    goalsAgainst: teamMatches.reduce((sum, m) => {
      if (m.homeGoals === null || m.awayGoals === null) return sum;
      return sum + (m.homeId === team.id ? m.awayGoals : m.homeGoals);
    }, 0),
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Estadísticas por Equipo</h2>
        <p className="text-sm text-slate-400">Detalles y análisis de rendimiento.</p>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-semibold text-slate-200">Selecciona Equipo</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-white"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Goles Marcados</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{stats.totalGoals}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Goles en Contra</p>
          <p className="mt-2 text-3xl font-bold text-rose-400">{stats.goalsAgainst}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Tarjetas Amarillas</p>
          <p className="mt-2 text-3xl font-bold text-yellow-400">{stats.totalYellowCards}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Tarjetas Rojas</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{stats.totalRedCards}</p>
        </div>
      </div>

      {/* Players Stats */}
      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Jugadores del Equipo</h3>
        <div className="space-y-2">
          {players.length === 0 ? (
            <p className="text-sm text-slate-400">Sin jugadores.</p>
          ) : (
            players
              .sort((a, b) => (b.goals || 0) - (a.goals || 0))
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center gap-3">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-800" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-300">⚽ {p.goals || 0}</span>
                    {(p.yellowCards || 0) > 0 && (
                      <span className="rounded bg-yellow-500/20 px-2 py-1 text-yellow-300">🟨 {p.yellowCards}</span>
                    )}
                    {(p.redCards || 0) > 0 && (
                      <span className="rounded bg-red-500/20 px-2 py-1 text-red-300">🟥 {p.redCards}</span>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamStats;
