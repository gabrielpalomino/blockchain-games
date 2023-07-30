pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "./DataTypes.sol";

/// @notice This contract is for test purposes only.
contract DataTypesTest {
    uint256 public MAXIMUM_VALUE_CHALLENGE_T = MAXIMUM_VALUE_CHALLENGE;
    uint256 public MINIMUM_VALUE_CHALLENGE_T = MINIMUM_VALUE_CHALLENGE;
    uint256 public CHALLENGE_STATUS_EMPTY = uint256(ChallengeStatus.Empty);
    uint256 public CHALLENGE_STATUS_WAITING = uint256(ChallengeStatus.Waiting);
    uint256 public CHALLENGE_STATUS_PLAYING = uint256(ChallengeStatus.Playing);
    uint256 public TURN_VALIDATION_VALID = uint256(TurnValidation.Valid);
    uint256 public TURN_VALIDATION_INVALID = uint256(TurnValidation.Invalid);
    uint256 public GAME_OUTPUT_WON = uint256(GameOutput.Won);
    uint256 public GAME_OUTPUT_LOST = uint256(GameOutput.Lost);
    uint256 public BLOCKS_TO_CANCEL_T = BLOCKS_TO_CANCEL;
}

