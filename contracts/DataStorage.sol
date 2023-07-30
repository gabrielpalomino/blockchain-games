pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "./DataTypes.sol";

contract DataStorage {

    /// Stored challenges
    /// address player started challenge
    mapping (address => Challenge) internal challenges;

    /// Maps address player replied the challenge with the address of the player started the challenge.
    /// Used to be able to force cancel a challenge
    mapping (address => address) internal opponents;

    /// @dev Handles adding a player in a challenge. Reuses the index if possible.
    /// @param gameId The ID of the game from where the player is playing. This Id is used to compensate game developers.
    /// @param data The data sent as part of the player turn.
    function add(uint256 gameId, bytes32 data) internal {
        // Create a new Challenge
        Challenge memory newChallenge = Challenge(
            {
                player1Address: msg.sender,
                player2Address: address(0),
                gameValue: msg.value,
                player1GameId: gameId,
                player2GameId: 0,
                player1Data: data,
                player2Data: 0,
                player2BlockNumber: 0,
                status: ChallengeStatus.Waiting
            }
        );
        challenges[msg.sender] = newChallenge;
    }

    /// @dev Removes the challenge associated to the player
    /// @param playerAddress Address of the player who created the challenge.
    function remove(address playerAddress) internal {
        challenges[playerAddress].player1Address = address(0);
        challenges[playerAddress].player2Address = address(0);
        challenges[playerAddress].gameValue = 0;
        challenges[playerAddress].player1GameId = 0;
        challenges[playerAddress].player2GameId = 0;
        challenges[playerAddress].player1Data = bytes32(0);
        challenges[playerAddress].player2Data = 0;
        challenges[playerAddress].player2BlockNumber = 0;
        challenges[playerAddress].status = ChallengeStatus.Empty;
    }
}