import React from 'react';
import useTournamentStore from '../store/useTournamentStore';

const StandingsTable = () => {
  const standings = useTournamentStore((state) => state.getStandings());
  const groupedStandings = useTournamentStore((state) => state.getGroupedStandings ? state.getGroupedStandings() : []);
  const teams = useTournamentStore((state) => state.teams || []);
  const settings = useTournamentStore((state) => state.settings || { category: 'Varonil Libre', fieldDefault: 'Campos de Saltillo', pointForWin: 3 });
  const tournaments = useTournamentStore((state) => state.tournaments || {});
  const currentUser = useTournamentStore((state) => state.currentUser);
  const currentTournamentId = useTournamentStore((state) => state.currentTournamentId);
  const activeTournament = tournaments[currentUser]?.find((t) => t.id === currentTournamentId);
  const leagueName = activeTournament?.name || 'Copa Fácil';
  const isWorldCup = settings.tournamentFormat === 'worldCup';
  const formatLabel = {
    long: 'Torneo largo',
    ligaMx: 'Formato Liga MX',
    worldCup: 'Mundial por grupos',
  }[settings.tournamentFormat] || 'Formato Liga MX';

  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getTeamLogo = (teamId) => teams.find((savedTeam) => savedTeam.id === teamId)?.logo;

  const renderMobileStandingRows = (rows, options = {}) => (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/90 sm:hidden">
      <div className="mobile-standing-grid border-b border-slate-800 bg-slate-900 px-2 py-2 text-[7px] font-black uppercase tracking-tight text-slate-500">
        <span className="text-center">#</span>
        <span />
        <span>Equipo</span>
        <span className="text-center text-sky-300">PTS</span>
        <span className="text-center">PJ</span>
        <span className="text-center">G</span>
        <span className="text-center">E</span>
        <span className="text-center">P</span>
        <span className="text-center">GF</span>
        <span className="text-center">GC</span>
        <span className="text-center">DG</span>
      </div>
      {rows.map((team, index) => {
        const teamLogo = getTeamLogo(team.id);
        const isQualified = options.grouped ? index < 2 : index < 8;
        return (
          <div
            key={team.id}
            className={`mobile-standing-grid min-h-[54px] border-b border-slate-800/80 px-2 py-2 text-[9px] last:border-b-0 ${
              index === 0 ? 'bg-sky-950/20' : 'bg-slate-950/80'
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center justify-self-center rounded-full text-[9px] font-black ${
              isQualified ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>{index + 1}</span>
            {teamLogo ? (
              <img src={teamLogo} alt="" className="hd-flag h-5 w-5 rounded object-cover ring-1 ring-slate-700" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[9px]">⚽</span>
            )}
            <span
              className="min-w-0 overflow-hidden whitespace-nowrap font-black uppercase leading-none tracking-[-0.03em] text-slate-100"
              style={{
                fontSize: team.name.length > 24 ? '7.5px' : team.name.length > 18 ? '8.5px' : '10px',
              }}
            >
              {team.name}
            </span>
            <span className="text-center text-[9px] font-black text-sky-300">{team.points}</span>
            <span className="text-center text-slate-300">{team.played}</span>
            <span className="text-center text-slate-300">{team.wins}</span>
            <span className="text-center text-slate-300">{team.draws}</span>
            <span className="text-center text-slate-300">{team.losses}</span>
            <span className="text-center text-slate-300">{team.goalsFor}</span>
            <span className="text-center text-slate-300">{team.goalsAgainst}</span>
            <span className={`text-center font-black ${
              team.goalDiff > 0 ? 'text-emerald-400' : team.goalDiff < 0 ? 'text-rose-400' : 'text-slate-500'
            }`}>{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/60 sm:rounded-[2rem] sm:p-6">

      {/*
        ===================================================================
        ESTILOS DE IMPRESIÓN
        Estrategia: usar visibility:hidden en todo el body y luego
        visibility:visible en el contenedor de impresión.
        Esto evita el bug de "página en blanco" causado por ocultar
        los ancestros del contenedor imprimible con display:none.
        ===================================================================
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ---- SOLO PANTALLA: ocultar elementos de solo-impresión ---- */
        .print-only {
          display: none !important;
        }

        /* ---- IMPRESIÓN ---- */
        @media print {
          @page {
            size: letter portrait;
            margin: 1.5cm 1.8cm 2cm 1.8cm;
          }

          /* Forzar colores exactos */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ocultar TODO con visibility para no romper la estructura del DOM */
          body * {
            visibility: hidden !important;
          }

          /* Mostrar únicamente el contenedor de impresión y sus hijos */
          #copa-print-container,
          #copa-print-container * {
            visibility: visible !important;
          }

          /* Posicionar el contenedor sobre todo lo demás */
          #copa-print-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #111827 !important;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            font-size: 10.5pt !important;
            line-height: 1.45 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Mostrar elementos de solo-impresión */
          .print-only {
            display: block !important;
            visibility: visible !important;
          }

          /* ---- CABECERA ---- */
          .ph-wrapper {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
            border-bottom: 3px solid #0f172a !important;
            padding-bottom: 14px !important;
            margin-bottom: 20px !important;
          }

          .ph-title {
            font-size: 24pt !important;
            font-weight: 900 !important;
            letter-spacing: -0.03em !important;
            color: #0f172a !important;
            text-transform: uppercase !important;
            line-height: 1 !important;
          }

          .ph-subtitle {
            font-size: 9pt !important;
            color: #64748b !important;
            font-weight: 600 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            margin-top: 4px !important;
          }

          .ph-badge {
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-size: 7.5pt !important;
            font-weight: 800 !important;
            letter-spacing: 0.12em !important;
            padding: 5px 14px !important;
            border-radius: 4px !important;
            text-transform: uppercase !important;
          }

          /* ---- GRID DE METADATOS ---- */
          .ph-meta {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            margin-bottom: 22px !important;
          }

          .ph-meta-cell {
            display: flex !important;
            flex-direction: column !important;
            padding: 10px 14px !important;
            border-right: 1px solid #e2e8f0 !important;
          }

          .ph-meta-cell:last-child {
            border-right: none !important;
          }

          .ph-meta-label {
            font-size: 7pt !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            color: #94a3b8 !important;
          }

          .ph-meta-val {
            font-size: 10pt !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            margin-top: 3px !important;
          }

          /* ---- TABLA ---- */
          .pt-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9.5pt !important;
          }

          .pt-table thead tr {
            background-color: #0f172a !important;
          }

          .pt-table thead th {
            color: #ffffff !important;
            font-size: 7.5pt !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            padding: 10px 11px !important;
            text-align: center !important;
            border: 1px solid #1e293b !important;
          }

          .pt-table thead th.col-team {
            text-align: left !important;
          }

          .pt-table tbody tr {
            border-bottom: 1px solid #e2e8f0 !important;
          }

          /* Zebra striping */
          .pt-table tbody tr:nth-child(even) {
            background-color: #f8fafc !important;
          }

          /* Fila líder */
          .pt-table tbody tr.row-leader {
            background-color: #f0fdf4 !important;
            border-left: 4px solid #22c55e !important;
          }

          /* Fila liguilla */
          .pt-table tbody tr.row-liguilla {
            border-left: 4px solid #cbd5e1 !important;
          }

          .pt-table tbody td {
            padding: 9px 11px !important;
            text-align: center !important;
            vertical-align: middle !important;
            color: #1e293b !important;
          }

          .pt-table tbody td.col-team {
            text-align: left !important;
            font-weight: 600 !important;
          }

          /* Badge de posición */
          .pos-badge {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 22px !important;
            height: 22px !important;
            border-radius: 50% !important;
            font-size: 8pt !important;
            font-weight: 900 !important;
          }

          .pos-gold   { background-color: #fef08a !important; border: 1.5px solid #eab308 !important; }
          .pos-silver { background-color: #e2e8f0 !important; border: 1.5px solid #94a3b8 !important; }
          .pos-bronze { background-color: #fed7aa !important; border: 1.5px solid #f97316 !important; }
          .pos-normal { background-color: #f1f5f9 !important; border: 1.5px solid #cbd5e1 !important; }

          /* Badge de puntos */
          .pts-badge {
            display: inline-block !important;
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-weight: 900 !important;
            font-size: 9pt !important;
            padding: 3px 9px !important;
            border-radius: 5px !important;
            min-width: 26px !important;
            text-align: center !important;
          }

          /* Diferencia de goles */
          .dg-pos  { color: #15803d !important; font-weight: 700 !important; }
          .dg-neg  { color: #b91c1c !important; font-weight: 700 !important; }
          .dg-zero { color: #64748b !important; }

          /* Nota de clasificación */
          .ph-legend {
            display: flex !important;
            gap: 24px !important;
            margin-top: 12px !important;
            padding: 8px 14px !important;
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            font-size: 7.5pt !important;
            color: #475569 !important;
          }

          .ph-legend-item {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }

          .legend-bar {
            width: 14px !important;
            height: 8px !important;
            border-radius: 2px !important;
          }

          /* Panel de Firmas */
          .ph-signatures {
            display: flex !important;
            justify-content: space-around !important;
            margin-top: 70px !important;
            page-break-inside: avoid !important;
          }

          .sig-box {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 38% !important;
            gap: 8px !important;
          }

          .sig-line {
            width: 100% !important;
            border-top: 1.5px solid #475569 !important;
          }

          .sig-title {
            font-size: 8pt !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            color: #334155 !important;
            letter-spacing: 0.05em !important;
            text-align: center !important;
          }

          .sig-sub {
            font-size: 7pt !important;
            color: #94a3b8 !important;
            text-align: center !important;
            margin-top: -4px !important;
          }

          /* Pie de página */
          .ph-footer {
            display: block !important;
            text-align: center !important;
            margin-top: 30px !important;
            padding-top: 10px !important;
            border-top: 1px solid #e2e8f0 !important;
            font-size: 7pt !important;
            color: #94a3b8 !important;
            letter-spacing: 0.03em !important;
          }
        }
      `}} />

      {/* ============================================================
          CABECERA DE PANTALLA (se oculta en impresión vía visibility)
          ============================================================ */}
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Estadísticas Oficiales</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Tabla de Clasificación</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Los primeros 8 clasifican a la Liguilla (formato Liga MX: a doble partido con cierre en casa del mejor posicionado).
          </p>
        </div>

        <div className="flex justify-end">
          <div className="flex flex-col justify-center rounded-[1.5rem] border border-slate-800/80 bg-slate-900/90 px-3 py-3 text-center shadow-inner sm:rounded-3xl sm:px-5 sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">Líder General</p>
            <p className="mt-1 text-lg font-black text-sky-400 truncate max-w-[150px]">
              {standings[0]?.name || 'Sin datos'}
            </p>
          </div>
        </div>
      </div>

      {isWorldCup && groupedStandings.length > 0 && (
        <div className="mb-6 grid gap-5 sm:gap-4 lg:grid-cols-2">
          {groupedStandings.map((group) => (
            <div key={group.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-3 sm:p-4">
              <div className="mb-4 flex items-center justify-between gap-2 px-1 pt-1">
                <h3 className="shrink-0 text-base font-black uppercase tracking-[0.18em] text-sky-300 sm:text-sm sm:tracking-[0.22em]">{group.name}</h3>
                <span className="min-w-0 rounded-full bg-slate-950 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:text-[10px] sm:tracking-wider">Top 2 + mejores lugares</span>
              </div>
              {renderMobileStandingRows(group.standings, { grouped: true })}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 sm:block">
                <table className="static-stats-table w-full text-left text-[10px] text-slate-300 sm:text-xs">
                  <colgroup>
                    <col className="w-[7%]" />
                    <col className="w-[25%]" />
                    <col className="w-[9%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-2 py-3 text-center">#</th>
                      <th className="px-2 py-3">País</th>
                      <th className="px-2 py-3 text-center text-sky-300">PTS</th>
                      <th className="px-2 py-3 text-center">PJ</th>
                      <th className="px-2 py-3 text-center">G</th>
                      <th className="px-2 py-3 text-center">E</th>
                      <th className="px-2 py-3 text-center">P</th>
                      <th className="px-2 py-3 text-center">GF</th>
                      <th className="px-2 py-3 text-center">GC</th>
                      <th className="px-2 py-3 text-center">DG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((team, index) => {
                      const teamLogo = getTeamLogo(team.id);
                      return (
                        <tr key={team.id} className="border-b border-slate-800/80 last:border-0">
                          <td className="px-2 py-3 text-center">
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${index < 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{index + 1}</span>
                          </td>
                          <td className="team-name-cell px-2 py-3">
                            <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-100">
                              {teamLogo ? (
                                <img src={teamLogo} alt="" className="hd-flag h-5 w-7 flex-shrink-0 rounded object-cover sm:h-6 sm:w-8" />
                              ) : (
                                <span className="h-5 w-7 flex-shrink-0 rounded bg-slate-800 ring-1 ring-slate-700 sm:h-6 sm:w-8" />
                              )}
                              <span className="team-name-text">{team.name}</span>
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="inline-flex min-w-6 justify-center rounded-lg bg-sky-500 px-1.5 py-1 text-[10px] font-black text-slate-950 sm:min-w-8 sm:px-2 sm:text-xs">{team.points}</span>
                          </td>
                          <td className="px-2 py-3 text-center">{team.played}</td>
                          <td className="px-2 py-3 text-center">{team.wins}</td>
                          <td className="px-2 py-3 text-center">{team.draws}</td>
                          <td className="px-2 py-3 text-center">{team.losses}</td>
                          <td className="px-2 py-3 text-center">{team.goalsFor}</td>
                          <td className="px-2 py-3 text-center">{team.goalsAgainst}</td>
                          <td className={`px-2 py-3 text-center font-bold ${team.goalDiff > 0 ? 'text-emerald-400' : team.goalDiff < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                            {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-sm leading-6 text-slate-300 sm:rounded-3xl sm:px-5">
        <span className="font-bold text-sky-300">{formatLabel}:</span>{' '}
        {isWorldCup ? 'clasifican los primeros 2 de cada grupo y se completa la liguilla con los mejores lugares disponibles hasta llegar a 8, 16 o 32 equipos.' : settings.tournamentFormat === 'long' ? 'todos contra todos; el lider general al finalizar es campeon.' : 'tabla general con clasificacion a liguilla.'}
      </div>

      {/* ============================================================
          CONTENEDOR DE IMPRESIÓN
          Contiene TODO lo que aparecerá en el PDF.
          La estrategia visibility:hidden en body + visibility:visible
          aquí garantiza que el contenido sea visible sin romper el DOM.
          ============================================================ */}
      <div id="copa-print-container">

        {/* --- Solo en PDF: Cabecera Oficial --- */}
        <div className="print-only ph-wrapper">
          <div>
            <div className="ph-title">{leagueName}</div>
            <div className="ph-subtitle">Clasificación General Oficial — Temporada Activa</div>
          </div>
          <div className="ph-badge">Reporte Oficial</div>
        </div>

        {/* --- Solo en PDF: Grid de Metadatos --- */}
        <div className="print-only ph-meta">
          <div className="ph-meta-cell">
            <span className="ph-meta-label">Torneo</span>
            <span className="ph-meta-val">{leagueName}</span>
          </div>
          <div className="ph-meta-cell">
            <span className="ph-meta-label">Categoría</span>
            <span className="ph-meta-val">{settings.category}</span>
          </div>
          <div className="ph-meta-cell">
            <span className="ph-meta-label">Sede Oficial</span>
            <span className="ph-meta-val">{settings.fieldDefault}</span>
          </div>
          <div className="ph-meta-cell">
            <span className="ph-meta-label">Fecha de Emisión</span>
            <span className="ph-meta-val">{today}</span>
          </div>
        </div>

        {/* --- TABLA DE CLASIFICACIÓN (visible en pantalla y en PDF) --- */}
        {standings.length === 0 ? (
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/40 p-10 text-center">
            <p className="text-sm text-slate-400">
              No hay equipos registrados. Agrega equipos en la pestaña "Equipos" para ver la tabla.
            </p>
          </div>
        ) : (
          <>
          {renderMobileStandingRows(standings)}
          <div className="hidden overflow-hidden rounded-[1.75rem] bg-slate-900 shadow-inner border border-slate-800/80 sm:block">
            <table className="static-stats-table min-w-full text-left text-[10px] text-slate-300 pt-table sm:text-sm">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[25%]" />
                <col className="w-[9%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  <th className="px-2 py-4 text-center">POS</th>
                  <th className="px-2 py-4 col-team">EQUIPO</th>
                  <th className="px-2 py-4 text-center font-bold text-sky-400">PTS</th>
                  <th className="px-2 py-4 text-center">PJ</th>
                  <th className="px-2 py-4 text-center">G</th>
                  <th className="px-2 py-4 text-center">E</th>
                  <th className="px-2 py-4 text-center">P</th>
                  <th className="px-2 py-4 text-center">GF</th>
                  <th className="px-2 py-4 text-center">GC</th>
                  <th className="px-2 py-4 text-center">DG</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => {
                  const isLeader = index === 0;
                  const isLiguilla = index >= 1 && index <= 7;

                  let rowScreenClass = 'bg-slate-950/85 hover:bg-slate-900/60 transition-colors';
                  let rowPrintClass = '';
                  if (isLeader) {
                    rowScreenClass = 'bg-sky-950/20 hover:bg-sky-950/30 transition-colors border-l-4 border-l-sky-500';
                    rowPrintClass = 'row-leader';
                  } else if (isLiguilla) {
                    rowScreenClass = 'bg-slate-950 hover:bg-slate-900/60 transition-colors border-l-4 border-l-slate-700';
                    rowPrintClass = 'row-liguilla';
                  }

                  let badgeClass = 'pos-normal';
                  if (index === 0) badgeClass = 'pos-gold';
                  else if (index === 1) badgeClass = 'pos-silver';
                  else if (index === 2) badgeClass = 'pos-bronze';

                  const teamLogo = getTeamLogo(team.id);

                  return (
                    <tr key={team.id} className={`${rowScreenClass} ${rowPrintClass} border-b border-slate-800/80`}>
                      {/* POS */}
                      <td className="px-2 py-3.5 text-center">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black pos-badge sm:h-7 sm:w-7 sm:text-xs ${badgeClass} ${
                          index === 0 ? 'bg-amber-300 text-slate-950'
                          : index === 1 ? 'bg-slate-300 text-slate-900'
                          : index === 2 ? 'bg-orange-200 text-orange-900'
                          : 'bg-slate-800 text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* EQUIPO */}
                      <td className="team-name-cell px-2 py-3.5 col-team">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          {teamLogo ? (
                            <img src={teamLogo} alt="" className="hd-flag h-5 w-7 flex-shrink-0 rounded object-cover sm:h-7 sm:w-9" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] flex-shrink-0">🛡️</div>
                          )}
                          <span className="team-name-text font-semibold text-slate-100">{team.name}</span>
                          {isLeader && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded hidden sm:inline-block">
                              Líder
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PTS */}
                      <td className="px-2 py-3.5 text-center">
                        <span className="inline-flex min-w-6 items-center justify-center rounded-lg bg-sky-500 px-1.5 py-1 text-[10px] font-black text-slate-950 pts-badge sm:min-w-[34px] sm:px-2.5 sm:text-xs">
                          {team.points}
                        </span>
                      </td>

                      <td className="px-2 py-3.5 text-center font-medium text-slate-300">{team.played}</td>
                      <td className="px-2 py-3.5 text-center text-slate-400">{team.wins}</td>
                      <td className="px-2 py-3.5 text-center text-slate-400">{team.draws}</td>
                      <td className="px-2 py-3.5 text-center text-slate-400">{team.losses}</td>
                      <td className="px-2 py-3.5 text-center text-slate-400">{team.goalsFor}</td>
                      <td className="px-2 py-3.5 text-center text-slate-400">{team.goalsAgainst}</td>

                      {/* DG */}
                      <td className={`px-2 py-3.5 text-center font-bold ${
                        team.goalDiff > 0 ? 'text-emerald-400 dg-pos'
                        : team.goalDiff < 0 ? 'text-rose-400 dg-neg'
                        : 'text-slate-500 dg-zero'
                      }`}>
                        {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* --- Solo en PDF: Leyenda de Clasificación --- */}
        <div className="print-only ph-legend">
          <div className="ph-legend-item">
            <div className="legend-bar" style={{ backgroundColor: '#22c55e' }}></div>
            <span>Líder (1º) — Pase Directo a Semifinales</span>
          </div>
          <div className="ph-legend-item">
            <div className="legend-bar" style={{ backgroundColor: '#94a3b8' }}></div>
            <span>Posiciones 2º–8º — Clasifican a Cuartos de Final</span>
          </div>
          <div className="ph-legend-item">
            <span>Formato: Doble Partido · Cierre en Casa del Mejor Posicionado · Sin Gol de Visitante</span>
          </div>
        </div>

        {/* --- Solo en PDF: Panel de Firmas --- */}
        <div className="print-only ph-signatures">
          <div className="sig-box">
            <div className="sig-line"></div>
            <div className="sig-title">Presidente de la Liga</div>
            <div className="sig-sub">{leagueName}</div>
          </div>
          <div className="sig-box">
            <div className="sig-line"></div>
            <div className="sig-title">Comité Organizador y Arbitraje</div>
            <div className="sig-sub">Cédula Oficial de Posiciones — Saltillo</div>
          </div>
        </div>

        {/* --- Solo en PDF: Pie de página --- */}
        <div className="print-only ph-footer">
          Documento oficial generado automáticamente por Copa Fácil Saltillo · Todos los derechos reservados · {today}
        </div>

      </div>
      {/* fin #copa-print-container */}

    </div>
  );
};

export default StandingsTable;
