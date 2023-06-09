/**
 * Represents the current version of the application.
 * @type {string}
 */
let currentVersion = '1.2.0';

/**
 * Represents the body element in the DOM.
 * @type {Element}
 */
const body = document.querySelector('body');

/**
 * Represents a collection of images that can be enlarged on click.
 * @type {NodeListOf<HTMLImageElement>} - The list of images.
 */
const images = document.querySelectorAll('.enlarge-image');

/**
 * Represents the information icon element.
 * @type {HTMLElement} - The information icon element.
 */
const infoIcon = document.querySelector('.info-icon');

/**
 * Represents the overlay element.
 * @type {HTMLElement} - The overlay element.
 */
const overlay = document.querySelector('.overlay');

/**
 * Represents the team list element in the DOM.
 * @type {Element}
 */
const teamList = document.querySelector('.team-list');

/**
 * Finds the first <li> element within the team list.
 *
 * @type {Element|null} The first <li> element found, or null if not found.
 */
const listItem = teamList.querySelector('li');

/**
 * Selects the team list container element from the DOM.
 *
 * @type {Element|null} The team list container element, or null if not found.
 */
const teamListContainer = document.querySelector('.team-list-container');

/**
 * Selects the version info element from the DOM.
 *
 * @type {Element|null} The version info element, or null if not found.
 */
const versionInfo = document.querySelector('.version-info');

/**
 * Represents the input field element in the input container.
 * @type {HTMLInputElement}
 */
const inputField = document.querySelector('.input-container input');

/**
 * Represents the search button element in the input container.
 * @type {HTMLElement}
 */
const searchButton = document.querySelector('.input-container .search-button');

/**
 * Represents the URL search parameters extracted from the current window's location.
 * @type {URLSearchParams}
 */
const queryParams = new URLSearchParams(window.location.search);

/**
 * Represents the value of the 'id' query parameter extracted from the URL search parameters.
 * @type {string | null}
 */
const queryParamPlayerId = queryParams.get('id');

const redirectBtn = document.querySelector('.redirect-button');

/**
 * Represents the stored version retrieved from local storage.
 * @type {string|null}
 */
let storedVersion = localStorage.getItem('appVersion');

/**
 * Represents the element that displays version information in the DOM.
 * @type {Element}
 */
const versionInfoText = document.querySelector('.version-info-text');
versionInfoText.innerText = `Version ${currentVersion}`;

/**
 * Represents the base URL of the AOE4 World website.
 * @type {string}
 */
const url = 'https://aoe4world.com';

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
 * Represents a sorted list of teams to track.
 * @typedef {Object} TeamToTrack[]
 * @property {string} id - The unique identifier of the player.
 * @property {string} nickname - The nickname or name of the player you want.
 */
const teamToTrack = [];

/**
 * Fetches team data from the 'https://aoe4world.com/api/v0/leaderboards/rm_solo' endpoint.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of team data objects.
 * @throws {Error} If an error occurs during the fetch operation.
 */
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

if (!queryParamPlayerId) {
  const loadingContainer = document.querySelector('.loading-container');
  const teamList = document.querySelector('.team-list');

  loadingContainer.innerHTML = '<div class="loading"><span class="loading-wheel"></span>Loading...</div>';

  fetchTeamData()
    .then(updatedTeamToTrack => {
      const namesList = updatedTeamToTrack.map((member) => `
        <li class='dis-friends' data-member-id="${member.id}">
          <span class="nickname-container">
            <span class="nickname">Nickname:
              <a href='https://aoe4world.com/players/${member.id}' target="_blank">${member.nickname}</a>
            </span>
            <span class="playing-badge">Loading...</span>
          </span>
          <p class="nickname">id: ${member.id}</p>
        </li>
      `).join('');

      loadingContainer.innerHTML = '';
      teamList.innerHTML = namesList;

      updatePlayingStatus();

      const gameInfoPromises = updatedTeamToTrack.map((member) => getPlayerGameInfo(member.id));

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
    })
    .catch(error => {
      console.log('Error:', error);
    });

  redirectBtn.style.display = 'none';
} else {
  getPlayerGameInfo(queryParamPlayerId)
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
}


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
    const gameInfoDiv = document.querySelector('.game-info');

    const formattedDate = formatDate(started_at);
    const formattedTime = formatTime(started_at);
    const initialTimeSinceStarted = getTimeSinceStarted(started_at);

    gameInfoDiv.innerHTML = `
      <div class='map-info'>
        <h3>Map: ${map}</h3>
        <h3>Started at: ${formattedDate} - ${formattedTime}</h3>
        <h3 class='time-since-started'>Time since started: ${initialTimeSinceStarted}</h3>
      </div>
      <div>
        ${createTeamDiv(team1, 'Team 1')}
      </div>
      <div>
        ${createTeamDiv(team2, 'Team 2')}
      </div>
    `;

    const timeSinceStartedH3 = gameInfoDiv.querySelector('.time-since-started');

    const updateElapsedTime = () => {
      const timeSinceStarted = getTimeSinceStarted(started_at);
      timeSinceStartedH3.textContent = `Time since started: ${timeSinceStarted}`;
    };

    setInterval(updateElapsedTime, 1000);
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
// if (!queryParamPlayerId) {
//   const gameInfoPromises = teamToTrack.map((member) => getPlayerGameInfo(member.id));

