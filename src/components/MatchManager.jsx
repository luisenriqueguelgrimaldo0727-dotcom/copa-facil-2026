import React, { useEffect, useMemo, useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const MatchManager = () => {
  const teams = useTournamentStore((state) => state.teams);
  const groupMatches = useTournamentStore((state) => state.groupMatches);
  const knockoutMatches = useTournamentStore((state) => state.knockoutMatches);
  const updateMatchScore = useTournamentStore((state) => state.updateMatchScore);
  const resetMatches = useTournamentStore((state) => state.resetMatches);
  const matches = [...groupMatches, ...knockoutMatches];
  const [filter, setFilter] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [status, setStatus] = useState(null);

  const getTeamName = (teamId) => teams.find((team) => team.id === teamId)?.name || 'Equipo';
  const getTeamLogo = (teamId) => teams.find((team) => team.id === teamId)?.logo || '';
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

  const playedMatches = matches.filter(
    (match) => match.homeGoals !== null && match.awayGoals !== null
  );

  const getMatchLabel = (match) => {
    const home = getTeamName(match.homeId);
    const away = getTeamName(match.awayId);
    if (match.stage === 'Grupo') {
      return `Grupo R${match.round}: ${home} vs ${away}`;
    }
    if (match.knockoutFormat === 'single') {
      return `${match.stage} Partido unico: ${home} vs ${away}`;
    }
    const legLabel = match.leg === 1 ? 'Ida' : 'Vuelta';
    return `${match.stage} ${legLabel}: ${home} vs ${away}`;
  };

  const filteredMatches = useMemo(() => {
    if (!filter.trim()) return matches;
    return matches.filter((match) => {
      const label = getMatchLabel(match).toLowerCase();
      return label.includes(filter.trim().toLowerCase());
    });
  }, [filter, matches]);

  const selectedMatch = filteredMatches.find((match) => match.id === selectedMatchId) || filteredMatches[0] || matches[0];

  useEffect(() => {
    if ((!selectedMatchId || !selectedMatch) && filteredMatches.length) {
      setSelectedMatchId(filteredMatches[0].id);
    }
  }, [filteredMatches, selectedMatchId, selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) return;
    setHomeGoals(selectedMatch.homeGoals !== null ? String(selectedMatch.homeGoals) : '');
    setAwayGoals(selectedMatch.awayGoals !== null ? String(selectedMatch.awayGoals) : '');
  }, [selectedMatch]);

  const handleMatchChange = (event) => {
    const matchId = event.target.value;
    setSelectedMatchId(matchId);
    const match = matches.find((matchItem) => matchItem.id === matchId);
    if (match) {
      setHomeGoals(match.homeGoals !== null ? String(match.homeGoals) : '');
      setAwayGoals(match.awayGoals !== null ? String(match.awayGoals) : '');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedMatch) return;

    const parsedHomeGoals = Number(homeGoals);
    const parsedAwayGoals = Number(awayGoals);

    if (homeGoals === '' || awayGoals === '') {
      setStatus({ type: 'error', text: 'Ingresa los goles de ambos equipos.' });
      return;
    }

    if (Number.isNaN(parsedHomeGoals) || Number.isNaN(parsedAwayGoals)) {
      setStatus({ type: 'error', text: 'Los goles deben ser un número válido.' });
      return;
    }

    if (parsedHomeGoals < 0 || parsedAwayGoals < 0) {
      setStatus({ type: 'error', text: 'Los goles no pueden ser negativos.' });
      return;
    }

    updateMatchScore(selectedMatch.id, parsedHomeGoals, parsedAwayGoals);
    setStatus({
      type: 'success',
      text: `Resultado guardado: ${getTeamName(selectedMatch.homeId)} ${parsedHomeGoals} - ${parsedAwayGoals} ${getTeamName(selectedMatch.awayId)}`,
    });
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/60">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Resultados</p>
          <h2 className="text-3xl font-extrabold text-white">Gestor de partidos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Registra resultados, actualiza marcadores y controla cada partido con estilo profesional.</p>
        </div>
        <div className="rounded-3xl bg-slate-900/90 px-5 py-4 text-right shadow-inner shadow-slate-950/30">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Partidos disponibles</p>
          <p className="mt-2 text-2xl font-semibold text-white">{matches.length}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-5 shadow-inner shadow-slate-950/20">
          <label className="mb-2 block text-sm font-semibold text-slate-300" htmlFor="match-filter">
            Buscar partido o equipo
          </label>
          <input
            id="match-filter"
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Ej. Morelos Soccer, Grupo R1, Semifinal"
            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
          <p className="mt-2 text-xs text-slate-500">Resultados encontrados: {filteredMatches.length}</p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-5 shadow-inner shadow-slate-950/20">
          <label className="mb-2 block text-sm font-semibold text-slate-300" htmlFor="match-select">
            Selecciona un partido
          </label>
          <select
            id="match-select"
            value={selectedMatchId}
            onChange={handleMatchChange}
            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          >
            {filteredMatches.length === 0 ? (
              <option value="" disabled>
                No se encontraron partidos
              </option>
            ) : (
              filteredMatches.map((match) => (
                <option key={match.id} value={match.id} className="bg-slate-950 text-slate-100">
                  {getMatchLabel(match)}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedMatch && (
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-5 text-sm text-slate-300 shadow-inner shadow-slate-950/20">
            <p className="font-semibold text-slate-100">Resultado actual</p>
            <div className="mt-2 flex flex-col gap-3 text-base font-medium text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {getTeamLogo(selectedMatch.homeId) ? (
                  <img src={getTeamLogo(selectedMatch.homeId)} alt={getTeamName(selectedMatch.homeId)} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-700" />
                )}
                <span>{getTeamName(selectedMatch.homeId)}</span>
              </div>
              <span className="text-slate-300">{selectedMatch.homeGoals !== null ? selectedMatch.homeGoals : '-'} - {selectedMatch.awayGoals !== null ? selectedMatch.awayGoals : '-'}</span>
              <div className="flex items-center gap-3">
                {getTeamLogo(selectedMatch.awayId) ? (
                  <img src={getTeamLogo(selectedMatch.awayId)} alt={getTeamName(selectedMatch.awayId)} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-700" />
                )}
                <span>{getTeamName(selectedMatch.awayId)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block rounded-[1.5rem] border border-slate-800 bg-slate-900/90 p-4 text-slate-300 shadow-inner shadow-slate-950/10">
            <div className="mb-2 flex items-center gap-2">
              {getTeamLogo(selectedMatch?.homeId) ? (
                <img src={getTeamLogo(selectedMatch?.homeId)} alt={getTeamName(selectedMatch?.homeId)} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-slate-700" />
              )}
              <span className="text-sm font-medium text-slate-300">Goles {getTeamName(selectedMatch?.homeId)}</span>
            </div>
            <input
              type="number"
              min="0"
              value={homeGoals}
              onChange={(event) => setHomeGoals(event.target.value)}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="block rounded-[1.5rem] border border-slate-800 bg-slate-900/90 p-4 text-slate-300 shadow-inner shadow-slate-950/10">
            <div className="mb-2 flex items-center gap-2">
              {getTeamLogo(selectedMatch?.awayId) ? (
                <img src={getTeamLogo(selectedMatch?.awayId)} alt={getTeamName(selectedMatch?.awayId)} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-slate-700" />
              )}
              <span className="text-sm font-medium text-slate-300">Goles {getTeamName(selectedMatch?.awayId)}</span>
            </div>
            <input
              type="number"
              min="0"
              value={awayGoals}
              onChange={(event) => setAwayGoals(event.target.value)}
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>
        </div>

        {status && (
          <div
            className={`rounded-3xl px-4 py-3 text-sm font-medium ${
              status.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
          >
            Guardar resultado
          </button>
          <button
            type="button"
            onClick={() => {
              resetMatches();
              setHomeGoals('');
              setAwayGoals('');
              setStatus({ type: 'success', text: 'Se resetearon los resultados del torneo.' });
            }}
            className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Resetear resultados
          </button>
        </div>
      </form>

      <section className="mt-8 border-t border-slate-800 pt-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-300">Historial oficial</p>
            <h3 className="mt-2 text-2xl font-black text-white">Partidos jugados</h3>
            <p className="mt-1 text-sm text-slate-400">Marcadores, goleadores y tarjetas registrados.</p>
          </div>
          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-black text-sky-300">{playedMatches.length}</span>
        </div>

        {playedMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
            Los partidos apareceran aqui cuando guardes sus resultados.
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
                    {match.stage === 'Grupo' ? `Jornada ${match.round || 1}` : getMatchLabel(match).split(':')[0]}
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
      </section>
    </div>
  );
};

export default MatchManager;
