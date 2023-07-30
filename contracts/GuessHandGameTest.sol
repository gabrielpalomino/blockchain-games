pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "./GuessHandGame.sol";

/// @notice This contract is for test purposes only.
contract GuessHandGameTest is GuessHandGame {
    uint256 public LEFT_HAND_T = LEFT_HAND;
    uint256 public RIGHT_HAND_T = RIGHT_HAND;
}

