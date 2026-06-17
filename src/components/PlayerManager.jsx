import React, { useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const PlayerManager = () => {
  const teams = useTournamentStore((s) => s.teams);
  const addPlayer = useTournamentStore((s) => s.addPlayer);
  const updatePlayer = useTournamentStore((s) => s.updatePlayer);
  const removePlayer = useTournamentStore((s) => s.removePlayer);
  const updatePlayerPhoto = useTournamentStore((s) => s.updatePlayerPhoto);
  const updateTeamLogo = useTournamentStore((s) => s.updateTeamLogo);

  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || '');
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleTeamLogoUpload = (teamId, file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result && typeof result === 'string') {
        updateTeamLogo(teamId, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePlayerPhotoUpload = (playerId, file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result && typeof result === 'string') {
        updatePlayerPhoto(playerId, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!selectedTeam || !newPlayerName.trim()) return;
    addPlayer(selectedTeam, newPlayerName.trim());
    setNewPlayerName('');
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-white">Gestión de Jugadores</h2>
        <p className="text-sm text-slate-400">Añade, edita y elimina jugadores por equipo.</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <label className="ml-0 sm:ml-2 flex w-full max-w-xs cursor-pointer items-center justify-center rounded-md bg-slate-800 px-3 py-2 text-sm text-white transition hover:bg-slate-700">
          Subir logo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (selectedTeam && file) {
                handleTeamLogoUpload(selectedTeam, file);
              }
              e.target.value = '';
            }}
            className="sr-only"
          />
        </label>
        <input
          type="text"
          placeholder="Nombre del jugador"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <button
          onClick={handleAdd}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Añadir
        </button>
      </div>

      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {team.logo ? (
                  <img src={team.logo} alt={`${team.name} logo`} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-800" />
                )}
                <div className="font-semibold text-white">{team.name}</div>
              </div>
              <div className="text-sm text-slate-400">{(team.players || []).length} jugadores</div>
            </div>
            <div className="space-y-2">
                {(team.players || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-800" />
                    )}
                    <div className="text-sm text-slate-200">{p.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-400">Goles: {p.goals || 0}</div>
                    <button
                      onClick={() => {
                        const newName = prompt('Editar nombre', p.name);
                        if (newName) updatePlayer(p.id, { name: newName });
                      }}
                      className="text-xs text-sky-300"
                    >Editar</button>
                    <label className="text-xs text-sky-300 cursor-pointer">
                      Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePlayerPhotoUpload(p.id, file);
                          e.target.value = '';
                        }}
                        className="sr-only"
                      />
                    </label>
                    <button
                      onClick={() => {
                        if (confirm('Eliminar jugador?')) removePlayer(p.id);
                      }}
                      className="text-xs text-rose-400"
                    >Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerManager;
