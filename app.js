/**
 * Represents the team list element in the DOM.
 * @type {Element}
 */
const teamList = document.querySelector('.team-list');

/**
 * Represents the stored version retrieved from local storage.
 * @type {string|null}
 */
let storedVersion = localStorage.getItem('appVersion');

/**
 * Represents the current version of the application.
 * @type {string}
 */
let currentVersion = '1.1.0';

/**
 * Represents the element that displays version information in the DOM.
 * @type {Element}
 */
let versionInfo = document.querySelector('.version-info-text');
versionInfo.innerText = `Version ${currentVersion}`;

/**
 * Represents the base URL of the AOE4 World website.
 * @type {string}
 */
const url = 'https://aoe4world.com';

/**
 * Represents a sorted list of teams to track.
 * @typedef {Object} TeamToTrack
 * @property {string} id - The unique identifier of the player. example: 14711962-Samui_Sanchez - (https://aoe4world.com/players/14711962-Samui_Sanchez)
 * @property {string} nickname - The nickname or name of the player you want.
 */

/**
 * Represents an array of teams to track, sorted alphabetically by nickname.
 * @type {TeamToTrack[]}
 */
const teamToTrack = [
  { id: '9505061-tito', nickname: 'tito' },
  { id: '9514244-Meow', nickname: 'Meow' },
  { id: '14939680-DikiyXYI', nickname: 'DikiyXYI' },
  { id: '10265510-MidTortoise9435', nickname: 'MidTortoise9435' },
  { id: '14711962-Samui_Sanchez', nickname: 'Samui_Sanchez' },
  { id: '14204836-Fireflyczyk', nickname: 'Fireflyczyk' },
  { id: '11545849-xWilsen', nickname: 'xWilsen' },
  { id: '12169683-Pahlava', nickname: 'Pahlava' },
].sort((a, b) => a.nickname.localeCompare(b.nickname));

/**
 * Logs whether the player is currently playing a game.
 * @param {string} playerId - The unique identifier of the player.
 * @returns {boolean} - True if the player is currently playing, false otherwise.
 */
