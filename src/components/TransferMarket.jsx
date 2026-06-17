import React, { useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const TransferMarket = () => {
  const teams = useTournamentStore((s) => s.teams);
  const transfers = useTournamentStore((s) => s.transfers || []);
  const transferPlayer = useTournamentStore((s) => s.transferPlayer);
  const getPlayerTeam = useTournamentStore((s) => s.getPlayerTeam);

  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedToTeam, setSelectedToTeam] = useState('');

  const allPlayers = teams.flatMap((t) => (t.players || []).map((p) => ({ ...p, teamId: t.id, teamName: t.name, teamLogo: t.logo })));
  const selectedPlayerObj = allPlayers.find((p) => p.id === selectedPlayer);

  const handleTransfer = () => {
    if (!selectedPlayer || !selectedToTeam) return;
    const player = allPlayers.find((p) => p.id === selectedPlayer);
    if (player && player.teamId !== selectedToTeam) {
      transferPlayer(selectedPlayer, selectedToTeam);
      setSelectedPlayer('');
      setSelectedToTeam('');
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Mercado de Transferencias</h2>
        <p className="text-sm text-slate-400">Transfiere jugadores entre equipos.</p>
      </div>

      {/* Transfer Form */}
      <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Selecciona Jugador</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="">-- Selecciona jugador --</option>
              {allPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.teamName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Equipo Destino</label>
            <select
              value={selectedToTeam}
              onChange={(e) => setSelectedToTeam(e.target.value)}
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="">-- Selecciona equipo --</option>
              {teams.map((t) => {
                const playerTeam = selectedPlayer ? allPlayers.find((p) => p.id === selectedPlayer)?.teamId : null;
                return playerTeam !== t.id ? (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ) : null;
              })}
            </select>
          </div>

          <button
            onClick={handleTransfer}
            disabled={!selectedPlayer || !selectedToTeam}
            className="w-full rounded-md bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500"
          >
            🔄 Transferir Jugador
          </button>
          {selectedPlayerObj && (
            <div className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-slate-200">
              {selectedPlayerObj.photo ? (
                <img src={selectedPlayerObj.photo} alt={selectedPlayerObj.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-slate-700" />
              )}
              <div>
                <p className="font-semibold text-white">{selectedPlayerObj.name}</p>
                <p className="text-sm text-slate-400">Equipo actual: {selectedPlayerObj.teamName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer History */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">Historial de Transferencias</h3>
        {transfers.length === 0 ? (
          <p className="text-sm text-slate-400">Sin transferencias todavía.</p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {[...transfers].reverse().map((t) => {
              const player = allPlayers.find((p) => p.id === t.playerId);
              const fromTeam = teams.find((team) => team.id === t.fromTeam);
              const toTeam = teams.find((team) => team.id === t.toTeam);
              return (
                <div key={t.id} className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {player?.photo ? (
                        <img src={player.photo} alt={player.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-700" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{player?.name}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            {fromTeam?.logo ? (
                              <img src={fromTeam.logo} alt={fromTeam.name} className="h-4 w-4 rounded-full object-cover" />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-slate-700" />
                            )}
                            {fromTeam?.name}
                          </span>
                          <span>→</span>
                          <span className="inline-flex items-center gap-1">
                            {toTeam?.logo ? (
                              <img src={toTeam.logo} alt={toTeam.name} className="h-4 w-4 rounded-full object-cover" />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-slate-700" />
                            )}
                            {toTeam?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferMarket;
