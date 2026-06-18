import { create } from 'zustand';
import { isFirebaseEnabled, loadFirebaseState, saveFirebaseState, subscribeFirebaseState } from '../services/firebaseStorage';
import { applySelectionLogos, getSelectionLogo } from '../utils/selectionLogos';

const STORAGE_KEY = 'copaFacilTournamentCache';
const DEFAULT_SETTINGS = {
  category: 'Varonil Libre',
  fieldDefault: 'Campos de Saltillo',
  pointForWin: 3,
  tournamentFormat: 'ligaMx',
  groupCount: 4,
};
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin2026',
  fullName: 'Administrador General',
  role: 'admin',
};

const normalizeText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s.]/g, '')
    .trim()
    .toLowerCase();

const createUsernameFromName = (fullName, users = []) => {
  const parts = normalizeText(fullName).split(/\s+/).filter(Boolean);
  const base = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0] || 'usuario';
  let username = base;
  let suffix = 2;

  while (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    username = `${base}${suffix}`;
    suffix += 1;
  }

  return username;
};

const createPassword = () => {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `Copa${code}`;
};

const findTeamByName = (teams, name) => {
  const normalizedName = normalizeText(name);
  return teams.find((team) => normalizeText(team.name) === normalizedName);
};

const getGroupName = (groupId) => (groupId ? `Grupo ${groupId}` : 'Grupo');

const ensureAdminUser = (users = []) => {
  const normalizedUsers = users.map((user) => ({
    role: 'user',
    fullName: user.fullName || user.username,
    ...user,
  }));

  const hasAdmin = normalizedUsers.some((user) => user.role === 'admin');
  if (hasAdmin) return normalizedUsers;

  const adminExists = normalizedUsers.some((user) => user.username.toLowerCase() === DEFAULT_ADMIN.username);
  return adminExists
    ? normalizedUsers.map((user) =>
        user.username.toLowerCase() === DEFAULT_ADMIN.username ? { ...DEFAULT_ADMIN, ...user, role: 'admin' } : user
      )
    : [DEFAULT_ADMIN, ...normalizedUsers];
};

const initialTeams = [
  { id: 't1', name: 'Morelos Soccer', logo: '', players: [] },
  { id: 't2', name: 'Los Toys FC', logo: '', players: [] },
  { id: 't3', name: 'Proximity', logo: '', players: [] },
  { id: 't4', name: 'Dep Joivaz', logo: '', players: [] },
  { id: 't5', name: 'Porto FC', logo: '', players: [] },
  { id: 't6', name: 'Tiburones S.', logo: '', players: [] },
  { id: 't7', name: 'Dep 58', logo: '', players: [] },
  { id: 't8', name: 'Deportivo Triple G', logo: '', players: [] },
  { id: 't9', name: 'Suite 290', logo: '', players: [] },
  { id: 't10', name: 'Guerreros', logo: '', players: [] },
];

const getSettings = (settings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  knockoutFormat: settings.knockoutFormat || (settings.tournamentFormat === 'worldCup' ? 'single' : 'twoLeg'),
});

const createRoundRobinMatches = (teams, options = {}) => {
  if (teams.length < 2) return [];
  const stage = options.stage || 'Grupo';
  const group = options.group || null;
  const idPrefix = options.idPrefix || 'g';

  const participants = [...teams];
  const hasBye = participants.length % 2 !== 0;
  if (hasBye) {
    participants.push({ id: 'bye', name: 'Descanso' });
  }

  const totalRounds = participants.length - 1;
  const half = participants.length / 2;
  const schedule = [];
  let rotation = [...participants];

  for (let round = 0; round < totalRounds; round += 1) {
    for (let i = 0; i < half; i += 1) {
      const home = rotation[i];
      const away = rotation[rotation.length - 1 - i];

      if (home.id === 'bye' || away.id === 'bye') {
        continue;
      }

      const isReverse = round % 2 === 1;
      const matchHome = isReverse ? away : home;
      const matchAway = isReverse ? home : away;

      schedule.push({
        id: `${idPrefix}-${round + 1}-${matchHome.id}-${matchAway.id}`,
        homeId: matchHome.id,
        awayId: matchAway.id,
        homeGoals: null,
        awayGoals: null,
        round: round + 1,
        stage,
        group,
      });
    }

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    const last = rest.pop();
    rotation = [fixed, last, ...rest];
  }

  return schedule;
};

const getGroupLetters = (count) =>
  Array.from({ length: Math.max(1, count) }, (_, index) => String.fromCharCode(65 + index));

const createGroupAssignments = (teams, groupCount = 4) => {
  const safeGroupCount = Math.min(Math.max(1, Number(groupCount) || 1), Math.max(1, teams.length));
  const groups = getGroupLetters(safeGroupCount).map((letter) => ({ id: letter, name: `Grupo ${letter}`, teams: [] }));

  teams.forEach((team, index) => {
    const assignedGroup = groups.find((group) => group.id === team.group);
    if (assignedGroup) {
      assignedGroup.teams.push(team);
    } else {
      groups[index % safeGroupCount].teams.push(team);
    }
  });

  return groups;
};

const createWorldCupMatches = (teams, groupCount = 4) => {
  const groups = createGroupAssignments(teams, groupCount);

  return groups.flatMap((group) =>
    createRoundRobinMatches(group.teams, {
      stage: group.name,
      group: group.id,
      idPrefix: `wc-${group.id}`,
    })
  );
};