//   Promise.all(gameInfoPromises)
//     .then((gameInfos) => {
//       const hasGameInfo = gameInfos.some((info) => info !== null);
//       if (hasGameInfo) {
//         gameInfos.forEach((gameInfo) => {
//           if (gameInfo) {
//             renderGameInfo(gameInfo);
//           } else {
//             noGames();
//           }
//         });
//       } else {
//         noGames();
//       }
//     })
//     .catch((error) => {
//       console.error(error);
//       noGames();
//     });
// } else {
//   getPlayerGameInfo(queryParamPlayerId)
//     .then((gameInfo) => {
//       if (gameInfo) {
//         renderGameInfo(gameInfo);
//       } else {
//         offlinePlayer();
//       }
//     })
//     .catch((error) => {
//       console.error(error);
//       offlinePlayer();
//     })
// }

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

/**
 * Adds an event listener to the input field to enable/disable the search button based on the input value.
 * @param {Event} event - The event object triggered by the input.
 * @returns {void}
 */
inputField.addEventListener('input', () => {
  searchButton.disabled = inputField.value.trim() === '';

});

/**
 * Adds an event listener to the search button and processes the player ID based on the input value.
 * @returns {void}
 */
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

/**
 * Processes the player with the given player ID by retrieving game information,
 * rendering the game info if available, displaying offline status otherwise,
 * and redirecting to the player's page.
 * @param {string} playerId - The ID of the player to process.
 * @returns {void}
 */
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
    })
    .finally(() => {
      redirectToPlayerPage(playerId);
    });
};

/**
 * Redirects to the player's page with the specified player ID by opening a new window.
 * @param {string} playerId - The ID of the player.
 * @returns {void}
 */
const redirectToPlayerPage = (playerId) => {
  const newPageURL = `https://age-of-empires-4-game-tracker.vercel.app/?id=${playerId}`;

  window.open(newPageURL, '_blank');
};

/**
 * Adds a click event listener to the infoIcon element.
 * When clicked, it adds the 'show' class to the overlay element.
 * @event infoIcon#click
 * @callback
 */
infoIcon.addEventListener('click', () => {
  overlay.classList.add('show');
});

/**
 * Adds a click event listener to the close-overlay element.
 * When clicked, it removes the 'show' class from the overlay element.
 * @event close-overlay#click
 * @callback
 */
document.querySelector('.close-overlay').addEventListener('click', () => {
  overlay.classList.remove('show');
});

/**
 * Adds a click event listener to each image in the images collection.
 * When clicked, it toggles the 'enlarged' class on the clicked image.
 * @event image#click
 * @callback
 */
images.forEach(image => {
  image.addEventListener('click', () => {
    image.classList.toggle('enlarged');
  });
});

/**
 * Checks if a list item exists and appends the version info element to the team list container if it doesn't exist.
 *
 * @param {Element|null} listItem - The list item element to check.
 * @param {Element} teamListContainer - The container element for the team list.
 * @param {Element} versionInfo - The version info element to append.
 */
if (!listItem) {
  teamListContainer.appendChild(versionInfo);
}
