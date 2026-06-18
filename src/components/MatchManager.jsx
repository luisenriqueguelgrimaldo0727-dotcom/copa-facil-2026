import React, { useEffect, useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const MatchManager = () => {
  const teams = useTournamentStore((state) => state.teams || []);
  const groupMatches = useTournamentStore((state) => state.groupMatches || []);
  const knockoutMatches = useTournamentStore((state) => state.knockoutMatches || []);
  const recordPlayerGoals = useTournamentStore((state) => state.recordPlayerGoals);
  const recordMatchCards = useTournamentStore((state) => state.recordMatchCards);
  const matches = [...groupMatches, ...knockoutMatches];
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [scorerCounts, setScorerCounts] = useState({});
  const [cardState, setCardState] = useState({});
  const [status, setStatus] = useState(null);

  const selectedMatch = matches.find((match) => match.id === selectedMatchId) || matches[0];
  const playedMatches = matches.filter((match) => match.homeGoals !== null && match.awayGoals !== null);
  const getTeam = (teamId) => teams.find((team) => team.id === teamId);
  const getTeamName = (teamId) => getTeam(teamId)?.name || 'Equipo';
  const getTeamLogo = (teamId) => getTeam(teamId)?.logo || '';
  const getPlayers = (teamId) => getTeam(teamId)?.players || [];
  const getPlayerName = (playerId) => teams.flatMap((team) => team.players || []).find((player) => player.id === playerId)?.name || 'Jugador no identificado';

  const getStageLabel = (match) => {
    if (match.stage === 'Grupo') return `Jornada ${match.round || 1}`;
    if (match.knockoutFormat === 'single') return `${match.stage} - Partido unico`;
    return `${match.stage} - ${match.leg === 1 ? 'Ida' : 'Vuelta'}`;
  };

  useEffect(() => {
    if (!selectedMatch) return;
    setSelectedMatchId(selectedMatch.id);
    setHomeGoals(selectedMatch.homeGoals ?? '');
    setAwayGoals(selectedMatch.awayGoals ?? '');

    const counts = {};
    [...(selectedMatch.playerScorers?.home || []), ...(selectedMatch.playerScorers?.away || [])].forEach((playerId) => {
      counts[playerId] = (counts[playerId] || 0) + 1;
    });
    setScorerCounts(counts);

    const cards = {};
    (selectedMatch.cards || []).forEach((card) => {
      cards[`${card.playerId}-${card.type}`] = true;
    });
    setCardState(cards);
    setStatus(null);
  }, [selectedMatch?.id]);

  const createScorerList = (teamId) => getPlayers(teamId).flatMap((player) =>
    Array.from({ length: Number(scorerCounts[player.id]) || 0 }, () => player.id)
  );

  const handleSave = () => {
    const homeScore = Number(homeGoals);
    const awayScore = Number(awayGoals);
    if (!selectedMatch || homeGoals === '' || awayGoals === '' || homeScore < 0 || awayScore < 0) {
      setStatus({ type: 'error', text: 'Captura un marcador valido para ambos equipos.' });
      return;
    }

    const homeScorers = createScorerList(selectedMatch.homeId);
    const awayScorers = createScorerList(selectedMatch.awayId);
    if (homeScorers.length > homeScore || awayScorers.length > awayScore) {
      setStatus({ type: 'error', text: 'Los goles asignados a jugadores no pueden superar el marcador.' });
      return;
    }

    const cards = Object.entries(cardState)
      .filter(([, checked]) => checked)
      .map(([key]) => {
        const separator = key.lastIndexOf('-');
        return { playerId: key.slice(0, separator), type: key.slice(separator + 1) };
      });

    recordPlayerGoals(selectedMatch.id, homeScore, awayScore, homeScorers, awayScorers);
    recordMatchCards(selectedMatch.id, cards);
    setStatus({ type: 'success', text: 'Resultado, goleadores y tarjetas guardados.' });
  };

  const summarizeScorers = (match) => {
    const totals = [...(match.playerScorers?.home || []), ...(match.playerScorers?.away || [])].reduce((result, playerId) => {
      result[playerId] = (result[playerId] || 0) + 1;
      return result;
    }, {});
    return Object.entries(totals).map(([playerId, goals]) => ({ playerId, goals }));
  };

  const renderTeamEditor = (teamId, score) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="mb-3 flex items-center gap-2">
        {getTeamLogo(teamId) ? <img src={getTeamLogo(teamId)} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="h-8 w-8 rounded-lg bg-slate-800" />}
        <p className="min-w-0 break-words text-sm font-black text-white">{getTeamName(teamId)}</p>
      </div>
      {getPlayers(teamId).length === 0 ? (
        <p className="text-xs text-slate-600">Agrega jugadores para asignar goles y tarjetas.</p>
      ) : (
        <div className="space-y-2">
          {getPlayers(teamId).map((player) => (
            <div key={player.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl bg-slate-900 px-3 py-2">
              <span className="min-w-0 break-words text-xs font-semibold text-slate-200">{player.name}</span>
              <label className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500">
                Gol
                <input
                  type="number"
                  min="0"
                  max={Number(score) || 0}
                  value={scorerCounts[player.id] || 0}
                  onChange={(event) => setScorerCounts((current) => ({ ...current, [player.id]: Number(event.target.value) || 0 }))}
                  className="h-9 w-11 rounded-lg border border-slate-700 bg-slate-950 text-center text-xs font-black text-white"
                />
              </label>
              <div className="flex gap-1">
                {['yellow', 'red'].map((type) => {
                  const key = `${player.id}-${type}`;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCardState((current) => ({ ...current, [key]: !current[key] }))}
                      className={`h-9 w-9 rounded-lg border text-sm ${cardState[key] ? 'border-sky-400 bg-sky-500/20' : 'border-slate-700 bg-slate-950 opacity-50'}`}
                      title={type === 'yellow' ? 'Tarjeta amarilla' : 'Tarjeta roja'}
                    >
                      {type === 'yellow' ? '🟨' : '🟥'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (matches.length === 0) {
    return <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">No hay partidos generados.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-300">Captura oficial</p>
        <h2 className="mt-2 text-2xl font-black text-white">Editar resultados</h2>
        <p className="mt-1 text-sm text-slate-400">Modifica el marcador, asigna goleadores y registra tarjetas.</p>

        <select value={selectedMatch?.id || ''} onChange={(event) => setSelectedMatchId(event.target.value)} className="mt-5 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white">
          {matches.map((match) => <option key={match.id} value={match.id}>{getStageLabel(match)}: {getTeamName(match.homeId)} vs {getTeamName(match.awayId)}</option>)}
        </select>

        {selectedMatch && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-center"><p className="text-xs font-bold text-white">{getTeamName(selectedMatch.homeId)}</p><input type="number" min="0" value={homeGoals} onChange={(event) => setHomeGoals(event.target.value)} className="mt-2 w-16 rounded-xl bg-slate-950 px-2 py-2 text-center text-xl font-black text-sky-300" /></div>
              <span className="font-black text-slate-500">-</span>
              <div className="text-center"><p className="text-xs font-bold text-white">{getTeamName(selectedMatch.awayId)}</p><input type="number" min="0" value={awayGoals} onChange={(event) => setAwayGoals(event.target.value)} className="mt-2 w-16 rounded-xl bg-slate-950 px-2 py-2 text-center text-xl font-black text-sky-300" /></div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {renderTeamEditor(selectedMatch.homeId, homeGoals)}
              {renderTeamEditor(selectedMatch.awayId, awayGoals)}
            </div>

            {status && <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${status.type === 'success' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>{status.text}</div>}
            <button type="button" onClick={handleSave} className="w-full rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-slate-950">Guardar resultado completo</button>
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-4 sm:rounded-[2rem] sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-sky-300">Historial oficial</p><h3 className="mt-2 text-2xl font-black text-white">Partidos jugados</h3></div><span className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-black text-sky-300">{playedMatches.length}</span></div>
        <div className="space-y-3">
          {playedMatches.map((match) => {
            const scorers = summarizeScorers(match);
            return (
              <article key={match.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{getStageLabel(match)}</p>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center"><p className="text-xs font-bold text-white">{getTeamName(match.homeId)}</p><span className="rounded-xl bg-slate-950 px-3 py-2 text-lg font-black text-sky-300">{match.homeGoals} - {match.awayGoals}</span><p className="text-xs font-bold text-white">{getTeamName(match.awayId)}</p></div>
                <div className="mt-3 grid gap-2 border-t border-slate-800 pt-3 text-xs text-slate-300 sm:grid-cols-2">
                  <div><span className="font-black text-slate-500">Goleadores: </span>{scorers.length ? scorers.map((item) => `${getPlayerName(item.playerId)}${item.goals > 1 ? ` (${item.goals})` : ''}`).join(', ') : 'Sin asignar'}</div>
                  <div><span className="font-black text-slate-500">Tarjetas: </span>{match.cards?.length ? match.cards.map((card) => `${card.type === 'red' ? '🟥' : '🟨'} ${getPlayerName(card.playerId)}`).join(', ') : 'Sin tarjetas'}</div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MatchManager;
