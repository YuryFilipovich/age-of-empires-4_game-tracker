/**
 * Represents the team list element in the DOM.
 * @type {Element}
 */
const teamList = document.querySelector('.team-list');

const inputField = document.querySelector('.input-container input');
const searchButton = document.querySelector('.input-container .search-button');

/**
 * Represents the stored version retrieved from local storage.
 * @type {string|null}
 */
let storedVersion = localStorage.getItem('appVersion');

/**
 * Represents the current version of the application.
 * @type {string}
 */
let currentVersion = '1.1.1';

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
 * @typedef {Object} TeamToTrack[]
 * @property {string} id - The unique identifier of the player.
 * @property {string} nickname - The nickname or name of the player you want.
 */
const teamToTrack = [];

const fetchTeamData = () => {
  return new Promise((resolve, reject) => {
    fetch('https://aoe4world.com/api/v0/leaderboards/rm_solo')
      .then(response => response.json())
      .then(data => {
        const players = data.players.slice(0, 21);

        players.forEach(player => {
          const id = player.profile_id.toString();
          const nickname = player.name;
          const profileUrl = player.site_url;

          teamToTrack.push({ id, nickname, profileUrl });
        });

        teamToTrack.sort((a, b) => b.rating - a.rating);

        resolve(teamToTrack);
      })
      .catch(error => {
        reject(error);
      });
  });
}

fetchTeamData()
  .then(updatedTeamToTrack => {
    const namesList = updatedTeamToTrack.map((member) => `
      <li class='dis-friends' data-member-id="${member.id}">
        <span class="nickname-container">
          <span class="nickname">Nickname:
            <a href='https://aoe4world.com/players/${member.id}' target="_blank">${member.nickname}</a>
            </br> id: ${member.id}
          </span>
          <span class="playing-badge">Loading...</span>
        </span><br>
      </li>
    `).join('');

    teamList.innerHTML = namesList;

    updatePlayingStatus();
  })
  .catch(error => {
    console.log('Error:', error);
  });


/**
 * Logs whether the player is currently playing a game.
 * @param {string} playerId - The unique identifier of the player.
 * @returns {boolean} - True if the player is currently playing, false otherwise.
 */
const logPlayerGames = async (playerId) => {
  try {
    const response = await fetch(`${url}/api/v0/players/${playerId}/games`);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = await response.json();
    const games = data.games;

    return games.length > 0 && (games[0].ongoing || games[0].just_finished);
  } catch (error) {
    console.error("An error occurred while retrieving player games:", error.message);
    return false;
  }
};

/**
 * Updates the playing status of team members.
 * @returns {Promise<void>}
 */
const updatePlayingStatus = async () => {
  const playingStatusPromises = teamToTrack.map(async (member) => {
    const playingNow = await logPlayerGames(member.id);
    const memberLi = document.querySelector(`li[data-member-id="${member.id}"]`);

    memberLi.classList.toggle('playing', playingNow);
    const playingBadge = memberLi.querySelector('.playing-badge');
    playingBadge.classList.toggle('playing', playingNow);
    playingBadge.classList.toggle('not-playing', !playingNow);
    playingBadge.textContent = playingNow ? '' : ' ';
  });

  await Promise.all(playingStatusPromises);
};


/**
 * Generates an HTML list of team members' names with associated links and placeholders for their playing status.
 * @type {string}
 */
const namesList = teamToTrack.map((member) => `
  <li class='dis-friends' data-member-id="${member.id}">
    <span class="nickname-container">
      <span class="nickname">Nickname:
        <a href='https://aoe4world.com/players/${member.id}' target="_blank">${member.nickname}</a>
      </span>
      <span class="playing-badge">Loading...</span>
    </span><br>
  </li>
`).join('');

teamList.innerHTML = namesList;

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
    const ongoingOrJustFinishedGames = games.filter(game => game.ongoing || game.just_finished);

    if (ongoingOrJustFinishedGames.length > 0) {
      const gameInfo = {
        playerId,
        team1: ongoingOrJustFinishedGames[0].teams[0],
        team2: ongoingOrJustFinishedGames[0].teams[1],
        map: ongoingOrJustFinishedGames[0].map,
        started_at: ongoingOrJustFinishedGames[0].started_at
      };
      return gameInfo;
    } else if (games.length > 1) {
      const secondGameOngoingOrJustFinished = games.slice(1).find(game => game.ongoing || game.just_finished);

      if (secondGameOngoingOrJustFinished) {
        const gameInfo = {
          playerId,
          team1: secondGameOngoingOrJustFinished.teams[0],
          team2: secondGameOngoingOrJustFinished.teams[1],
          map: secondGameOngoingOrJustFinished.map,
          started_at: secondGameOngoingOrJustFinished.started_at
        };
        return gameInfo;
      }
    }
    return null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

