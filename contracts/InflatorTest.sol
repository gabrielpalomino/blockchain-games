pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "./Inflator.sol";

/// @notice This contract is for test purposes only.
contract InflatorTest is Inflator {
    
    /// Constructor
    constructor(address payable ownerAddress) Inflator(ownerAddress) {}

    function validateTest(uint256 data) public pure returns (TurnValidation) {
        return validate(data);
    }

    function resolveTest(uint256 data1, uint256 data2) public pure returns (GameOutput) {
        return resolve(data1, data2);
    }

    function prizeToClaim(address playerAddress) public view returns (uint256) {
        return allowanceToClaimPrize[playerAddress];
    }
    
    function refundToClaimTest() public view returns (uint256) {
        return allowanceToClaimRefund[msg.sender];
    }

    function getAdminAccessTest(address playerAddress) public view returns (uint256) {
        return admin[playerAddress];
    }

    function getChallengeTest() public view returns (Challenge memory) {
        return challenges[msg.sender];
    }

    function setChalengeStatusPlayingTest() public {
        challenges[msg.sender].status = ChallengeStatus.Playing;
    }

    function setChalengeStatusWaitingTest() public {
        challenges[msg.sender].status = ChallengeStatus.Waiting;
    }

    function getOpponentTest() public view returns (address) {
        return opponents[msg.sender];
    }

}