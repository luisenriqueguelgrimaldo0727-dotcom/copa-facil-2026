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
    </div>
  );
};

export default MatchManager;
