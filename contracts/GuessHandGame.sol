pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "./DataTypes.sol";

contract GuessHandGame {

    // Game options
    uint256 constant LEFT_HAND = 1;
    uint256 constant RIGHT_HAND = 2;
    
    /// @notice Validates the data the player is sending as part of its turn.
    /// @return value VALID or INVALID.
    function validate(uint256 data) internal pure returns (TurnValidation) {
        if(data == LEFT_HAND || data == RIGHT_HAND) {
            return TurnValidation.Valid;
        } else {
            return TurnValidation.Invalid;
        }
    }

    /// @notice In this particular game resolve is called from the player replied to the challenge. The resolution is made in relation to that player.
    /// @param data1 The data of player started the challenge.
    /// @param data2 The data of player replied to the challenge.
    function resolve(uint256 data1, uint256 data2) internal pure returns (GameOutput) {
        return data1 == data2 ? GameOutput.Lost : GameOutput.Won;
    }
}