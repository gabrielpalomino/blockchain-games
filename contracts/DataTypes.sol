pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";

// Minimum challenge value
uint256 constant MINIMUM_VALUE_CHALLENGE = 10000000000000000;

// Maximum challenge value
uint256 constant MAXIMUM_VALUE_CHALLENGE = 30000000000000000000;

// 1 day, assuming 15 seconds per block
uint256 constant BLOCKS_TO_CANCEL = 5760;
        

// Challenge data structure
struct Challenge {
    address player1Address;
    address player2Address;
    uint256 gameValue;
    uint256 player1GameId;
    uint256 player2GameId;
    bytes32 player1Data;
    uint256 player2Data;
    uint256 player2BlockNumber;
    ChallengeStatus status;    
}

// Status related to the challenge
enum ChallengeStatus {
    Empty,
    Waiting, // Player 1 joined and waits for player 2
    Playing // Both player 1 and player 2 are in the challenge
}

// Status related to the game
enum GameStatus {
    WaitMatch,
    MatchFound,
    WaitResolution,
    ClaimPrize
}

// Possible outputs of playing
enum GameOutput {
    Won,
    Lost
}

// Possible results after validating a player's turn data
enum TurnValidation {
    Valid,
    Invalid
}