const logPlayerGames = async (playerId) => {
  try {
    const response = await fetch(`${url}/api/v0/players/${playerId}/games`);
    const data = await response.json();
    const games = data.games;

    if (games.length > 0) {
      const playingNow = games[0].ongoing || games[0].just_finished;
      return playingNow;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Updates the playing status of team members.
 * @returns {Promise<void>}
 */
const updatePlayingStatus = async () => {
  for (const member of teamToTrack) {
    const playingNow = await logPlayerGames(member.id);
    /* Find the li element for the member */
    const memberLi = document.querySelector(`li[data-member-id="${member.id}"]`);

    memberLi.classList.toggle('playing', playingNow);
    memberLi.querySelector('.playing-badge').classList.toggle('playing', playingNow);
    memberLi.querySelector('.playing-badge').classList.toggle('not-playing', !playingNow);
    memberLi.querySelector('.playing-badge').textContent = playingNow ? '' : ' ';
  }
};

/**
 * Generates an HTML list of team members' names with associated links and placeholders for their playing status.
 * @type {string}
 */
const namesList = teamToTrack
  .map(
    (member) =>
      `<li class='dis-friends' data-member-id="${member.id}">
      <span class="nickname-container">
        <span class="nickname">Nickname:
          <a href='https://aoe4world.com/players/${member.id}' target="_blank">${member.nickname}</a>
        </span>
        <span class="playing-badge">Loading...</span>
      </span><br>
    </li>
    `
  )
  .join('');

teamList.innerHTML = `${namesList}`;

/* Update the playing status */
updatePlayingStatus();

/**
 * Retrieves game information for a player with the given playerId.
 * @param {string} playerId - The unique identifier of the player.
 * @returns {Promise<Object|null>} - A promise that resolves to an object containing game information if available, or null if no game information is found or an error occurs.
 */
const getPlayerGameInfo = async (playerId) => {
  try {
    const response = await fetch(`${url}/api/v0/players/${playerId}/games`);
    const dispatchData = await response.json();

    const games = dispatchData.games;
    if (games.length > 0) {
      const [ongoingGame, justFinishedGame] = games.filter(game => game.ongoing || game.just_finished);

      if (ongoingGame || justFinishedGame) {
        const gameInfo = {
          playerId,
          team1: ongoingGame.teams[0],
          team2: ongoingGame.teams[1],
          map: ongoingGame.map,
          started_at: ongoingGame.started_at
        };
        return gameInfo;
      } else if (games.length > 1) {
        const [secondGameOngoing, secondGameJustFinished] = games.slice(1).filter(game => game.ongoing || game.just_finished);

        if (secondGameOngoing || secondGameJustFinished) {
          const gameInfo = {
            playerId,
            team1: secondGameOngoing.teams[0],
            team2: secondGameOngoing.teams[1],
            map: secondGameOngoing.map,
            started_at: secondGameOngoing.started_at
          };
          return gameInfo;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};


/**
 * Renders game information for a given game.
 * @param {Object} gameData - The game data object containing player and game information.
 * @param {string} gameData.playerId - The unique identifier of the player.
 * @param {Array<Object>} gameData.team1 - An array of player objects representing Team 1.
 * @param {Array<Object>} gameData.team2 - An array of player objects representing Team 2.
 * @param {string} gameData.map - The map on which the game is played.
 * @param {string} gameData.started_at - The timestamp indicating when the game started.
 * @returns {void}
 */
const renderGameInfo = async ({ playerId, team1, team2, map, started_at }) => {
  const winRateColor = (winRate) => {
    if (winRate < 30) return 'red';
    if (winRate <= 50) return 'orange';
    return 'green';
  };

  const url = 'https://aoe4world.com';

  /**
 * Fetches additional data for a player.
 * @param {Object} player - The player object containing profile information.
 * @param {string} player.name - The name of the player.
 * @param {string} player.civilization - The civilization chosen by the player.
 * @param {string} player.profile_id - The unique identifier of the player's profile.
 * @returns {Object} - An object containing additional data for the player.
 */
  const fetchPlayerData = async (player) => {
    const response = await fetch(`${url}/api/v0/players/${player.profile_id}`);
    const data = await response.json();

    const rmTeam = data.modes.rm_team || {};

    const date = new Date(started_at)
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedTime = date.toLocaleTimeString("en-GB");

    return {
      name: player.name,
      civilization: player.civilization,
      profile_id: player.profile_id,
      civilizationsByWinRate:
        rmTeam.civilizations
          ?.sort((a, b) => b.win_rate - a.win_rate)
          ?.slice(0, 3)
          ?.map((civ) => `${civ.civilization} (${civ.win_rate.toFixed(1)}%)`)
          ?.join(', ') ?? [],
      civilizationsByPickRate:
        rmTeam.civilizations
          ?.sort((a, b) => b.pick_rate - a.pick_rate)
          ?.slice(0, 3)
          ?.map((civ) => `${civ.civilization} (${civ.pick_rate.toFixed(1)}%)`)
          ?.join(', ') ?? [],
      rating: rmTeam.rating,
      rank: rmTeam.rank,
      gamesCount: rmTeam.games_count,
      winsCount: rmTeam.wins_count,
      streak: rmTeam.streak,
      started_at_date: formattedDate,
      started_at_time: formattedTime
    };
  };

  /**
   * Fetches additional data for all players in the teams.
   * @param {Array} team1 - The array of players in Team 1.
   * @param {Array} team2 - The array of players in Team 2.
   * @returns {Promise<Array>} - A promise that resolves to an array of player data objects.
   */
  const players = await Promise.all([...team1, ...team2].map(({ player }) => fetchPlayerData(player)));

  /**
 * Creates a player div HTML element with the provided player data.
 * @param {Object} playerData - The player data object.
 * @param {string} playerData.name - The name of the player.
 * @param {number} playerData.rating - The player's rating.
 * @param {number} playerData.rank - The player's rank.
 * @param {number} playerData.gamesCount - The total number of games played by the player.
 * @param {number} playerData.winsCount - The number of wins by the player.
 * @param {number} playerData.streak - The player's current win/loss streak.
 * @param {string} playerData.civilization - The player's current civilization.
 * @param {string} playerData.profile_id - The player's profile ID.
 * @param {string} playerData.civilizationsByWinRate - The civilizations ranked by win rate.
 * @param {string} playerData.civilizationsByPickRate - The civilizations ranked by pick rate.
 * @param {string} playerData.started_at_date - The date the player started playing.
 * @param {string} playerData.started_at_time - The time the player started playing.
 * @param {number} index - The index of the player in the list.
 * @returns {string} - The HTML code representing the player div.
 */
  const createPlayerDiv = (
    {
      name,
      rating,
      rank,
      gamesCount,
      winsCount,
      streak,
      civilization,
      profile_id,
      civilizationsByWinRate,
      civilizationsByPickRate,
      started_at_date,
      started_at_time
    },
    index
  ) => {
    const winPercentage = (winsCount / gamesCount) * 100;
    const winPercentageColor = winPercentage >= 50 ? 'green' : 'red';
    const colorSpan = (civ) =>
      `<span style="color:${winRateColor(Number(civ.match(/\d+(?:\.\d+)?/)[0]))}">${civ}</span>`;
    const formatCount = (count) => {
      const total = count || 0;
      const wins = winsCount || 0;
      const loses = total - wins;
      return `<span style="color:black">${total}</span>-<span style="color:green">${wins}</span>-<span style="color:red">${loses}</span>`;
    };
    const streakColor = streak >= 0 ? 'green' : 'red';
    const hasImportantBadge =
      civilizationsByWinRate && typeof civilizationsByWinRate === 'string'
        ? civilizationsByWinRate
          .split(', ')
          .some((civ) => civ.split('(')[0].trim() === civilization && Number(civ.match(/\d+(?:\.\d+)?/)[0]) >= 50)
        : false;
    const importantBadge = hasImportantBadge
      ? '<span style="color: red;">important</span>'
      : '<span style="color: green;">Not important</span>';

    const playerDiv = `
      <div class='player-box'>
        <a class='player-name' href='https://aoe4world.com/players/${profile_id}' target="_blank"><strong>${index + 1
      }) ${name}</strong></a>  
        ${rating ? `<p class='player-rating'>Rating: <strong>${rating}</strong></p>` : ''}
        ${rank ? `<p class='player-rank'>Rank: <strong>${rank}</strong></p>` : ''}
        <p class='player-civilization'>Started at: <strong>${started_at_date} - ${started_at_time}</strong></p>
        <p class='player-games'>Games: <strong>${formatCount(gamesCount)}</strong></p>
        <p>Win Rate: <span style="color:${winPercentageColor}">${winPercentage.toFixed(2)}%</span></p>
        ${streak ? `<p class='player-streak'>Streak: <strong style="color:${streakColor}">${streak}</strong></p>` : ''}
        <p class='player-civilization'>Playing now as: <strong>${civilization}</strong></p>        
        <p class='important-push'>Push: <strong> ${importantBadge}</strong></p>    
        <p class='player-pick-rate'>Pick Rate:</p>
        <ol>${civilizationsByPickRate.length > 0
        ? civilizationsByPickRate
          .split(', ')
          .map((civ) => `<li>${colorSpan(civ)}</li>`)
          .join('')
        : '<li>No data available</li>'
      }</ol>
        <p class='player-win-rate'>Win Rate:</p>
        <ol>${civilizationsByWinRate.length > 0
        ? civilizationsByWinRate
          .split(', ')
          .map((civ) => `<li>${colorSpan(civ)}</li>`)
          .join('')
        : '<li>No data available</li>'
      }</ol>
      </div>
    `;
    return playerDiv;
  };

  /**
 * Calculates the player's win chance based on their win rate, streak, and rating.
 * @param {number} winRate - The player's win rate percentage.
 * @param {number} streak - The player's win/loss streak.
 * @param {Object} options - Additional options.
 * @param {number} options.rating - The player's rating.
 * @returns {number} - The calculated win chance, ranging from 0 to 1.
 */
  const calculatePlayerWinChance = (winRate, streak, { rating }) => {
    if (isNaN(rating)) rating = 0.5;
    if (isNaN(winRate)) winRate = 50; // set default winRate to 50
    if (isNaN(streak)) streak = 0; // set default streak to 0
    let baseWinChance = winRate / 100;
    if (baseWinChance === 0) baseWinChance = 0.01; // Fix divide-by-zero issue
    const streakModifier = (Math.sign(streak) * Math.pow(Math.abs(streak), 0.75)) / 100 || 0;
    const ratingModifier = Math.max(Math.min((rating - 1600) / 1200, 0.5), -0.5);
    const winChance = baseWinChance + Math.abs(streakModifier) + Math.abs(ratingModifier);
    return Math.min(Math.max(winChance, 0), 1);
  };

  /**
 * Calculates the win chances for a team and the opposing team.
 * @param {Array} team - An array of player objects representing the team.
 * @returns {Array} - An array containing the win chance for the team and the opposing team.
 */
  const calculateTeamWinChance = (team) => {
    const playerWinChances = team.map(({ player }) => {
      const playerData = players.find((p) => p.profile_id === player.profile_id);
      if (!playerData) return 0.5;
      const { winsCount, streak } = playerData;
      if (winsCount === 0 || playerData.gamesCount === 0) return 0.5;
      const winRate = winsCount / playerData.gamesCount;
      return calculatePlayerWinChance(winRate, streak, playerData);
    });
    const teamWinChance = playerWinChances.reduce((acc, winChance) => acc + winChance, 0) / playerWinChances.length;
    const otherTeamWinChance = 1 - teamWinChance;
    return [teamWinChance, otherTeamWinChance];
  };

  /**
 * Creates an HTML div element representing a team.
 * @param {Array} team - An array of player objects representing the team.
 * @param {string} teamName - The name of the team.
 * @returns {string} - A string containing the HTML representation of the team div.
 */
  const createTeamDiv = (team, teamName) => {
    const teamRating = team.reduce((acc, { player }) => {
      const playerData = players.find((p) => p.profile_id === player.profile_id);
      return acc + (playerData.rating || 0);
    }, 0);

    const [teamWinChance, otherTeamWinChance] = calculateTeamWinChance(team);

    const teamDiv = `
      <div>
        <h3>${teamName}: ${teamRating} Rating</h3>
        <p>Opponent Win Chance: ${(otherTeamWinChance * 100).toFixed(2)}%</p>
        ${team
        .map(({ player }, index) => {
          const playerData = players.find((p) => p.profile_id === player.profile_id);
          return createPlayerDiv(playerData, index);
        })
        .join('')}
      </div>
    `;

    return teamDiv;
  };
  // (${(teamWinChance * 100).toFixed(2)}% chance to win)

  const gameInfoDiv = document.querySelector('.game-info');
  gameInfoDiv.innerHTML = `
    ${createTeamDiv(team1, 'Team 1')}
    ${createTeamDiv(team2, 'Team 2')}`;
};

/**
 * Displays a message indicating that no games are currently being played.
 * Updates the game info div with the appropriate HTML content.
 * No parameters are required.
 * No return value.
 */

const noGames = () => {
  const gameInfoDiv = document.querySelector('.game-info');
  gameInfoDiv.innerHTML = `
    <h1 class='no-games'>No one is playing right now</h1>`;
};

/**
 * Retrieves game information for each member in the team to track and renders the game info or displays a message if no games are found.
 * 
 * @param {Array} teamToTrack - An array containing the members to track.
 * @returns {void}
 */
teamToTrack.forEach(async (member) => {
  const gameInfo = await getPlayerGameInfo(member.id);
  if (gameInfo) {
    renderGameInfo(gameInfo);
  } else {
    noGames();
  }
});

/**
 * Checks the stored version of the app against the current version. If the stored version is null or different from the current version,
 * displays an update popup and handles the close event by hiding the popup and updating the stored version.
 * 
 * @param {string} storedVersion - The version of the app stored in the local storage.
 * @param {string} currentVersion - The current version of the app.
 * @returns {void}
 */
if (storedVersion === null || storedVersion !== currentVersion) {
  document.getElementById('update-popup').style.display = 'block';

  document.getElementById('close-popup').addEventListener('click', function () {
    document.getElementById('update-popup').style.display = 'none';

    localStorage.setItem('appVersion', currentVersion);
  });
}
