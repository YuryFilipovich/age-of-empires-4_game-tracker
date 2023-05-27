# Age of Empires 4 Game Tracker

Track the games and performance of Age of Empires 4 players in real-time. Get live updates and stats on player rankings, win rates, and more.

## Description

This project is a web application that allows you to track the games and performance of Age of Empires 4 players. It provides real-time updates on player rankings, win rates, and other statistics.

## Screenshots

![Screenshot 1](images/screenshots/screenshot-1.png)
![Screenshot 2](images/screenshots/screenshot-2.png)
![Screenshot 3](images/screenshots/screenshot-3.png)

## Features

- Real-time tracking of Age of Empires 4 player games and performance
- Live updates on player rankings, win rates, and more
- Detailed player information including rating, rank, games count, wins count, streak, civilization, and more
- Visualization of player win rates and pick rates for different civilizations
- Team win chance calculation based on players' win rates, current rating, and winning/losing streak
- Responsive and user-friendly interface

## Technologies Used

- HTML
- CSS
- JavaScript

## Usage

### Option 1: Clone the Repository

1. Clone the repository:

   ```shell
   git clone https://github.com/your-username/age-of-empires-4-game-tracker.git
2. Replace the `teamToTrack` `id` and `nickname` with the players you want to track from [here](https://aoe4world.com). `Id` can be retrieved from the player's URL (example  https://aoe4world.com/players/14711962-Samui_Sanchez - 14711962-Samui_Sanchez)
3. Open the index.html file in a web browser.
4. Track the games and performance of Age of Empires 4 players!   

### Option 2: Manual Download

1. Download the project files as a ZIP archive by clicking on the "Code" button in the repository.

2. Extract the ZIP archive to a desired location on your computer.

3. Replace the `teamToTrack` `id` and `nickname` with the players you want to track from [here](https://aoe4world.com). `Id` can be retrieved from the player's URL (example  https://aoe4world.com/players/14711962-Samui_Sanchez - 14711962-Samui_Sanchez)
4. Open the index.html file in a web browser.
5. Track the games and performance of Age of Empires 4 players!   

## Contribution
Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request. Here's how you can contribute:

1. Fork the repository.

2. Create a new branch: git checkout -b feature/your-feature-name.

3. Make your changes and commit them: git commit -m 'Add some feature'.

4. Push to the branch: git push origin feature/your-feature-name.

5. Open a pull request.

Please ensure that your contributions adhere to the project's coding standards and follow the existing style.

## Credits
This project was developed by Yury Filipovich.

## Known Issues
1. Win chance is calculated incorrectly: The current algorithm for calculating win chances may produce inaccurate results in certain scenarios. I am actively working on improving this calculation method.
2. Not possible to track players if they are playing simultaneously different games: The current version of the application does not support tracking players who are playing different games simultaneously. I am investigating possible solutions to address this limitation.

Please feel free to report any other issues you encounter by creating a new issue. I appreciate your feedback and contributions in making this application better.

## Roadmap
#### Version 1.0

- [X] Implement basic player tracking functionality
- [X] Display player rankings, win rates, and game statistics
- [X] Calculate team win chances based on player data
- [X] Support for manual player updates

#### Version 1.1

- [X] Integrate real-time updates for player game information
- [X] Improve user interface and styling
- [ ] Add support for tracking multiple teams simultaneously
- [ ] Enhance player search and filtering capabilities

#### Version 1.2

- [ ] Implement data visualization features (charts, graphs)
- [ ] Introduce player comparison functionality
- [ ] Add support for tracking tournament results
- [ ] Enhance performance and optimization of the application
- [ ] Future Releases
- [ ] Expand platform support (mobile, desktop)
- [ ] Implement social features (leaderboards, player profiles)
- [ ] Integrate notifications for important player events
- [ ] Enhance data analytics and insights
- [ ] Support for localization and multiple languages

Please note that the roadmap is subject to change as the project progresses and new ideas emerge. It serves as a general guideline for future development plans and features, providing users with an overview of what to expect in upcoming releases.

## License
This project is licensed under the [MIT License](https://github.com/YuryFilipovich/age-of-empires-4_game-tracker/blob/master/license).