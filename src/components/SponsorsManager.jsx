import React, { useState } from 'react';
import useTournamentStore from '../store/useTournamentStore';

const SponsorsManager = () => {
  const sponsors = useTournamentStore((state) => state.sponsors || []);
  const addSponsor = useTournamentStore((state) => state.addSponsor);
  const removeSponsor = useTournamentStore((state) => state.removeSponsor);

  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [logo, setLogo] = useState('');
  const [status, setStatus] = useState(null);

  const handleLogoUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result && typeof result === 'string') {
        setLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedLink = link.trim();

    if (!trimmedName) {
      setStatus({ type: 'error', text: 'El nombre del patrocinador es obligatorio.' });
      return;
    }

    addSponsor(trimmedName, logo, trimmedLink);
    setName('');
    setLink('');
    setLogo('');
    setStatus({ type: 'success', text: `¡Patrocinador '${trimmedName}' agregado con éxito!` });

    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-700/60">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Monetización</p>
          <h2 className="text-3xl font-extrabold text-white">Patrocinadores de la Liga</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Agrega patrocinadores locales de Saltillo para monetizar tu liga. Sus logotipos aparecerán en un banner premium al pie de la página en la vista pública.
          </p>
        </div>
        <div className="rounded-3xl bg-slate-900/90 px-5 py-4 text-right shadow-inner shadow-slate-950/30">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Patrocinadores</p>
          <p className="mt-2 text-2xl font-semibold text-white">{sponsors.length}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-inner shadow-slate-950/20">
        <h3 className="mb-4 text-lg font-bold text-white">Registrar Nuevo Patrocinador</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">Nombre Comercial</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="Ej. Tacos El Chino"
                required
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">Enlace Web o Redes Sociales</span>
              <input
                type="url"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                placeholder="https://facebook.com/pagina"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-300">Logotipo de la Marca</span>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center justify-center rounded-3xl border border-dashed border-slate-600 bg-slate-950 px-5 py-3 text-sm text-slate-200 transition hover:bg-slate-900">
                Seleccionar Logotipo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleLogoUpload(file);
                    event.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
              {logo && (
                <div className="flex items-center gap-2 rounded-2xl bg-slate-950 p-2 ring-1 ring-slate-800">
                  <img src={logo} alt="Vista previa logo" className="h-8 w-16 object-contain rounded" />
                  <button
                    type="button"
                    onClick={() => setLogo('')}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-3xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
          >
            Agregar Patrocinador
          </button>
        </div>
      </form>

      {status && (
        <div
          className={`mt-6 rounded-3xl px-5 py-4 text-sm font-medium ${
            status.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30'
              : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-bold text-white">Patrocinadores Actuales</h3>
        {sponsors.length === 0 ? (
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/40 p-8 text-center">
            <p className="text-sm text-slate-400">Aún no has agregado ningún patrocinador. ¡Los patrocinadores te ayudarán a ganar dinero con tu app!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <div key={sponsor.id} className="flex flex-col justify-between rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-5 shadow-inner shadow-slate-950/20">
                <div className="flex items-center gap-3">
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={`${sponsor.name} logo`} className="h-10 w-20 object-contain bg-slate-950 p-1 rounded-lg" />
                  ) : (
                    <div className="h-10 w-20 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500">Sin Logo</div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-semibold text-white truncate">{sponsor.name}</p>
                    {sponsor.link && (
                      <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate block">
                        Visitar Enlace
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeSponsor(sponsor.id)}
                    className="inline-flex items-center justify-center rounded-2xl bg-rose-950/60 px-3 py-1.5 text-xs font-semibold text-rose-300 border border-rose-900 transition hover:bg-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorsManager;
