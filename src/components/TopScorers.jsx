import React from 'react';
import useTournamentStore from '../store/useTournamentStore';

const TopScorers = () => {
  const teams = useTournamentStore((s) => s.teams);

  const players = teams.flatMap((t) => (t.players || []).map((p) => ({ ...p, teamName: t.name, teamLogo: t.logo })));
  const sorted = players.sort((a, b) => (b.goals || 0) - (a.goals || 0));

  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Tabla de Goleadores</h2>
        <p className="text-sm text-slate-400">Máximos goleadores del torneo.</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400">No hay datos de goleadores todavía.</p>
      ) : (
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          {sorted.map((player, index) => (
            <div
              key={player.id}
              className={`flex min-h-[64px] min-w-0 items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                index < 3
                  ? 'border-sky-500/20 bg-sky-950/20'
                  : 'border-slate-800 bg-slate-950/80'
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                index === 0
                  ? 'bg-amber-300 text-slate-950'
                  : index === 1
                    ? 'bg-slate-300 text-slate-950'
                    : index === 2
                      ? 'bg-orange-300 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
              }`}>
                {index + 1}
              </span>

              {player.teamLogo ? (
                <img
                  src={player.teamLogo}
                  alt={player.teamName}
                  className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-700"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg ring-1 ring-slate-700">⚽</span>
              )}

              <span className="min-w-0 flex-1 truncate text-sm font-black uppercase tracking-wide text-white sm:text-base">
                {player.name}
              </span>

              <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-sky-500 px-3 py-2 text-sm font-black text-slate-950">
                ⚽ {player.goals || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopScorers;
