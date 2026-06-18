import React, { useEffect, useMemo, useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';
import StandingsTable from '../components/StandingsTable';
import MatchManager from '../components/MatchManager';
import MatchSchedule from '../components/MatchSchedule';
import TeamManager from '../components/TeamManager';
import KnockoutStage from '../components/KnockoutStage';
import PlayerManager from '../components/PlayerManager';
import TopScorers from '../components/TopScorers';
import TransferMarket from '../components/TransferMarket';
import TeamStats from '../components/TeamStats';
import SponsorsManager from '../components/SponsorsManager';
import LeagueSettings from '../components/LeagueSettings';
import AdminUsersPanel from '../components/AdminUsersPanel';

const MainPage = () => {
  const teams = useTournamentStore((state) => state.teams || []);
  const groupMatches = useTournamentStore((state) => state.groupMatches || []);
  const knockoutMatches = useTournamentStore((state) => state.knockoutMatches || []);
  const standings = useTournamentStore((state) => state.getStandings());
  const currentUser = useTournamentStore((state) => state.currentUser);
  const users = useTournamentStore((state) => state.users || []);
  const logoutUser = useTournamentStore((state) => state.logoutUser);

  // Ligas state
  const tournaments = useTournamentStore((state) => state.tournaments || {});
  const currentTournamentId = useTournamentStore((state) => state.currentTournamentId);
  const switchTournament = useTournamentStore((state) => state.switchTournament);
  const createTournament = useTournamentStore((state) => state.createTournament);
  const deleteTournament = useTournamentStore((state) => state.deleteTournament);
  const sponsors = useTournamentStore((state) => state.sponsors || []);
  const settings = useTournamentStore((state) => state.settings || { category: 'Varonil Libre', fieldDefault: 'Campos de Saltillo', pointForWin: 3 });

  // UI state
  const [activeTab, setActiveTab] = useState('standings');
  const [isPublicView, setIsPublicView] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueCategory, setNewLeagueCategory] = useState('Varonil Libre');
  const [newLeagueFormat, setNewLeagueFormat] = useState('ligaMx');
  const [newLeagueGroupCount, setNewLeagueGroupCount] = useState(4);
  const [newLeagueUseDemo, setNewLeagueUseDemo] = useState(false);
  const currentUserRecord = useMemo(
    () => users.find((user) => user.username === currentUser),
    [users, currentUser]
  );
  const isAdmin = currentUserRecord?.role === 'admin';
  const effectivePublicView = isPublicView;

  const userTournaments = useMemo(() => tournaments[currentUser] || [], [tournaments, currentUser]);
  const activeTournament = useMemo(() => 
    userTournaments.find((t) => t.id === currentTournamentId) || userTournaments[0],
    [userTournaments, currentTournamentId]
  );

  const currentRound = useMemo(() => {
    if (!groupMatches.length) return 0;
    return Math.max(...groupMatches.map((match) => match.round || 1));
  }, [groupMatches]);

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'standings', label: 'Clasificación', icon: '📊', public: true },
      { id: 'schedule', label: 'Calendario', icon: '📅', public: true },
      { id: 'knockout', label: 'Eliminatorias', icon: '🏆', public: true },
      { id: 'scorers', label: 'Goleadores', icon: '⚽', public: true },
      { id: 'stats', label: 'Estadísticas', icon: '📈', public: true },
      { id: 'matches', label: 'Resultados', icon: '📝', public: false },
      { id: 'players', label: 'Jugadores', icon: '🏃‍♂️', public: false },
      { id: 'transfers', label: 'Fichajes', icon: '🔄', public: false },
      { id: 'teams', label: 'Equipos', icon: '🛡️', public: false },
      { id: 'sponsors', label: 'Patrocinadores', icon: '💵', public: false },
      { id: 'settings', label: 'Ajustes', icon: '⚙️', public: false },
    ];
    return effectivePublicView ? allTabs.filter(t => t.public) : allTabs;
  }, [effectivePublicView]);

  useEffect(() => {
    if (effectivePublicView && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('standings');
    }
  }, [activeTab, effectivePublicView, tabs]);

  // Si cambiamos a vista pública y la pestaña activa era administrativa, reseteamos a standings
  const handleToggleView = () => {
    const nextView = !isPublicView;
    setIsPublicView(nextView);
    if (nextView) {
      const currentTabObj = tabs.find(t => t.id === activeTab);
      if (currentTabObj && !currentTabObj.public) {
        setActiveTab('standings');
      }
    }
  };

  const handleCreateLeague = (event) => {
    event.preventDefault();
    if (!newLeagueName.trim()) return;

    createTournament(
      newLeagueName.trim(),
      newLeagueUseDemo,
      newLeagueCategory,
      newLeagueFormat,
      Number(newLeagueGroupCount)
    );
    setNewLeagueName('');
    setNewLeagueUseDemo(false);
    setNewLeagueCategory('Varonil Libre');
    setNewLeagueFormat('ligaMx');
    setNewLeagueGroupCount(4);
    setShowCreateModal(false);
    setActiveTab('standings');
  };

  const handleDeleteLeague = () => {
    if (userTournaments.length <= 1) {
      alert("No puedes eliminar tu única liga. Crea otra primero.");
      return;
    }
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la liga "${activeTournament?.name}"? Esta acción no se puede deshacer.`);
    if (confirmDelete) {
      deleteTournament(currentTournamentId);
      setActiveTab('standings');
    }
  };

  const renderTabContent = () => {
    const tabConfig = tabs.find((tab) => tab.id === activeTab);
    if (!tabConfig) return <StandingsTable />;

    switch (activeTab) {
      case 'standings':
        return <StandingsTable />;
      case 'schedule':
        return <MatchSchedule readOnly={effectivePublicView} />;
      case 'knockout':
        return <KnockoutStage readOnly={effectivePublicView} />;
      case 'scorers':
        return <TopScorers />;
      case 'players':
        return <PlayerManager />;
      case 'stats':
        return <TeamStats />;
      case 'transfers':
        return <TransferMarket />;
      case 'matches':
        return <MatchManager />;
      case 'teams':
        return <TeamManager />;
      case 'sponsors':
        return <SponsorsManager />;
      case 'settings':
        return <LeagueSettings />;
      default:
        return <StandingsTable />;
    }
  };

  if (isAdmin) {
    return <AdminUsersPanel />;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-slate-100 sm:px-6 sm:py-10 lg:px-8 pb-32">
      <div className="mx-auto max-w-7xl">
        
        {/* Cabecera Premium */}
        <section className="mobile-card relative mb-3 overflow-visible rounded-[1.25rem] border border-slate-800 bg-slate-900/90 p-3 shadow-xl shadow-slate-950/60 backdrop-blur-md sm:mb-8 sm:overflow-hidden sm:rounded-[2.5rem] sm:p-8">
          <div className="absolute top-0 right-0 h-40 w-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            
            <div className="space-y-3 sm:space-y-6">
              {/* Selector de Liga Interactiva */}
              <div className="relative z-30 block text-left sm:inline-block">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="inline-flex w-full max-w-full items-center justify-between gap-2 rounded-xl bg-sky-500/10 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-300 ring-1 ring-sky-500/20 transition hover:bg-sky-500/20 sm:w-auto sm:rounded-full sm:px-5 sm:py-2.5 sm:text-sm sm:tracking-[0.2em]"
                >
                  🏆 {activeTournament?.name || 'Cargando Liga...'}
                  <span className="text-xs">▼</span>
                </button>

                {showDropdown && (
                  <div className="absolute left-0 mt-3 w-full origin-top-left rounded-3xl border border-slate-800 bg-slate-950/95 p-3 shadow-2xl shadow-slate-950/90 ring-1 ring-slate-700/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 sm:w-72">
                    <div className="py-1 max-h-60 overflow-y-auto">
                      <p className="px-4 py-2 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-900 mb-2">Tus Ligas Registradas</p>
                      {userTournaments.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            switchTournament(t.id);
                            setShowDropdown(false);
                            setActiveTab('standings');
                          }}
                          className={`w-full text-left rounded-2xl px-4 py-3 text-sm transition font-medium ${
                            t.id === currentTournamentId
                              ? 'bg-sky-500 text-slate-950 font-bold'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          ⚽ {t.name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-900 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full text-center rounded-2xl bg-sky-500 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-sky-400"
                      >
                        ➕ Crear Nueva Liga
                      </button>
                      {userTournaments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteLeague();
                            setShowDropdown(false);
                          }}
                          className="w-full text-center rounded-2xl border border-rose-500 py-2.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/10"
                        >
                          🗑️ Eliminar Liga Activa
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Título e Info Principal */}
              <div className="space-y-2 sm:space-y-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-6xl">
                    Copa Fácil
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                      📍 {settings.fieldDefault || 'Campos de Saltillo'}
                    </span>
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 ring-1 ring-violet-500/20">
                      ⚡ {settings.category || 'Varonil Libre'}
                    </span>
                  </div>
                </div>
                <p className="hidden max-w-2xl text-sm leading-6 text-slate-300 sm:block sm:text-lg sm:leading-8">
                  Plataforma oficial de la liga. Consulta el rol de juegos, clasificaciones actualizadas, estadísticas de goleo y el fixture de liguilla en tiempo real.
                </p>
              </div>

              {/* Mini Paneles de Estadísticas */}
              <div className="grid max-w-lg grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-2 text-center shadow-inner sm:rounded-3xl sm:p-4">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold sm:text-[10px] sm:tracking-[0.2em]">Equipos</p>
                  <p className="mt-1 text-lg font-black text-sky-400 sm:text-2xl">{teams.length}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-2 text-center shadow-inner sm:rounded-3xl sm:p-4">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold sm:text-[10px] sm:tracking-[0.2em]">Jornada</p>
                  <p className="mt-1 text-lg font-black text-violet-400 sm:text-2xl">{currentRound}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-2 text-center shadow-inner sm:rounded-3xl sm:p-4">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold sm:text-[10px] sm:tracking-[0.2em]">Partidos</p>
                  <p className="mt-1 text-lg font-black text-emerald-400 sm:text-2xl">{groupMatches.length}</p>
                </div>
              </div>
            </div>

            {/* Controles compactos siempre disponibles en la esquina */}
            <div className="fixed right-3 top-3 z-50 flex items-center gap-1.5 rounded-2xl border border-slate-700/80 bg-slate-950/90 p-1.5 shadow-2xl backdrop-blur-xl sm:right-5 sm:top-5">
              <button
                type="button"
                onClick={handleToggleView}
                title={isPublicView ? 'Volver al modo de edicion' : 'Cambiar a vista publica'}
                className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wide transition ${
                  isPublicView ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isPublicView ? 'Publica' : 'Editar'}
              </button>
              <button
                type="button"
                onClick={logoutUser}
                title={`Cerrar sesion de ${currentUser}`}
                className="rounded-xl bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-rose-300 transition hover:bg-rose-500/15"
              >
                Salir
              </button>
            </div>

          </div>
        </section>

        {/* Modal de Creación de Liga */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-3 py-6 backdrop-blur-md animate-in fade-in sm:items-center sm:p-4">
            <div className="w-full max-w-md rounded-[1.5rem] border border-slate-800 bg-slate-900 p-5 shadow-2xl ring-1 ring-slate-700 sm:rounded-[2.5rem] sm:p-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">🏆 Crear Nueva Liga</h2>
              
              <form onSubmit={handleCreateLeague} className="space-y-4">
                <div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-300">Nombre de la Liga</span>
                    <input
                      type="text"
                      value={newLeagueName}
                      onChange={(event) => setNewLeagueName(event.target.value)}
                      placeholder="Ej. Torneo de Copa Saltillo"
                      className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      required
                    />
                  </label>
                </div>

                <div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-300">Categoría</span>
                    <select
                      value={newLeagueCategory}
                      onChange={(event) => setNewLeagueCategory(event.target.value)}
                      className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
                    >
                      <option value="Varonil Libre">Varonil Libre</option>
                      <option value="Femenil Libre">Femenil Libre</option>
                      <option value="Mixto Libre">Mixto Libre</option>
                      <option value="Veteranos">Veteranos (+35)</option>
                      <option value="Empresarial / Maquila">Empresarial / Maquila</option>
                    </select>
                  </label>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Formato de torneo</span>
                  <div className="grid gap-2">
                    {[
                      { id: 'long', title: 'Torneo largo', desc: 'Todos contra todos. El primer lugar es campeon.' },
                      { id: 'ligaMx', title: 'Formato Liga MX', desc: 'Tabla general y liguilla para definir campeon.' },
                      { id: 'worldCup', title: 'Mundial por grupos', desc: 'Grupos, fase regular por grupo y eliminatoria.' },
                    ].map((format) => (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => setNewLeagueFormat(format.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          newLeagueFormat === format.id
                            ? 'border-sky-500 bg-sky-500/10 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="block text-sm font-bold">{format.title}</span>
                        <span className="mt-1 block text-xs text-slate-400">{format.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {newLeagueFormat === 'worldCup' && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-300">Cantidad de grupos</span>
                    <input
                      type="number"
                      min="2"
                      max="64"
                      value={newLeagueGroupCount}
                      onChange={(event) => setNewLeagueGroupCount(Number(event.target.value))}
                      className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
                    />
                    <span className="mt-2 block text-[10px] text-slate-500">Puedes usar 2, 3, 4, 5, 6, 7, 8, 9, 10 o más grupos.</span>
                  </label>
                )}

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-white">Precargar Datos Demo</span>
                    <span className="block text-[10px] text-slate-400 leading-tight mt-0.5">
                      Carga 10 equipos ficticios y partidos ya agendados para probar.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewLeagueUseDemo(!newLeagueUseDemo)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      newLeagueUseDemo ? 'bg-sky-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                        newLeagueUseDemo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full rounded-3xl bg-slate-800 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-750 sm:w-1/2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full rounded-3xl bg-sky-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 sm:w-1/2"
                  >
                    Crear Liga
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabulación de Secciones */}
        <section className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 shadow-xl shadow-slate-950/40 sm:mb-8 sm:rounded-[2rem] sm:p-3 sm:ring-1 sm:ring-slate-800">
          <div className="mobile-tabbar grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:px-2 sm:py-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`mobile-nav-pill flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition focus:outline-none sm:w-auto sm:rounded-full sm:px-4 sm:text-sm ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                      : !tab.public
                      ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                  {!tab.public && (
                    <span className="hidden rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500 sm:inline">ADM</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Contenedor del Componente Activo */}
        <section className="transition-opacity duration-300">
          {renderTabContent()}
        </section>

      </div>

      {/* Banner de Patrocinadores (Estilo Comercial Saltillo) */}
      {sponsors.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 py-3 px-4 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-extrabold">Patrocinadores Oficiales</span>
              <div className="h-1 w-1 bg-sky-500 rounded-full animate-ping" />
            </div>
            
            <div className="flex flex-wrap items-center gap-6 overflow-x-auto py-1 no-scrollbar justify-center md:justify-end">
              {sponsors.map((sp) => (
                <a
                  key={sp.id}
                  href={sp.link || '#'}
                  target={sp.link ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  {sp.logo ? (
                    <img src={sp.logo} alt={sp.name} className="h-6 max-w-[80px] object-contain rounded bg-slate-900 p-0.5 border border-slate-800" />
                  ) : null}
                  <span className="text-xs font-bold text-slate-300 hover:text-sky-400">{sp.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MainPage;
