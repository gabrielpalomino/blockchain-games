# Blockchain Games: Guess Hand

## Description

The Guess Hand project allows two players to engage in a game where player 1 hides a value in one hand and player 2 has to guess which hand it is in. The contracts provide a commit-reveal scheme to ensure fair gameplay despite the transparent nature of blockchain transactions. The game's monetization structure allows game developers to earn each time a player engages with their games, tracking the volume of value of each game session via a unique gameId.

## How it Works

Player 1 begins by sending the game data hashed with a salt (the hand where the value is hidden). The hashed data is invisible on the blockchain. Player 2's data is sent in plain text, and once their decision is made, the game requires resolution.

Player 1 then sends the plain game data, salt, and their signature to resolve the game. The smart contract verifies the data sent by Player 1 and determines a winner.

## Smart Contracts

This project includes several smart contracts, each serving a specific role:

- **Inflator.sol**: This is the entry point for both players. It contains public functions to start a game, reply to a game, and resolve a game.

- **Admin.sol**: This contract manages access control, including who can claim a prize and request a refund. For monetization, it grants or revokes admin roles, which game developers use to track the volume of value their games generate.

- **DataStorage.sol**: This contract stores the challenges in a mapping and includes functions to add and remove challenges.

- **DataTypes.sol**: This file contains data types common to the project.

- **DataVerificator.sol**: This contract verifies that the initial game data sent by Player 1 is correct.

- **GuessHandGame.sol**: This contract contains the game logic. It determines the winner based on the hands selected by each player.

## Installation

This project uses Hardhat for contract compilation and deployment. Follow the official [Hardhat Documentation](https://hardhat.org/getting-started/#overview) for instructions on how to set up your environment.

## Tests

The project includes unit tests written in JavaScript and Ethers.js. 'Chai' is used as the testing framework. For instructions on how to run the tests, please refer to the 'Chai' [documentation](https://www.chaijs.com/guide/).

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