/**
 * Calculates the time elapsed since a specific starting time.
 * @param {string} startedAt - The starting time in ISO 8601 format.
 * @returns {string} The formatted time elapsed in the format "Xd Xh Xm Xs", where X represents the number of days, hours, minutes, and seconds respectively.
*/
const getTimeSinceStarted = (startedAt) => {
  const timeDiff = Date.now() - new Date(startedAt).getTime();

  const seconds = Math.floor(timeDiff / 1000) % 60;
  const minutes = Math.floor(timeDiff / 1000 / 60) % 60;
  const hours = Math.floor(timeDiff / 1000 / 3600) % 24;
  const days = Math.floor(timeDiff / 1000 / 86400);

  const formatTimeUnit = (value, unit) => `${value}${unit}`;

  if (days > 0) {
    return `${formatTimeUnit(days, 'd')} ${formatTimeUnit(hours, 'h')} ${formatTimeUnit(minutes, 'm')} ${formatTimeUnit(seconds, 's')}`;
  } else if (hours > 0) {
    return `${formatTimeUnit(hours, 'h')} ${formatTimeUnit(minutes, 'm')} ${formatTimeUnit(seconds, 's')}`;
  } else if (minutes > 0) {
    return `${formatTimeUnit(minutes, 'm')} ${formatTimeUnit(seconds, 's')}`;
  } else {
    return `${formatTimeUnit(seconds, 's')}`;
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
  const winRateColor = (winRate) => winRate < 30 ? 'red' : winRate <= 50 ? 'orange' : 'green';

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

    const date = new Date(rmTeam.started_at);
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedTime = date.toLocaleTimeString("en-GB");

    const formatCivData = (civData, property) => {
      return civData
        ?.sort((a, b) => b[property] - a[property])
        ?.slice(0, 3)
        ?.map((civ) => `${civ.civilization} (${civ[property].toFixed(1)}%)`)
        ?.join(", ") || [];
    };

    return {
      name: player.name,
      civilization: player.civilization,
      profile_id: player.profile_id,
      civilizationsByWinRate: formatCivData(rmTeam.civilizations, "win_rate"),
      civilizationsByPickRate: formatCivData(rmTeam.civilizations, "pick_rate"),
      rating: rmTeam.rating,
      rank: rmTeam.rank,
      gamesCount: rmTeam.games_count,
      winsCount: rmTeam.wins_count,
      streak: rmTeam.streak,
      started_at_date: formattedDate,
      started_at_time: formattedTime,
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
    const colorSpan = (civ) => `<span style="color:${winRateColor(Number(civ.match(/\d+(?:\.\d+)?/)[0]))}">${civ}</span>`;
    const formatCount = (count) => {
      const total = count || 0;
      const wins = winsCount || 0;
      const loses = total - wins;
      return `<span style="color:black">${total}</span>-<span style="color:green">${wins}</span>-<span style="color:red">${loses}</span>`;
    };
    const streakColor = streak >= 0 ? 'green' : 'red';

    return `
      <div class='player-box'>
        <a class='player-name' href='https://aoe4world.com/players/${profile_id}' target="_blank">
          <strong>${index + 1}) ${name}</strong>
        </a>  
        ${rating ? `<p class='player-rating'>Rating: <strong>${rating}</strong></p>` : ''}
        ${rank ? `<p class='player-rank'>Rank: <strong>${rank}</strong></p>` : ''}
        <p class='player-games'>Games: <strong>${formatCount(gamesCount)}</strong></p>
        <p>Win Rate: <span style="color:${winPercentageColor}">${winPercentage.toFixed(2)}%</span></p>
        ${streak ? `<p class='player-streak'>Streak: <strong style="color:${streakColor}">${streak}</strong></p>` : ''}
        <p class='player-civilization'>Playing now as: <strong>${civilization}</strong></p>        
        <p class='player-pick-rate'>Pick Rate:</p>
        <ol>
          ${civilizationsByPickRate.length > 0 ? civilizationsByPickRate.split(', ').map((civ) => `<li>${colorSpan(civ)}</li>`).join('') : '<li>No data available</li>'}
        </ol>
        <p class='player-win-rate'>Win Rate:</p>
        <ol>
          ${civilizationsByWinRate.length > 0 ? civilizationsByWinRate.split(', ').map((civ) => `<li>${colorSpan(civ)}</li>`).join('') : '<li>No data available</li>'}
        </ol>
      </div>
    `;
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
    rating = isNaN(rating) ? 0.5 : rating;
    winRate = isNaN(winRate) ? 50 : winRate;
    streak = isNaN(streak) ? 0 : streak;

    let baseWinChance = winRate / 100;
    baseWinChance = baseWinChance === 0 ? 0.01 : baseWinChance;

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
      if (!playerData || playerData.winsCount === 0 || playerData.gamesCount === 0) {
        return 0.5;
      }
      const { winsCount, streak } = playerData;
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
  const createTeamDiv = (team, teamName, map, started_at) => {
    const teamRating = team.reduce((acc, { player }) => {
      const playerData = players.find((p) => p.profile_id === player.profile_id);
      return acc + (playerData?.rating || 0);
    }, 0);

    const [teamWinChance, otherTeamWinChance] = calculateTeamWinChance(team);

    const playerDivs = team.map(({ player }, index) => {
      const playerData = players.find((p) => p.profile_id === player.profile_id);
      return createPlayerDiv(playerData, index);
    });

    const teamDiv = `
      <div class='team-info'>
        <h3>${teamName}: ${teamRating} Rating</h3>
        <p>Opponent Win Chance: ${(otherTeamWinChance * 100).toFixed(2)}%</p>
      </div>
      ${playerDivs.join('')}
    `;

    return teamDiv;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-GB");
  };

  const updateGameInfo = (map, started_at, team1, team2) => {
    const formattedDate = formatDate(started_at);
    const formattedTime = formatTime(started_at);
    const timeSinceStarted = getTimeSinceStarted(started_at);

    const gameInfoDiv = document.querySelector('.game-info');
    gameInfoDiv.innerHTML = `
      <div class='map-info'>
        <h3>Map: ${map}</h3>
        <h3>Started at: ${formattedDate} - ${formattedTime}</h3>
        <h3>Time since started: ${timeSinceStarted}</h3>
      </div>
      <div>
        ${createTeamDiv(team1, 'Team 1')}
      </div>
      <div>
        ${createTeamDiv(team2, 'Team 2')}
      </div>
    `;
  };

  updateGameInfo(map, started_at, team1, team2);
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
    <h1 class='no-games'>No one is playing from the list right now</h1>`;
};

const offlinePlayer = () => {
  const gameInfoDiv = document.querySelector('.game-info');
  gameInfoDiv.innerHTML = `
    <h1 class='no-games'>Seems the player you are trying to find is currently offline</h1>`;
};

/**
 * Retrieves game information for each member in the team to track and renders the game info or displays a message if no games are found.
 * 
 * @param {Array} teamToTrack - An array containing the members to track.
 * @returns {void}
 */
const gameInfoPromises = teamToTrack.map((member) => getPlayerGameInfo(member.id));

Promise.all(gameInfoPromises)
  .then((gameInfos) => {
    const hasGameInfo = gameInfos.some((info) => info !== null);
    if (hasGameInfo) {
      gameInfos.forEach((gameInfo) => {
        if (gameInfo) {
          renderGameInfo(gameInfo);
        } else {
          noGames();
        }
      });
    } else {
      noGames();
    }
  })
  .catch((error) => {
    console.error(error);
    noGames();
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


inputField.addEventListener('input', () => {
  searchButton.disabled = inputField.value.trim() === '';

});

searchButton.addEventListener('click', () => {
  if (searchButton.disabled) {
    return;
  }

  const link = inputField.value.trim();
  let playerId;

  if (link.includes("/players/")) {
    playerId = link.split("/players/")[1];
  } else if (link.includes("-")) {
    playerId = link;
  } else {
    playerId = link;
  }

  processPlayer(playerId);
});


const processPlayer = (playerId) => {
  getPlayerGameInfo(playerId)
    .then((gameInfo) => {
      if (gameInfo) {
        renderGameInfo(gameInfo);
      } else {
        offlinePlayer();
      }
    })
    .catch((error) => {
      console.error(error);
      offlinePlayer();
    });
};
