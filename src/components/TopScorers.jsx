import React from 'react';
import useTournamentStore from '../store/useTournamentStore';

const TopScorers = () => {
  const teams = useTournamentStore((s) => s.teams);

  const players = teams.flatMap((t) => (t.players || []).map((p) => ({ ...p, teamName: t.name, teamLogo: t.logo })));
  const sorted = players.sort((a, b) => (b.goals || 0) - (a.goals || 0));

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Tabla de Goleadores</h2>
        <p className="text-sm text-slate-400">Máximos goleadores del torneo.</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400">No hay datos de goleadores todavía.</p>
      ) : (
        <div className="mobile-horizontal-scroll rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <table className="min-w-[520px] w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Jugador</th>
                <th className="text-left py-2">Equipo</th>
                <th className="text-right py-2">Goles</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} className={`border-t border-slate-800 ${i < 3 ? 'bg-slate-900/30' : ''}`}>
                  <td className="py-2 text-slate-200">{i + 1}</td>
                    <td className="py-2 text-slate-200 flex items-center gap-2">
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-slate-800" />
                      )}
                      {p.name}
                    </td>
                    <td className="py-2 text-slate-300 flex items-center gap-2">{p.teamLogo ? <img src={p.teamLogo} alt={p.teamName} className="h-5 w-5 rounded-full object-cover" /> : <div className="h-5 w-5 rounded-full bg-slate-800" />}{p.teamName}</td>
                  <td className="py-2 text-right text-white">{p.goals || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopScorers;