const createScheduleForSettings = (teams, settings = DEFAULT_SETTINGS) => {
  const currentSettings = getSettings(settings);

  if (currentSettings.tournamentFormat === 'worldCup') {
    return createWorldCupMatches(teams, currentSettings.groupCount);
  }

  return createRoundRobinMatches(teams);
};

const normalizeScheduleForSettings = (teams, matches = [], settings = DEFAULT_SETTINGS) => {
  const currentSettings = getSettings(settings);
  if (currentSettings.tournamentFormat !== 'worldCup' || !Array.isArray(matches) || matches.length === 0) {
    return matches;
  }

  const normalizedMatches = createScheduleForSettings(teams, currentSettings);
  const expectedMaxRound = Math.max(0, ...normalizedMatches.map((match) => match.round || 1));
  const currentMaxRound = Math.max(0, ...matches.map((match) => match.round || 1));

  if (currentMaxRound <= expectedMaxRound) {
    return matches;
  }

  const previousMatchesById = matches.reduce((acc, match) => {
    acc[match.id] = match;
    return acc;
  }, {});

  return normalizedMatches.map((match) => ({
    ...match,
    ...(previousMatchesById[match.id] || {}),
    round: match.round,
    stage: match.stage,
    group: match.group,
  }));
};

const initialMatches = createScheduleForSettings(initialTeams, DEFAULT_SETTINGS);

const createTournamentObject = (
  name,
  teams = initialTeams,
  groupMatches = initialMatches,
  knockoutMatches = [],
  transfers = [],
  sponsors = [],
  settings = DEFAULT_SETTINGS
) => ({
  id: `tr-${Date.now()}`,
  name,
  teams,
  groupMatches,
  knockoutMatches,
  transfers,
  sponsors,
  settings: getSettings(settings),
});

