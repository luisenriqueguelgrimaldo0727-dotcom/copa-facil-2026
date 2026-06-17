import React from 'react';
import useTournamentStore from '../store/useTournamentStore';

const stageOrder = ['Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];

const KnockoutStage = ({ readOnly = false }) => {
  const teams = useTournamentStore((state) => state.teams);
  const standings = useTournamentStore((state) => state.getStandings());
  const knockoutMatches = useTournamentStore((state) => state.knockoutMatches);
  const settings = useTournamentStore((state) => state.settings || {});
  const getTeamLogo = (teamId) => teams.find((team) => team.id === teamId)?.logo || '';
  const generateKnockoutBracket = useTournamentStore((state) => state.generateKnockoutBracket);
  const updateSettings = useTournamentStore((state) => state.updateSettings);

  const getTeamName = (teamId) => teams.find((team) => team.id === teamId)?.name || teamId;
  const qualified = standings.slice(0, 8);
  const hasKnockout = knockoutMatches.length > 0;
  const isLongFormat = settings.tournamentFormat === 'long';
  const knockoutFormat = settings.knockoutFormat || (settings.tournamentFormat === 'worldCup' ? 'single' : 'twoLeg');

  const getStageLabel = (match) => {
    const matchFormat = match.knockoutFormat || knockoutFormat;
    if (matchFormat === 'single') {
      return match.stage === 'Final' ? 'Final - Partido unico' : `${match.stage} - Partido unico`;
    }
    const legLabel = match.leg === 1 ? 'Ida' : 'Vuelta';
    if (match.stage === 'Final') {
      return `Final - ${legLabel}`;
    }
    return `${match.stage} ${legLabel}`;
  };

  const getRoundLabel = (stage) => {
    if (stage === 'Dieciseisavos') return 'Dieciseisavos de Final';
    if (stage === 'Octavos') return 'Octavos de Final';
    if (stage === 'Cuartos') return 'Cuartos de Final';
    if (stage === 'Semifinal') return 'Semifinales';
    if (stage === 'Final') return 'Final';
    return stage;
  };

  const getMatchState = (match) => {
    if (match.homeGoals === null || match.awayGoals === null) return 'Pendiente';
    return `${match.homeGoals} - ${match.awayGoals}`;
  };

  const stages = knockoutMatches.reduce((acc, match) => {
    acc[match.stage] = acc[match.stage] || [];
    acc[match.stage].push(match);
    return acc;
  }, {});

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/60">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Fase Eliminatoria</h2>
        <p className="text-sm text-slate-400">
          {isLongFormat ? 'Este torneo se define por tabla general, sin fase eliminatoria.' : 'Gestiona los cruces de eliminatoria con partido unico o ida y vuelta.'}
        </p>
      </div>

      {isLongFormat && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          El campeon sera el lider general al terminar todas las jornadas del calendario.
        </div>
      )}

      {!isLongFormat && (
      <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-inner shadow-slate-950/20">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Clasificados</p>
        {qualified.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Aún no hay equipos suficientes.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {qualified.map((team) => (
              <div key={team.id} className="rounded-2xl bg-slate-950/80 px-4 py-3 text-sm text-slate-200 shadow-sm shadow-slate-950/20">
                <div className="flex items-center gap-2">
                  {getTeamLogo(team.id) ? (
                    <img src={getTeamLogo(team.id)} alt={team.name} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-700" />
                  )}
                  <span>{team.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {!readOnly && !isLongFormat && (
        <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-inner shadow-slate-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Formato de eliminatoria</p>
              <p className="mt-1 text-sm text-slate-400">
                Elige antes de generar el cuadro. En Mundial normalmente se juega a partido unico.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-1 ring-1 ring-slate-800 sm:min-w-80">
              {[
                { id: 'single', label: 'Partido unico' },
                { id: 'twoLeg', label: 'Ida y vuelta' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateSettings({ knockoutFormat: option.id })}
                  disabled={hasKnockout}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    knockoutFormat === option.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {hasKnockout && (
            <p className="mt-3 text-xs text-amber-300">
              El formato queda bloqueado cuando el calendario de eliminatorias ya fue generado.
            </p>
          )}
        </div>
      )}

      {!readOnly && !isLongFormat && (
      <button
        type="button"
        onClick={generateKnockoutBracket}
        disabled={qualified.length < 8 || hasKnockout}
        className="mb-6 inline-flex w-full items-center justify-center rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
      >
        {hasKnockout ? 'Calendario de eliminatorias generado' : 'Generar fase eliminatoria'}
      </button>
      )}

      {!isLongFormat && (hasKnockout ? (
        <div className="space-y-6">
          {stageOrder.map((stage) => {
            const matches = stages[stage] || [];
            if (!matches.length) return null;
            return (
              <div key={stage}>
                <div className="mb-3 rounded-3xl bg-slate-900/85 px-5 py-3 text-sm font-semibold text-slate-200 shadow-sm shadow-slate-950/10">
                  {getRoundLabel(stage)}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-[1.5rem] border border-slate-800 bg-slate-950/90 p-5 transition hover:border-sky-500/30 hover:bg-slate-900/90"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            {getTeamLogo(match.homeId) ? (
                              <img src={getTeamLogo(match.homeId)} alt={getTeamName(match.homeId)} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-700" />
                            )}
                            <span className="text-sm font-semibold text-white">{getTeamName(match.homeId)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTeamLogo(match.awayId) ? (
                              <img src={getTeamLogo(match.awayId)} alt={getTeamName(match.awayId)} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-700" />
                            )}
                            <span className="text-sm font-semibold text-white">{getTeamName(match.awayId)}</span>
                          </div>
                        </div>
                        <div className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                          {getMatchState(match)}
                        </div>
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        {getStageLabel(match)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Genera el cuadro eliminatorio cuando tengas 8 equipos clasificados.</p>
      ))}
    </div>
  );
};

export default KnockoutStage;
