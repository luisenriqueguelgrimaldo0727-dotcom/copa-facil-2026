import React, { useMemo, useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const MatchSchedule = ({ readOnly = false }) => {
  const teams = useTournamentStore((state) => state.teams || []);
  const groupMatches = useTournamentStore((state) => state.groupMatches || []);
  const updateMatchDetails = useTournamentStore((state) => state.updateMatchDetails);
  const [activeRound, setActiveRound] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [savedMatchId, setSavedMatchId] = useState('');

  const getTeam = (teamId) => teams.find((team) => team.id === teamId);
  const getTeamName = (teamId) => getTeam(teamId)?.name || 'Equipo';
  const getTeamLogo = (teamId) => getTeam(teamId)?.logo || '';

  const rounds = useMemo(() => groupMatches.reduce((result, match) => {
    const round = match.round || 1;
    result[round] = result[round] || [];
    result[round].push(match);
    return result;
  }, {}), [groupMatches]);

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const currentRound = rounds[activeRound] ? activeRound : roundNumbers[0];
  const currentMatches = rounds[currentRound] || [];

  const getDraft = (match) => drafts[match.id] || {
    scheduledDate: match.scheduledDate || '',
    scheduledTime: match.scheduledTime || '',
    venue: match.venue || '',
  };

  const updateDraft = (match, field, value) => {
    setDrafts((current) => ({
      ...current,
      [match.id]: { ...getDraft(match), [field]: value },
    }));
    setSavedMatchId('');
  };

  const saveSchedule = (match) => {
    updateMatchDetails(match.id, getDraft(match));
    setSavedMatchId(match.id);
  };

  if (groupMatches.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-6">
        <h2 className="text-2xl font-black text-white">Calendario de encuentros</h2>
        <p className="mt-2 text-sm text-slate-400">Genera el calendario desde la seccion Equipos.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 shadow-2xl sm:rounded-[2rem] sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-300">Programacion oficial</p>
        <h2 className="mt-2 text-2xl font-black text-white">Calendario de encuentros</h2>
        <p className="mt-1 text-sm text-slate-400">Asigna fecha, hora y lugar. La vista queda lista para tomar captura y compartir.</p>
      </div>

      <div className="mobile-horizontal-scroll mb-5 flex gap-2 pb-2">
        {roundNumbers.map((round) => (
          <button
            key={round}
            type="button"
            onClick={() => setActiveRound(round)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black uppercase transition ${
              currentRound === round ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Jornada {round}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {currentMatches.map((match) => {
          const draft = getDraft(match);
          return (
            <article key={match.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Jornada {currentRound}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-4">
                <div className="min-w-0 text-center">
                  {getTeamLogo(match.homeId) ? (
                    <img src={getTeamLogo(match.homeId)} alt="" className="mx-auto h-11 w-11 rounded-xl object-cover" />
                  ) : <div className="mx-auto h-11 w-11 rounded-xl bg-slate-800" />}
                  <p className="mt-2 break-words text-xs font-black uppercase text-white">{getTeamName(match.homeId)}</p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-sky-300">VS</span>
                <div className="min-w-0 text-center">
                  {getTeamLogo(match.awayId) ? (
                    <img src={getTeamLogo(match.awayId)} alt="" className="mx-auto h-11 w-11 rounded-xl object-cover" />
                  ) : <div className="mx-auto h-11 w-11 rounded-xl bg-slate-800" />}
                  <p className="mt-2 break-words text-xs font-black uppercase text-white">{getTeamName(match.awayId)}</p>
                </div>
              </div>

              {readOnly ? (
                <div className="grid grid-cols-3 gap-1 border-t border-slate-800 bg-slate-950/60 px-3 py-3 text-center">
                  <div><p className="text-[8px] font-black uppercase text-slate-600">Fecha</p><p className="mt-1 text-[10px] font-bold text-white">{draft.scheduledDate || 'Por definir'}</p></div>
                  <div><p className="text-[8px] font-black uppercase text-slate-600">Hora</p><p className="mt-1 text-[10px] font-bold text-white">{draft.scheduledTime || 'Por definir'}</p></div>
                  <div><p className="text-[8px] font-black uppercase text-slate-600">Lugar</p><p className="mt-1 break-words text-[10px] font-bold text-white">{draft.venue || 'Por definir'}</p></div>
                </div>
              ) : (
                <div className="border-t border-slate-800 bg-slate-950/50 p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
                    <label className="block">
                      <span className="mb-1 block text-[9px] font-black uppercase text-slate-500">Fecha</span>
                      <input type="date" value={draft.scheduledDate} onChange={(event) => updateDraft(match, 'scheduledDate', event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[9px] font-black uppercase text-slate-500">Hora</span>
                      <input type="time" value={draft.scheduledTime} onChange={(event) => updateDraft(match, 'scheduledTime', event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[9px] font-black uppercase text-slate-500">Lugar</span>
                      <input type="text" value={draft.venue} onChange={(event) => updateDraft(match, 'venue', event.target.value)} placeholder="Ej. Cancha 1" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
                    </label>
                    <button type="button" onClick={() => saveSchedule(match)} className="self-end rounded-xl bg-sky-500 px-4 py-2 text-xs font-black text-slate-950">
                      {savedMatchId === match.id ? 'Guardado' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default MatchSchedule;
