import React from 'react';
import useTournamentStore from '../store/useTournamentStore';

const MatchManager = () => {
  const teams = useTournamentStore((state) => state.teams || []);
  const groupMatches = useTournamentStore((state) => state.groupMatches || []);
  const knockoutMatches = useTournamentStore((state) => state.knockoutMatches || []);
  const matches = [...groupMatches, ...knockoutMatches];
  const playedMatches = matches.filter(
    (match) => match.homeGoals !== null && match.awayGoals !== null
  );

  const getTeam = (teamId) => teams.find((team) => team.id === teamId);
  const getTeamName = (teamId) => getTeam(teamId)?.name || 'Equipo';
  const getTeamLogo = (teamId) => getTeam(teamId)?.logo || '';
  const getPlayerName = (playerId) => {
    const player = teams.flatMap((team) => team.players || []).find((item) => item.id === playerId);
    return player?.name || 'Jugador no identificado';
  };

  const summarizeScorers = (playerIds = []) => {
    const totals = playerIds.reduce((result, playerId) => {
      result[playerId] = (result[playerId] || 0) + 1;
      return result;
    }, {});
    return Object.entries(totals).map(([playerId, goals]) => ({
      playerId,
      name: getPlayerName(playerId),
      goals,
    }));
  };

  const getStageLabel = (match) => {
    if (match.stage === 'Grupo') return `Jornada ${match.round || 1}`;
    if (match.knockoutFormat === 'single') return `${match.stage} - Partido unico`;
    return `${match.stage} - ${match.leg === 1 ? 'Ida' : 'Vuelta'}`;
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/60 sm:rounded-[2rem] sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-300">Resultados oficiales</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Partidos jugados</h2>
          <p className="mt-1 text-sm text-slate-400">Marcadores, goleadores y tarjetas registrados.</p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-black text-sky-300">{playedMatches.length}</span>
      </div>

      {playedMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
          Los partidos apareceran aqui cuando guardes sus resultados desde el calendario.
        </div>
      ) : (
        <div className="space-y-4">
          {playedMatches.map((match) => {
            const scorers = summarizeScorers([
              ...(match.playerScorers?.home || []),
              ...(match.playerScorers?.away || []),
            ]);
            const cards = match.cards || [];

            return (
              <article key={match.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
                <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {getStageLabel(match)}
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5">
                  <div className="min-w-0 text-center">
                    {getTeamLogo(match.homeId) ? (
                      <img src={getTeamLogo(match.homeId)} alt="" className="mx-auto h-10 w-10 rounded-xl object-cover" />
                    ) : <div className="mx-auto h-10 w-10 rounded-xl bg-slate-800" />}
                    <p className="mt-2 break-words text-xs font-bold text-white">{getTeamName(match.homeId)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-xl font-black text-sky-300">
                    {match.homeGoals} - {match.awayGoals}
                  </div>
                  <div className="min-w-0 text-center">
                    {getTeamLogo(match.awayId) ? (
                      <img src={getTeamLogo(match.awayId)} alt="" className="mx-auto h-10 w-10 rounded-xl object-cover" />
                    ) : <div className="mx-auto h-10 w-10 rounded-xl bg-slate-800" />}
                    <p className="mt-2 break-words text-xs font-bold text-white">{getTeamName(match.awayId)}</p>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-slate-800 p-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-950/70 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Goleadores</p>
                    {scorers.length > 0 ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-200">
                        {scorers.map((scorer) => (
                          <p key={scorer.playerId}>⚽ {scorer.name}{scorer.goals > 1 ? ` (${scorer.goals})` : ''}</p>
                        ))}
                      </div>
                    ) : <p className="mt-2 text-xs text-slate-600">Sin goleadores asignados.</p>}
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tarjetas</p>
                    {cards.length > 0 ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-200">
                        {cards.map((card, cardIndex) => (
                          <p key={`${card.playerId}-${card.type}-${cardIndex}`}>
                            {card.type === 'red' ? '🟥' : '🟨'} {getPlayerName(card.playerId)}
                          </p>
                        ))}
                      </div>
                    ) : <p className="mt-2 text-xs text-slate-600">Sin tarjetas registradas.</p>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchManager;
