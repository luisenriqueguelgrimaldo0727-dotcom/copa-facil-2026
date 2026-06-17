const normalizeSelectionName = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s.]/g, '')
    .trim()
    .toLowerCase();

const svgLogo = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const makeHorizontalFlag = (...colors) => {
  const height = 90;
  const stripeHeight = height / colors.length;
  return svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      ${colors.map((color, index) => `<rect width="120" height="${stripeHeight}" y="${index * stripeHeight}" fill="${color}"/>`).join('')}
    </svg>
  `);
};

const makeVerticalFlag = (...colors) => {
  const width = 120;
  const stripeWidth = width / colors.length;
  return svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      ${colors.map((color, index) => `<rect width="${stripeWidth}" height="90" x="${index * stripeWidth}" fill="${color}"/>`).join('')}
    </svg>
  `);
};

const SELECTION_LOGOS = {
  inglaterra: svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="120" height="90" fill="#fff"/>
      <rect x="50" width="20" height="90" fill="#cf142b"/>
      <rect y="35" width="120" height="20" fill="#cf142b"/>
    </svg>
  `),
  francia: makeVerticalFlag('#002395', '#ffffff', '#ed2939'),
  'cabo verde': svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="120" height="90" fill="#003893"/>
      <rect y="48" width="120" height="8" fill="#fff"/>
      <rect y="56" width="120" height="8" fill="#cf2027"/>
      <rect y="64" width="120" height="8" fill="#fff"/>
      <circle cx="37" cy="55" r="14" fill="none" stroke="#f7d116" stroke-width="4"/>
    </svg>
  `),
  espana: makeHorizontalFlag('#aa151b', '#f1bf00', '#aa151b'),
  colombia: svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="120" height="45" fill="#fcd116"/>
      <rect y="45" width="120" height="22.5" fill="#003893"/>
      <rect y="67.5" width="120" height="22.5" fill="#ce1126"/>
    </svg>
  `),
  haiti: svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="120" height="45" fill="#00209f"/>
      <rect y="45" width="120" height="45" fill="#d21034"/>
      <rect x="47" y="33" width="26" height="24" rx="3" fill="#fff"/>
    </svg>
  `),
  alemania: makeHorizontalFlag('#000000', '#dd0000', '#ffce00'),
  argentina: svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="120" height="30" fill="#74acdf"/>
      <rect y="30" width="120" height="30" fill="#fff"/>
      <rect y="60" width="120" height="30" fill="#74acdf"/>
      <circle cx="60" cy="45" r="8" fill="#f6b40e"/>
    </svg>
  `),
  mexico: svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="40" height="90" fill="#006847"/>
      <rect x="40" width="40" height="90" fill="#fff"/>
      <rect x="80" width="40" height="90" fill="#ce1126"/>
      <circle cx="60" cy="45" r="9" fill="#8c6239"/>
    </svg>
  `),
  'rd congo': svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="120" height="90" fill="#007fff"/>
      <polygon points="0,90 120,0 120,18 18,90" fill="#f7d618"/>
      <polygon points="0,90 120,0 120,10 10,90" fill="#ce1021"/>
      <polygon points="18,10 22,21 34,21 24,28 28,40 18,33 8,40 12,28 2,21 14,21" fill="#f7d618"/>
    </svg>
  `),
  portugal: svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="48" height="90" fill="#046a38"/>
      <rect x="48" width="72" height="90" fill="#da291c"/>
      <circle cx="48" cy="45" r="12" fill="#ffcc00"/>
      <circle cx="48" cy="45" r="7" fill="#046a38"/>
    </svg>
  `),
  brasil: svgLogo(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect width="120" height="90" fill="#009b3a"/>
      <polygon points="60,10 108,45 60,80 12,45" fill="#ffdf00"/>
      <circle cx="60" cy="45" r="17" fill="#002776"/>
    </svg>
  `),
};

export const getSelectionLogo = (teamName) => SELECTION_LOGOS[normalizeSelectionName(teamName)] || '';

export const applySelectionLogos = (teams = []) =>
  teams.map((team) => {
    const logo = getSelectionLogo(team.name);
    return logo && !team.logo ? { ...team, logo } : team;
  });
