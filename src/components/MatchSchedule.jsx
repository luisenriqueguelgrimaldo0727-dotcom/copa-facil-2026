import React, { useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const MatchSchedule = ({ readOnly = false }) => {
  const teams = useTournamentStore((state) => state.teams);
  const groupMatches = useTournamentStore((state) => state.groupMatches);
  const recordPlayerGoals = useTournamentStore((state) => state.recordPlayerGoals);
  const recordMatchCards = useTournamentStore((state) => state.recordMatchCards);
  const applyManualRoundFixtures = useTournamentStore((state) => state.applyManualRoundFixtures);
  const [activeRound, setActiveRound] = useState(1);
  const [tempScores, setTempScores] = useState({});
  const [selectedScorers, setSelectedScorers] = useState({});
  const [selectedCards, setSelectedCards] = useState({});
  const [fixtureMessage, setFixtureMessage] = useState(null);

  const firstRoundFixtures = [
    { home: 'Inglaterra', away: 'Francia' },
    { home: 'Cabo Verde', away: 'España' },
    { home: 'Colombia', away: 'Haiti' },
    { home: 'Alemania', away: 'Argentina' },
    { home: 'Mexico', away: 'RD Congo' },
    { home: 'Portugal', away: 'Brasil' },
  ];

  const getTeamName = (teamId) => teams.find((team) => team.id === teamId)?.name || 'Equipo';
  const getTeamLogo = (teamId) => teams.find((team) => team.id === teamId)?.logo || '';
  const getTeamPlayers = (teamId) => teams.find((team) => team.id === teamId)?.players || [];

  const rounds = groupMatches.reduce((acc, match) => {
    const round = match.round ?? 1;
    acc[round] = acc[round] || [];
    acc[round].push(match);
    return acc;
  }, {});

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  const getScorers = (match, isHome, limit = Infinity) => {
    const side = isHome ? 'home' : 'away';
    const key = `${match.id}-${side}`;
    const savedScorers = match.playerScorers?.[side] || [];
    return (selectedScorers[key] ?? savedScorers).slice(0, limit);
  };

  const handleSaveResult = (match, homeGoals, awayGoals) => {
    const homeVal = parseInt(homeGoals) || 0;
    const awayVal = parseInt(awayGoals) || 0;
    const homeScorers = getScorers(match, true, homeVal);
    const awayScorers = getScorers(match, false, awayVal);
    recordPlayerGoals(match.id, homeVal, awayVal, homeScorers, awayScorers);
  };

  const setScorerGoalCount = (match, isHome, playerId, nextCount, goalTotal) => {
    const side = isHome ? 'home' : 'away';
    const key = `${match.id}-${side}`;
    setSelectedScorers((prev) => {
      const current = prev[key] ?? (match.playerScorers?.[side] || []);
      const otherScorers = current.filter((id) => id !== playerId);
      const availableGoals = Math.max(0, goalTotal - otherScorers.length);
      const safeCount = Math.max(0, Math.min(nextCount, availableGoals));
      return {
        ...prev,
        [key]: [...otherScorers, ...Array.from({ length: safeCount }, () => playerId)],
      };
    });
  };

  const getScorerGoalCount = (match, isHome, playerId, goalTotal) =>
    getScorers(match, isHome, goalTotal).filter((id) => id === playerId).length;

  const handleSaveScorers = (match) => {
    const homeVal = match.homeGoals ?? 0;
    const awayVal = match.awayGoals ?? 0;
    const homeScorers = getScorers(match, true, homeVal);
    const awayScorers = getScorers(match, false, awayVal);
    recordPlayerGoals(match.id, homeVal, awayVal, homeScorers, awayScorers);
  };

  const renderScorerControls = (match, isHome, goalTotal) => {
    const teamId = isHome ? match.homeId : match.awayId;
    const players = getTeamPlayers(teamId);
    const selected = getSelectedScorers(match, isHome, goalTotal);
    const assigned = selected.length;

    if (players.length === 0) {
      return <p className="text-xs text-slate-500">Sin jugadores</p>;
    }

    if (goalTotal === 0) {
      return <p className="text-xs text-slate-500">Sin goles registrados</p>;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs">
          <span className={assigned === goalTotal ? 'text-emerald-300' : 'text-amber-300'}>
            Asignados {assigned}/{goalTotal}
          </span>
          <button
            type="button"
            onClick={() => setSelectedScorers((prev) => ({ ...prev, [`${match.id}-${isHome ? 'home' : 'away'}`]: [] }))}
            className="rounded-lg px-2 py-1 font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Limpiar
          </button>
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {players.map((player) => {
            const count = getScorerGoalCount(match, isHome, player.id, goalTotal);
            const canAdd = assigned < goalTotal;
            return (
              <div
                key={player.id}
                className={`grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border px-3 py-2 text-xs ${
                  count > 0
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/50'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-100">{player.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {count === 1 ? '1 gol' : `${count} goles`}
                  </div>
                </div>
                <div className="inline-flex h-9 items-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setScorerGoalCount(match, isHome, player.id, count - 1, goalTotal)}
                    disabled={count === 0}
                    className="h-full w-9 text-base font-black text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-700"
                    aria-label={`Quitar gol a ${player.name}`}
                  >
                    -
                  </button>
                  <span className="min-w-9 px-3 text-center text-sm font-black text-white">{count}</span>
                  <button
                    type="button"
                    onClick={() => setScorerGoalCount(match, isHome, player.id, count + 1, goalTotal)}
                    disabled={!canAdd}
                    className="h-full w-9 text-base font-black text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-700"
                    aria-label={`Agregar gol a ${player.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getSelectedScorers = (match, isHome, limit = Infinity) => {
    return getScorers(match, isHome, limit);
  };

  const cardKey = (matchId, playerId, cardType) => `${matchId}::${playerId}::${cardType}`;

  const getCardChecked = (match, playerId, cardType) => {
    const key = cardKey(match.id, playerId, cardType);
    if (Object.prototype.hasOwnProperty.call(selectedCards, key)) {
      return selectedCards[key];
    }
    return (match.cards || []).some((card) => card.playerId === playerId && card.type === cardType);
  };

  const toggleCard = (match, playerId, cardType) => {
    const key = cardKey(match.id, playerId, cardType);
    setSelectedCards((prev) => ({
      ...prev,
      [key]: !getCardChecked(match, playerId, cardType),
    }));
  };

  const handleSaveCards = (match) => {
    const matchPlayers = [
      ...getTeamPlayers(match.homeId),
      ...getTeamPlayers(match.awayId),
    ];
    const cards = [];
    matchPlayers.forEach((player) => {
      ['yellow', 'red'].forEach((type) => {
        if (getCardChecked(match, player.id, type)) {
          cards.push({ playerId: player.id, type });
        }
      });
    });
    recordMatchCards(match.id, cards);
  };

  const handleApplyFirstRoundFixtures = () => {
    const result = applyManualRoundFixtures(1, firstRoundFixtures);
    setFixtureMessage(result.message);
    if (result.success) {
      setActiveRound(1);
      setTempScores({});
      setSelectedScorers({});
      setSelectedCards({});
    }
  };

  if (groupMatches.length === 0) {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/50">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-white">Calendario de Encuentros</h2>
        </div>
        <p className="text-sm text-slate-400">No hay partidos programados. Genera el calendario desde la gestión de equipos.</p>
      </div>
    );
  }

  const currentRoundMatches = rounds[activeRound] || [];

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/50">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Calendario de Encuentros</h2>
        <p className="text-sm text-slate-400">Revisa y registra resultados de cada jornada.</p>
      </div>

      {!readOnly && (
        <div className="mb-6 rounded-[1.5rem] border border-sky-500/25 bg-sky-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-sky-200">Jornada 1 recibida</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Aplica: Inglaterra-Francia, Cabo Verde-España, Colombia-Haiti, Alemania-Argentina, Mexico-RD Congo y Portugal-Brasil.
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyFirstRoundFixtures}
              className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-400 sm:w-auto"
            >
              Aplicar Jornada 1
            </button>
          </div>
          {fixtureMessage && (
            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-semibold text-slate-200">
              {fixtureMessage}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mobile-horizontal-scroll mb-6 flex flex-nowrap gap-2 border-b border-slate-700 pb-4 sm:flex-wrap">
        {roundNumbers.map((round) => (
          <button
            key={round}
            onClick={() => setActiveRound(round)}
            className={`shrink-0 rounded-t-[1.25rem] px-4 py-2 text-sm font-semibold transition ${
              activeRound === round
                ? 'border-b-2 border-sky-500 bg-slate-800/60 text-sky-300'
                : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
            }`}
          >
            Jornada {round}
            <span className="ml-2 inline-block rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
              {rounds[round].length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {currentRoundMatches.length === 0 ? (
          <p className="text-sm text-slate-400">No hay partidos en esta jornada.</p>
        ) : (
          currentRoundMatches.map((match) => {
            const homeGoals = match.homeGoals ?? null;
            const awayGoals = match.awayGoals ?? null;
            const isCompleted = homeGoals !== null && awayGoals !== null;
            const scoreKey = `${match.id}-score`;
            const tempHome = tempScores[`${scoreKey}-home`] ?? (isCompleted ? homeGoals : '');
            const tempAway = tempScores[`${scoreKey}-away`] ?? (isCompleted ? awayGoals : '');
            const canSave = tempHome !== '' && tempAway !== '';

            return (
              <div
                key={match.id}
                className="rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
              >
                {/* Match Header with Score Input */}
                <div className="mb-4 flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid gap-3 sm:grid-cols-2 text-sm sm:text-base">
                      <div className="flex items-center gap-2">
                        {getTeamLogo(match.homeId) ? (
                          <img src={getTeamLogo(match.homeId)} alt={getTeamName(match.homeId)} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-700" />
                        )}
                        <span className="font-semibold text-white">{getTeamName(match.homeId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTeamLogo(match.awayId) ? (
                          <img src={getTeamLogo(match.awayId)} alt={getTeamName(match.awayId)} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-700" />
                        )}
                        <span className="font-semibold text-white">{getTeamName(match.awayId)}</span>
                      </div>
                    </div>
                    {readOnly ? (
                      <div className="inline-flex min-w-24 items-center justify-center rounded-full bg-slate-800/80 px-4 py-2 text-lg font-black text-white">
                        {isCompleted ? `${homeGoals} - ${awayGoals}` : 'Pendiente'}
                      </div>
                    ) : (
                    <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-800/80 px-3 py-2 sm:w-auto">
                      <input
                        type="number"
                        min="0"
                        value={tempHome}
                        onChange={(e) => setTempScores((prev) => ({ ...prev, [`${scoreKey}-home`]: e.target.value }))}
                        placeholder="0"
                        className="w-12 bg-slate-700 text-center font-bold text-white placeholder-slate-500 outline-none"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min="0"
                        value={tempAway}
                        onChange={(e) => setTempScores((prev) => ({ ...prev, [`${scoreKey}-away`]: e.target.value }))}
                        placeholder="0"
                        className="w-12 bg-slate-700 text-center font-bold text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                    )}
                  </div>

                  {/* Save Button */}
                  {!readOnly && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => {
                        handleSaveResult(match, tempHome, tempAway);
                      }}
                      disabled={!canSave}
                      className={`w-full rounded-[0.875rem] px-4 py-2 text-sm font-semibold transition sm:w-auto ${
                        canSave
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      💾 Guardar Resultado
                    </button>
                    {isCompleted && (
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300">
                        ✓ Guardado
                      </div>
                    )}
                  </div>
                  )}
                </div>

                {/* Goal Details - Player Selection */}
                {isCompleted && !readOnly && (
                  <div className="space-y-3 border-t border-slate-700 pt-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Goleadores</div>
                        <p className="mt-1 text-xs text-slate-500">Usa + y - para asignar los goles a cada jugador.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveScorers(match)}
                        className="w-full rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-sky-400 sm:w-auto"
                      >
                        Guardar goleadores
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Home team scorers */}
                      <div className="flex flex-col">
                        <label className="mb-2 text-xs font-semibold text-slate-300">{getTeamName(match.homeId)}</label>
                        {renderScorerControls(match, true, homeGoals)}
                      </div>

                      {/* Away team scorers */}
                      <div className="flex flex-col">
                        <label className="mb-2 text-xs font-semibold text-slate-300">{getTeamName(match.awayId)}</label>
                        {renderScorerControls(match, false, awayGoals)}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {getTeamName(match.homeId)}: {getSelectedScorers(match, true, homeGoals).length}/{homeGoals} | {getTeamName(match.awayId)}: {getSelectedScorers(match, false, awayGoals).length}/{awayGoals}
                    </div>
                  </div>
                )}

                {/* Cards Section */}
                {isCompleted && !readOnly && (
                  <div className="space-y-3 border-t border-slate-700 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tarjetas</div>
                      <button
                        onClick={() => handleSaveCards(match)}
                        className="text-xs rounded bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700"
                      >
                        ✓ Guardar Tarjetas
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Home team cards */}
                      <div className="flex flex-col">
                        <label className="mb-2 text-xs font-semibold text-slate-300">{getTeamName(match.homeId)}</label>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {getTeamPlayers(match.homeId).length === 0 ? (
                            <p className="text-xs text-slate-500">Sin jugadores</p>
                          ) : (
                            getTeamPlayers(match.homeId).map((p) => (
                              <div key={p.id} className="flex items-center gap-1 rounded px-2 py-1 text-xs">
                                <span className="flex-1 text-slate-200">{p.name}</span>
                                <label className="flex items-center gap-1 cursor-pointer hover:bg-slate-800 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={getCardChecked(match, p.id, 'yellow')}
                                    onChange={() => toggleCard(match, p.id, 'yellow')}
                                    className="w-3 h-3"
                                  />
                                  <span className="text-yellow-400">🟨</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer hover:bg-slate-800 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={getCardChecked(match, p.id, 'red')}
                                    onChange={() => toggleCard(match, p.id, 'red')}
                                    className="w-3 h-3"
                                  />
                                  <span className="text-red-500">🟥</span>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Away team cards */}
                      <div className="flex flex-col">
                        <label className="mb-2 text-xs font-semibold text-slate-300">{getTeamName(match.awayId)}</label>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {getTeamPlayers(match.awayId).length === 0 ? (
                            <p className="text-xs text-slate-500">Sin jugadores</p>
                          ) : (
                            getTeamPlayers(match.awayId).map((p) => (
                              <div key={p.id} className="flex items-center gap-1 rounded px-2 py-1 text-xs">
                                <span className="flex-1 text-slate-200">{p.name}</span>
                                <label className="flex items-center gap-1 cursor-pointer hover:bg-slate-800 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={getCardChecked(match, p.id, 'yellow')}
                                    onChange={() => toggleCard(match, p.id, 'yellow')}
                                    className="w-3 h-3"
                                  />
                                  <span className="text-yellow-400">🟨</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer hover:bg-slate-800 rounded px-1">
                                  <input
                                    type="checkbox"
                                    checked={getCardChecked(match, p.id, 'red')}
                                    onChange={() => toggleCard(match, p.id, 'red')}
                                    className="w-3 h-3"
                                  />
                                  <span className="text-red-500">🟥</span>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                  <div>
                    {isCompleted ? (
                      <span className="text-emerald-400">✓ Resultado registrado</span>
                    ) : (
                      <span className="text-amber-400">○ Pendiente</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MatchSchedule;