const loadTournamentState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (parsed.users && parsed.tournaments) {
      return parsed;
    }

    if (parsed.teams && Array.isArray(parsed.teams) && parsed.teams.length > 0) {
      const tournament = createTournamentObject(
        'Torneo',
        parsed.teams,
        Array.isArray(parsed.groupMatches) ? parsed.groupMatches : initialMatches,
        Array.isArray(parsed.knockoutMatches) ? parsed.knockoutMatches : [],
        Array.isArray(parsed.transfers) ? parsed.transfers : [],
        Array.isArray(parsed.sponsors) ? parsed.sponsors : [],
        getSettings(parsed.settings)
      );
      return {
        users: ensureAdminUser([{ username: 'default', password: '', role: 'admin', fullName: 'Administrador' }]),
        currentUser: 'default',
        currentTournamentId: tournament.id,
        tournaments: { default: [tournament] },
      };
    }

    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const saveTournamentState = (state) => {
  try {
    const tournaments = state.currentUser && state.currentTournamentId
      ? (() => {
          const currentTournaments = state.tournaments[state.currentUser] || [];
          const updatedTournaments = currentTournaments.map((tournament) =>
            tournament.id === state.currentTournamentId
              ? {
                  ...tournament,
                  teams: state.teams,
                  groupMatches: state.groupMatches,
                  knockoutMatches: state.knockoutMatches,
                  transfers: state.transfers || [],
                  sponsors: state.sponsors || [],
                  settings: getSettings(state.settings),
                }
              : tournament
          );
          return {
            ...state.tournaments,
            [state.currentUser]: updatedTournaments,
          };
        })()
      : state.tournaments;

    const persistedState = {
      users: state.users,
      currentUser: null,
      currentTournamentId: null,
      tournaments,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    if (isFirebaseEnabled()) {
      saveFirebaseState(persistedState).catch(() => {});
    }
  } catch (error) {
    // Ignorar errores de almacenamiento
  }
};

const getCurrentTournament = (state) => {
  if (!state.currentUser || !state.currentTournamentId) return null;
  const userTournaments = state.tournaments[state.currentUser] || [];
  return userTournaments.find((tournament) => tournament.id === state.currentTournamentId) || userTournaments[0] || null;
};

const getInitialTournamentState = (persistedState) => {
  const currentTournament = persistedState ? getCurrentTournament(persistedState) : null;
  const settings = getSettings(currentTournament?.settings);
  const teams = applySelectionLogos(currentTournament?.teams || initialTeams);
  return {
    teams,
    groupMatches: normalizeScheduleForSettings(teams, currentTournament?.groupMatches || initialMatches, settings),
    knockoutMatches: currentTournament?.knockoutMatches || [],
    transfers: currentTournament?.transfers || [],
    sponsors: currentTournament?.sponsors || [],
    settings,
  };
};

const persistedState = typeof window !== 'undefined' ? loadTournamentState() : null;
const initialTournamentState = getInitialTournamentState(persistedState);

const initialAppState = {
  users: ensureAdminUser(persistedState?.users || []),
  currentUser: null,
  currentTournamentId: null,
  tournaments: persistedState?.tournaments || {},
  ...initialTournamentState,
};

let firebaseUnsubscribe = null;

const hydratePersistedState = (state, session = {}) => {
  const safeState = {
    users: ensureAdminUser(state?.users || []),
    currentUser: session.currentUser || null,
    currentTournamentId: session.currentTournamentId || null,
    tournaments: state?.tournaments || {},
  };

  return {
    ...safeState,
    ...getInitialTournamentState(safeState),
  };
};

const getTwoLegWinner = (leg1, leg2) => {
  if (!leg1 || !leg2) return null;
  const completeLeg1 = leg1.homeGoals !== null && leg1.awayGoals !== null;
  const completeLeg2 = leg2.homeGoals !== null && leg2.awayGoals !== null;
  if (!completeLeg1 || !completeLeg2) return null;
  if (leg1.homeId !== leg2.awayId || leg1.awayId !== leg2.homeId) return null;

  // teamA is leg1 home team (lower rank), teamB is leg1 away team (higher rank)
  const teamA = leg1.homeId;
  const teamB = leg1.awayId;
  const teamAGoals = leg1.homeGoals + leg2.awayGoals; // total goals for leg1 home team (lower rank)
  const teamBGoals = leg1.awayGoals + leg2.homeGoals; // total goals for leg1 away team (higher rank)

  if (teamAGoals > teamBGoals) return teamA;
  if (teamBGoals > teamAGoals) return teamB;

  // Tiebreaker: Liga MX Style (position in the table / better seed)
  // The lower the seed number, the better the position (1 is best, 8 is worst)
  // For the final, we can still use the seed as a logical fallback if needed,
  // although in reality they play overtime/penalties.
  const seedA = leg1.homeSeed;
  const seedB = leg1.awaySeed;

  if (seedA !== undefined && seedB !== undefined) {
    if (seedA < seedB) return teamA; // seedA is closer to 1 (better)
    if (seedB < seedA) return teamB; // seedB is closer to 1 (better)
  }

  return teamB; // fallback to the higher ranked team in our setup
};

const getSingleMatchWinner = (match) => {
  if (!match || match.homeGoals === null || match.awayGoals === null) return null;
  if (match.homeGoals > match.awayGoals) return match.homeId;
  if (match.awayGoals > match.homeGoals) return match.awayId;

  const seedHome = match.homeSeed;
  const seedAway = match.awaySeed;
  if (seedHome !== undefined && seedAway !== undefined) {
    if (seedHome < seedAway) return match.homeId;
    if (seedAway < seedHome) return match.awayId;
  }

  return match.homeId;
};

const knockoutStageOrder = ['Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];

const getKnockoutStageForSize = (size) => {
  if (size >= 32) return 'Dieciseisavos';
  if (size >= 16) return 'Octavos';
  if (size >= 8) return 'Cuartos';
  if (size >= 4) return 'Semifinal';
  return 'Final';
};

const getNextPowerOfTwo = (value) => {
  let size = 1;
  while (size < value) size *= 2;
  return size;
};

const sortQualifiedTeams = (teams) =>
  [...teams].sort((a, b) => {
    if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
    if ((b.goalDiff || 0) !== (a.goalDiff || 0)) return (b.goalDiff || 0) - (a.goalDiff || 0);
    if ((b.goalsFor || 0) !== (a.goalsFor || 0)) return (b.goalsFor || 0) - (a.goalsFor || 0);
    return a.name.localeCompare(b.name);
  });

const createKnockoutRound = (qualifiedTeams, stage, format = 'twoLeg') => {
  const sortedTeams = [...qualifiedTeams].sort((a, b) => a.seed - b.seed);
  const prefix = stage.toLowerCase().slice(0, 3);
  const matches = [];

  for (let index = 0; index < sortedTeams.length / 2; index += 1) {
    const higherSeed = sortedTeams[index];
    const lowerSeed = sortedTeams[sortedTeams.length - 1 - index];
    const pair = `${prefix}${index + 1}`;

    if (format === 'single') {
      matches.push({
        id: `${pair}-1`,
        homeId: higherSeed.id,
        awayId: lowerSeed.id,
        homeSeed: higherSeed.seed,
        awaySeed: lowerSeed.seed,
        homeGoals: null,
        awayGoals: null,
        stage,
        leg: 1,
        pair,
        knockoutFormat: 'single',
      });
      continue;
    }

    matches.push(
      {
        id: `${pair}-1`,
        homeId: lowerSeed.id,
        awayId: higherSeed.id,
        homeSeed: lowerSeed.seed,
        awaySeed: higherSeed.seed,
        homeGoals: null,
        awayGoals: null,
        stage,
        leg: 1,
        pair,
        knockoutFormat: 'twoLeg',
      },
      {
        id: `${pair}-2`,
        homeId: higherSeed.id,
        awayId: lowerSeed.id,
        homeSeed: higherSeed.seed,
        awaySeed: lowerSeed.seed,
        homeGoals: null,
        awayGoals: null,
        stage,
        leg: 2,
        pair,
        knockoutFormat: 'twoLeg',
      }
    );
  }

  return matches;
};

const advanceKnockoutStages = (knockoutMatches, settings = DEFAULT_SETTINGS) => {
  const currentMatches = [...knockoutMatches];
  const format = getSettings(settings).knockoutFormat;

  const buildWinners = (matches) => {
    const pairs = {};
    matches.forEach((match) => {
      pairs[match.pair] = pairs[match.pair] || [];
      pairs[match.pair].push(match);
    });

    const winners = [];
    const orderedPairIds = Object.keys(pairs).sort((a, b) => {
      const aNumber = Number(a.match(/\d+$/)?.[0] || 0);
      const bNumber = Number(b.match(/\d+$/)?.[0] || 0);
      return aNumber - bNumber;
    });

    for (const pairId of orderedPairIds) {
      const legs = pairs[pairId] || [];
      const leg1 = legs.find((match) => match.leg === 1);
      const leg2 = legs.find((match) => match.leg === 2);
      const pairFormat = leg1?.knockoutFormat || format;
      const winnerId = pairFormat === 'single' ? getSingleMatchWinner(leg1) : getTwoLegWinner(leg1, leg2);
      if (!winnerId) return null;
      const winnerSeed =
        leg1?.homeId === winnerId
          ? leg1.homeSeed
          : leg1?.awayId === winnerId
          ? leg1.awaySeed
          : leg2?.homeId === winnerId
          ? leg2.homeSeed
          : leg2?.awayId === winnerId
          ? leg2.awaySeed
          : null;
      winners.push({ id: winnerId, seed: winnerSeed });
    }
    return winners;
  };

  for (let index = 0; index < knockoutStageOrder.length - 1; index += 1) {
    const stage = knockoutStageOrder[index];
    const nextStage = knockoutStageOrder[index + 1];
    const stageMatches = currentMatches.filter((match) => match.stage === stage);
    const nextStageMatches = currentMatches.filter((match) => match.stage === nextStage);

    if (stageMatches.length > 0 && nextStageMatches.length === 0) {
      const winners = buildWinners(stageMatches);
      if (winners) {
        currentMatches.push(...createKnockoutRound(winners, nextStage, format));
      }
    }
  }

  return currentMatches;
};

const calculateStandings = (teams, matches, settings = DEFAULT_SETTINGS) => {
  const currentSettings = getSettings(settings);
  const stats = teams.reduce((acc, team) => {
    acc[team.id] = {
      id: team.id,
      name: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };
    return acc;
  }, {});

  matches.forEach((match) => {
    const { homeId, awayId, homeGoals, awayGoals } = match;

    if (homeGoals === null || awayGoals === null) {
      return;
    }

    const home = stats[homeId];
    const away = stats[awayId];

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.wins += 1;
      away.losses += 1;
      home.points += currentSettings.pointForWin;
    } else if (homeGoals < awayGoals) {
      away.wins += 1;
      home.losses += 1;
      away.points += currentSettings.pointForWin;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  return Object.values(stats)
    .map((team) => ({
      ...team,
      goalDiff: team.goalsFor - team.goalsAgainst,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });
};

const useTournamentStore = create((set, get) => ({
  users: ensureAdminUser(persistedState?.users || []),
  currentUser: null,
  currentTournamentId: null,
  tournaments: persistedState?.tournaments || {},
  ...initialTournamentState,
  cloudStatus: isFirebaseEnabled() ? 'pending' : 'local',
  startCloudSync: async () => {
    if (!isFirebaseEnabled()) {
      set({ cloudStatus: 'local' });
      return;
    }

    set({ cloudStatus: 'syncing' });
    try {
      const cloudState = await loadFirebaseState();
      if (cloudState) {
        const session = {
          currentUser: get().currentUser,
          currentTournamentId: get().currentTournamentId,
        };
        const hydratedState = hydratePersistedState(cloudState, session);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...cloudState,
          currentUser: null,
          currentTournamentId: null,
        }));
        set({ ...hydratedState, cloudStatus: 'synced' });
      } else {
        saveTournamentState(get());
        set({ cloudStatus: 'synced' });
      }

      if (!firebaseUnsubscribe) {
        firebaseUnsubscribe = subscribeFirebaseState((cloudState) => {
          const session = {
            currentUser: get().currentUser,
            currentTournamentId: get().currentTournamentId,
          };
          const hydratedState = hydratePersistedState(cloudState, session);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...cloudState,
            currentUser: null,
            currentTournamentId: null,
          }));
          set({ ...hydratedState, cloudStatus: 'synced' });
        });
      }
    } catch (error) {
      set({ cloudStatus: 'error' });
    }
  },
  registerUser: (username, password, leagueName, useDemoData = false, category = 'Varonil Libre', tournamentFormat = 'ligaMx', groupCount = 4) => {
    const state = get();
    if (!username || !password) {
      return { success: false, message: 'Usuario y contraseña son obligatorios.' };
    }
    if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'El usuario ya existe.' };
    }

    const tName = leagueName ? leagueName.trim() : `${username} - Torneo 1`;
    const settings = getSettings({ category, tournamentFormat, groupCount });
    const tournament = createTournamentObject(
      tName,
      useDemoData ? initialTeams : [],
      useDemoData ? createScheduleForSettings(initialTeams, settings) : [],
      [], // knockout
      [], // transfers
      [], // sponsors
      settings
    );
    const users = ensureAdminUser([...state.users, { username, password, fullName: username, role: 'user' }]);
    const tournaments = {
      ...state.tournaments,
      [username]: [tournament],
    };
    const nextState = {
      ...state,
      users,
      currentUser: username,
      currentTournamentId: tournament.id,
      tournaments,
      teams: tournament.teams,
      groupMatches: tournament.groupMatches,
      knockoutMatches: tournament.knockoutMatches,
      transfers: tournament.transfers,
      sponsors: tournament.sponsors,
      settings: tournament.settings,
    };
    saveTournamentState(nextState);
    set(nextState);
    return { success: true, message: 'Cuenta creada. Bienvenido.' };
  },
  loginUser: (username, password) => {
    const state = get();
    const user = state.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    if (user.password !== password) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }
    const userKey = user.username;
    const userTournaments = state.tournaments[userKey] || [];
    let tournament = userTournaments.find((t) => t.id === state.currentTournamentId) || userTournaments[0];
    if (!tournament) {
      tournament = createTournamentObject(`${username} - Torneo 1`, [], [], [], [], [], DEFAULT_SETTINGS);
      const tournaments = { ...state.tournaments, [userKey]: [tournament] };
      const nextState = {
        ...state,
        currentUser: userKey,
        currentTournamentId: tournament.id,
        tournaments,
        teams: tournament.teams,
        groupMatches: tournament.groupMatches,
        knockoutMatches: tournament.knockoutMatches,
        transfers: tournament.transfers,
        sponsors: tournament.sponsors || [],
        settings: getSettings(tournament.settings),
      };
      saveTournamentState(nextState);
      set(nextState);
      return { success: true, message: 'Bienvenido.' };
    }
    const settings = getSettings(tournament.settings);
    const teams = applySelectionLogos(tournament.teams);
    const groupMatches = normalizeScheduleForSettings(teams, tournament.groupMatches, settings);
    const nextState = {
      ...state,
      currentUser: userKey,
      currentTournamentId: tournament.id,
      teams,
      groupMatches,
      knockoutMatches: tournament.knockoutMatches,
      transfers: tournament.transfers,
      sponsors: tournament.sponsors || [],
      settings,
    };
    saveTournamentState(nextState);
    set(nextState);
    return { success: true, message: 'Bienvenido.' };
  },
  createManagedUser: (fullName) => {
    const state = get();
    const currentUser = state.users.find((user) => user.username === state.currentUser);
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Solo un administrador puede crear usuarios.' };
    }

    const name = fullName.trim();
    if (!name) {
      return { success: false, message: 'Escribe el nombre de la persona.' };
    }

    const username = createUsernameFromName(name, state.users);
    const password = createPassword();
    const settings = getSettings();
    const tournament = createTournamentObject(`${name} - Liga`, [], [], [], [], [], settings);
    const users = ensureAdminUser([
      ...state.users,
      { username, password, fullName: name, role: 'user', createdAt: new Date().toISOString() },
    ]);
    const tournaments = {
      ...state.tournaments,
      [username]: [tournament],
    };
    const nextState = { ...state, users, tournaments };

    saveTournamentState(nextState);
    set(nextState);

    return {
      success: true,
      message: 'Usuario generado correctamente.',
      credentials: { fullName: name, username, password },
    };
  },
  logoutUser: () =>
    set((state) => {
      const nextState = {
        ...state,
        currentUser: null,
        currentTournamentId: null,
      };
      saveTournamentState(nextState);
      return nextState;
    }),
  createTournament: (name, useDemoData = false, category = 'Varonil Libre', tournamentFormat = 'ligaMx', groupCount = 4) =>
    set((state) => {
      if (!state.currentUser) return state;
      const tournamentName = name || `Torneo ${Date.now()}`;
      const settings = getSettings({ category, tournamentFormat, groupCount });
      const tournament = createTournamentObject(
        tournamentName,
        useDemoData ? initialTeams : [],
        useDemoData ? createScheduleForSettings(initialTeams, settings) : [],
        [],
        [],
        [],
        settings
      );
      const userTournaments = state.tournaments[state.currentUser] || [];
      const tournaments = {
        ...state.tournaments,
        [state.currentUser]: [...userTournaments, tournament],
      };
      const nextState = {
        ...state,
        tournaments,
        currentTournamentId: tournament.id,
        teams: tournament.teams,
        groupMatches: tournament.groupMatches,
        knockoutMatches: tournament.knockoutMatches,
        transfers: tournament.transfers,
        sponsors: tournament.sponsors,
        settings: tournament.settings,
      };
      saveTournamentState(nextState);
      return nextState;
    }),
  switchTournament: (tournamentId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const tournament = (state.tournaments[state.currentUser] || []).find((t) => t.id === tournamentId);
      if (!tournament) return state;
      const settings = getSettings(tournament.settings);
      const teams = applySelectionLogos(tournament.teams);
      const groupMatches = normalizeScheduleForSettings(teams, tournament.groupMatches, settings);
      const nextState = {
        ...state,
        currentTournamentId: tournament.id,
        teams,
        groupMatches,
        knockoutMatches: tournament.knockoutMatches,
        transfers: tournament.transfers,
        sponsors: tournament.sponsors || [],
        settings,
      };
      saveTournamentState(nextState);
      return nextState;
    }),
  deleteTournament: (tournamentId) =>
    set((state) => {
      if (!state.currentUser) return state;
      const userTournaments = (state.tournaments[state.currentUser] || []).filter((t) => t.id !== tournamentId);
      const nextTournament = userTournaments[0] || createTournamentObject(`${state.currentUser} - Torneo 1`, [], [], [], [], [], DEFAULT_SETTINGS);
      const safeTournaments = userTournaments.length > 0 ? userTournaments : [nextTournament];
      const tournaments = {
        ...state.tournaments,
        [state.currentUser]: safeTournaments,
      };
      const nextState = {
        ...state,
        tournaments,
        currentTournamentId: nextTournament.id,
        teams: nextTournament.teams,
        groupMatches: nextTournament.groupMatches,
        knockoutMatches: nextTournament.knockoutMatches,
        transfers: nextTournament.transfers,
        sponsors: nextTournament.sponsors || [],
        settings: getSettings(nextTournament.settings),
      };
      saveTournamentState(nextState);
      return nextState;
    }),
  addSponsor: (name, logoUrl, link) =>
    set((state) => {
      const sponsors = [
        ...(state.sponsors || []),
        { id: `sp-${Date.now()}`, name, logo: logoUrl, link },
      ];
      const nextState = { ...state, sponsors };
      saveTournamentState(nextState);
      return nextState;
    }),
  removeSponsor: (sponsorId) =>
    set((state) => {
      const sponsors = (state.sponsors || []).filter((s) => s.id !== sponsorId);
      const nextState = { ...state, sponsors };
      saveTournamentState(nextState);
      return nextState;
    }),
  updateSettings: (updates) =>
    set((state) => {
      const settings = {
        ...getSettings(state.settings),
        ...updates,
      };
      let tournaments = state.tournaments;
      let name = state.tournaments[state.currentUser]?.find((t) => t.id === state.currentTournamentId)?.name || 'Torneo';
      if (updates.name && state.currentUser && state.currentTournamentId) {
        name = updates.name.trim();
        const userTournaments = state.tournaments[state.currentUser] || [];
        tournaments = {
          ...state.tournaments,
          [state.currentUser]: userTournaments.map((t) =>
            t.id === state.currentTournamentId ? { ...t, name } : t
          ),
        };
      }
      const nextState = { ...state, settings, tournaments };
      saveTournamentState(nextState);
      return nextState;
    }),
  getStandings: () => calculateStandings(get().teams, get().groupMatches, get().settings),
  getGroupedStandings: () => {
    const state = get();
    const settings = getSettings(state.settings);
    if (settings.tournamentFormat !== 'worldCup') return [];

    return createGroupAssignments(state.teams, settings.groupCount).map((group) => {
      const teamIds = new Set(group.teams.map((team) => team.id));
      const groupMatches = state.groupMatches.filter((match) => match.group === group.id);
      return {
        ...group,
        standings: calculateStandings(
          state.teams.filter((team) => teamIds.has(team.id)),
          groupMatches,
          settings
        ),
      };
    });
  },
  updateMatchScore: (matchId, homeGoals, awayGoals) =>
    set((state) => {
      const groupMatches = state.groupMatches.map((match) =>
        match.id === matchId
          ? { ...match, homeGoals, awayGoals }
          : match
      );
      const knockoutMatches = state.knockoutMatches.map((match) =>
        match.id === matchId
          ? { ...match, homeGoals, awayGoals }
          : match
      );
      const advancedKnockoutMatches = advanceKnockoutStages(knockoutMatches, state.settings);
      const nextState = { ...state, groupMatches, knockoutMatches: advancedKnockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  addPlayer: (teamId, playerName) =>
    set((state) => {
      const playerId = `p${Date.now()}`;
      const teams = state.teams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              players: [
                ...(t.players || []),
                { id: playerId, name: playerName, photo: '', goals: 0, assists: 0, yellowCards: 0, redCards: 0 },
              ],
            }
          : t
      );
      const nextState = { ...state, teams };
      saveTournamentState(nextState);
      return nextState;
    }),
  updatePlayer: (playerId, updates) =>
    set((state) => {
      const teams = state.teams.map((t) => ({
        ...t,
        players: (t.players || []).map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
      }));
      const nextState = { ...state, teams };
      saveTournamentState(nextState);
      return nextState;
    }),
  removePlayer: (playerId) =>
    set((state) => {
      const teams = state.teams.map((t) => ({
        ...t,
        players: (t.players || []).filter((p) => p.id !== playerId),
      }));
      const nextState = { ...state, teams };
      saveTournamentState(nextState);
      return nextState;
    }),
  recordPlayerGoals: (matchId, homeGoals, awayGoals, homeScorers = [], awayScorers = []) =>
    set((state) => {
      const previousMatch = [...state.groupMatches, ...state.knockoutMatches].find((match) => match.id === matchId);
      const previousScorers = previousMatch?.playerScorers || { home: [], away: [] };

      const countByPlayer = (playerIds = []) =>
        playerIds.reduce((acc, playerId) => {
          acc[playerId] = (acc[playerId] || 0) + 1;
          return acc;
        }, {});

      const previousGoalCounts = countByPlayer([
        ...(previousScorers.home || []),
        ...(previousScorers.away || []),
      ]);
      const nextGoalCounts = countByPlayer([...homeScorers, ...awayScorers]);

      // update matches
      const groupMatches = state.groupMatches.map((match) =>
        match.id === matchId
          ? { ...match, homeGoals, awayGoals, playerScorers: { home: homeScorers, away: awayScorers } }
          : match
      );
      const knockoutMatches = state.knockoutMatches.map((match) =>
        match.id === matchId
          ? { ...match, homeGoals, awayGoals, playerScorers: { home: homeScorers, away: awayScorers } }
          : match
      );

      const teams = state.teams.map((team) => ({
        ...team,
        players: (team.players || []).map((player) => {
          const previousGoals = previousGoalCounts[player.id] || 0;
          const nextGoals = nextGoalCounts[player.id] || 0;
          const delta = nextGoals - previousGoals;
          return delta === 0
            ? player
            : { ...player, goals: Math.max(0, (player.goals || 0) + delta) };
        }),
      }));

      const advancedKnockoutMatches = advanceKnockoutStages(knockoutMatches, state.settings);
      const nextState = { ...state, teams, groupMatches, knockoutMatches: advancedKnockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  transferPlayer: (playerId, toTeamId) =>
    set((state) => {
      let fromTeamId = '';
      const teams = state.teams.map((t) => {
        const playerExists = (t.players || []).find((p) => p.id === playerId);
        if (playerExists) {
          fromTeamId = t.id;
          return {
            ...t,
            players: (t.players || []).filter((p) => p.id !== playerId),
          };
        }
        return t;
      });

      const finalTeams = teams.map((t) => {
        if (t.id === toTeamId) {
          const player = state.teams
            .flatMap((team) => (team.players || []).map((p) => ({ ...p, originalTeamId: team.id })))
            .find((p) => p.id === playerId);
          if (player) {
            const { originalTeamId, ...playerData } = player;
            return {
              ...t,
              players: [...(t.players || []), playerData],
            };
          }
        }
        return t;
      });

      const transfers = [
        ...(state.transfers || []),
        { id: `tr-${Date.now()}`, playerId, fromTeam: fromTeamId, toTeam: toTeamId, date: new Date().toISOString() },
      ];

      const nextState = { ...state, teams: finalTeams, transfers };
      saveTournamentState(nextState);
      return nextState;
    }),
  recordCard: (playerId, cardType) =>
    set((state) => {
      const teams = state.teams.map((t) => ({
        ...t,
        players: (t.players || []).map((p) => {
          if (p.id === playerId) {
            const updated = { ...p };
            if (cardType === 'yellow') {
              updated.yellowCards = (p.yellowCards || 0) + 1;
              // Si tiene 2 amarillas, convierte a roja
              if (updated.yellowCards >= 2) {
                updated.redCards = (p.redCards || 0) + 1;
                updated.yellowCards = 0;
              }
            } else if (cardType === 'red') {
              updated.redCards = (p.redCards || 0) + 1;
            }
            return updated;
          }
          return p;
        }),
      }));
      const nextState = { ...state, teams };
      saveTournamentState(nextState);
      return nextState;
    }),
  updateMatchDetails: (matchId, updates) =>
    set((state) => {
      const allowedUpdates = {
        scheduledDate: updates.scheduledDate || '',
        scheduledTime: updates.scheduledTime || '',
        venue: updates.venue?.trim() || '',
      };
      const groupMatches = state.groupMatches.map((match) =>
        match.id === matchId ? { ...match, ...allowedUpdates } : match
      );
      const knockoutMatches = state.knockoutMatches.map((match) =>
        match.id === matchId ? { ...match, ...allowedUpdates } : match
      );
      const nextState = { ...state, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  recordMatchCards: (matchId, cards = []) =>
    set((state) => {
      const groupMatches = state.groupMatches.map((match) =>
        match.id === matchId ? { ...match, cards } : match
      );
      const knockoutMatches = state.knockoutMatches.map((match) =>
        match.id === matchId ? { ...match, cards } : match
      );

      const cardTotals = [...groupMatches, ...knockoutMatches].reduce((acc, match) => {
        (match.cards || []).forEach(({ playerId, type }) => {
          if (!playerId || !type) return;
          acc[playerId] = acc[playerId] || { yellow: 0, red: 0 };
          acc[playerId][type] += 1;
        });
        return acc;
      }, {});

      const teams = state.teams.map((team) => ({
        ...team,
        players: (team.players || []).map((player) => {
          const totals = cardTotals[player.id] || { yellow: 0, red: 0 };
          return {
            ...player,
            yellowCards: totals.yellow % 2,
            redCards: totals.red + Math.floor(totals.yellow / 2),
          };
        }),
      }));

      const nextState = { ...state, teams, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  getPlayerTeam: (playerId) => {
    const state = get();
    return state.teams.find((t) => (t.players || []).find((p) => p.id === playerId))?.id || null;
  },
  addTeam: (name) =>
    set((state) => {
      const teamId = `t${Date.now()}`;
      const teams = [...state.teams, { id: teamId, name, logo: getSelectionLogo(name), players: [] }];
      const groupMatches = createScheduleForSettings(teams, state.settings);
      const knockoutMatches = [];
      const nextState = { ...state, teams, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  updateTeamName: (teamId, name) =>
    set((state) => {
      const teams = state.teams.map((team) =>
        team.id === teamId ? { ...team, name, logo: team.logo || getSelectionLogo(name) } : team
      );
      const groupMatches = createScheduleForSettings(teams, state.settings);
      const knockoutMatches = [];
      const nextState = { ...state, teams, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  updateTeamGroup: (teamId, group) =>
    set((state) => {
      const teams = state.teams.map((team) =>
        team.id === teamId ? { ...team, group } : team
      );
      const groupMatches = createScheduleForSettings(teams, state.settings);
      const knockoutMatches = [];
      const nextState = { ...state, teams, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  removeTeam: (teamId) =>
    set((state) => {
      const teams = state.teams.filter((team) => team.id !== teamId);
      const groupMatches = createScheduleForSettings(teams, state.settings);
      const knockoutMatches = [];
      const nextState = { ...state, teams, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  generateSchedule: () =>
    set((state) => {
      const groupMatches = createScheduleForSettings(state.teams, state.settings);
      const knockoutMatches = [];
      const nextState = { ...state, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  applyManualRoundFixtures: (round, fixtures = []) => {
    const state = get();
    const targetRound = Number(round) || 1;
    const validFixtures = fixtures.map((fixture) => {
      const home = findTeamByName(state.teams, fixture.home);
      const away = findTeamByName(state.teams, fixture.away);
      return { ...fixture, home, away };
    });
    const missingTeams = validFixtures
      .flatMap((fixture) => [
        fixture.home ? null : fixture.home,
        fixture.away ? null : fixture.away,
      ])
      .filter(Boolean);

    if (validFixtures.some((fixture) => !fixture.home || !fixture.away)) {
      const missingNames = fixtures
        .flatMap((fixture, index) => [
          validFixtures[index].home ? null : fixture.home,
          validFixtures[index].away ? null : fixture.away,
        ])
        .filter(Boolean);
      return {
        success: false,
        message: `No encontre estos equipos: ${missingNames.join(', ')}.`,
      };
    }

    const roundMatches = state.groupMatches.filter((match) => match.round === targetRound);
    if (roundMatches.length < validFixtures.length) {
      return {
        success: false,
        message: `La jornada ${targetRound} solo tiene ${roundMatches.length} partidos disponibles.`,
      };
    }

    set((currentState) => {
      const matchesForRound = currentState.groupMatches.filter((match) => match.round === targetRound);
      const fixtureByMatchId = {};
      matchesForRound.slice(0, validFixtures.length).forEach((match, index) => {
        fixtureByMatchId[match.id] = validFixtures[index];
      });

      const groupMatches = currentState.groupMatches.map((match) => {
        const fixture = fixtureByMatchId[match.id];
        if (!fixture) return match;
        const group = fixture.home.group || fixture.away.group || match.group || null;
        return {
          ...match,
          homeId: fixture.home.id,
          awayId: fixture.away.id,
          homeGoals: null,
          awayGoals: null,
          playerScorers: undefined,
          cards: [],
          group,
          stage: getGroupName(group),
        };
      });
      const nextState = { ...currentState, groupMatches, knockoutMatches: [] };
      saveTournamentState(nextState);
      return nextState;
    });

    return { success: true, message: `Jornada ${targetRound} actualizada correctamente.` };
  },
  generateKnockoutBracket: () =>
    set((state) => {
      const settings = getSettings(state.settings);
      if (settings.tournamentFormat === 'long') {
        return state;
      }

      const standings = settings.tournamentFormat === 'worldCup'
        ? (() => {
            const groupTables = createGroupAssignments(state.teams, settings.groupCount).map((group) => {
              const teamIds = new Set(group.teams.map((team) => team.id));
              const groupMatches = state.groupMatches.filter((match) => match.group === group.id);
              return calculateStandings(
                state.teams.filter((team) => teamIds.has(team.id)),
                groupMatches,
                settings
              );
            });

            const directQualifiers = groupTables.flatMap((table) => table.slice(0, 2));
            const targetSize = Math.max(8, getNextPowerOfTwo(directQualifiers.length));
            const extraQualifiers = groupTables
              .flatMap((table) => table.slice(2))
              .filter(Boolean)
              .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
                if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
                return a.name.localeCompare(b.name);
              });

            return sortQualifiedTeams([...directQualifiers, ...extraQualifiers].slice(0, targetSize));
          })()
        : calculateStandings(state.teams, state.groupMatches, settings).slice(0, 8);
      if (standings.length < 8 || standings.length !== getNextPowerOfTwo(standings.length)) {
        return state;
      }
      const seededTeams = standings.map((team, index) => ({ ...team, seed: index + 1 }));
      const knockoutMatches = createKnockoutRound(
        seededTeams,
        getKnockoutStageForSize(seededTeams.length),
        settings.knockoutFormat
      );
      const nextState = { ...state, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
  updateTeamLogo: (teamId, logoUrl) =>
    set((state) => {
      const teams = state.teams.map((team) =>
        team.id === teamId ? { ...team, logo: logoUrl } : team
      );
      const nextState = { ...state, teams };
      saveTournamentState(nextState);
      return nextState;
    }),
  updatePlayerPhoto: (playerId, photoUrl) =>
    set((state) => {
      const teams = state.teams.map((t) => ({
        ...t,
        players: (t.players || []).map((p) =>
          p.id === playerId ? { ...p, photo: photoUrl } : p
        ),
      }));
      const nextState = { ...state, teams };
      saveTournamentState(nextState);
      return nextState;
    }),
  resetMatches: () =>
    set((state) => {
      const groupMatches = createScheduleForSettings(state.teams, state.settings);
      const knockoutMatches = [];
      const nextState = { ...state, groupMatches, knockoutMatches };
      saveTournamentState(nextState);
      return nextState;
    }),
}));

export default useTournamentStore;
