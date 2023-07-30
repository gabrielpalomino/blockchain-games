pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";

contract Admin is Ownable {
    /// Authorized accounts to perform admin operations (get gameId)
    mapping (address => uint256) internal admin;

    /// Addresses are allowed to claim a prize
    mapping (address => uint256) internal allowanceToClaimPrize;

    /// Value accumulated for each gameId
    mapping (uint256 => uint256) internal gameIdAccumulated;

    /// Addresses are allowed to claim refund (game was cancelled by the player)
    mapping (address => uint256) internal allowanceToClaimRefund;

    /// Modifiers

    modifier onlyAdmin() {
        require(admin[msg.sender] == 1, "Sender is not having admin permission.");
        _;
    }

    modifier onlyAllowedToClaimPrize() {
        require(allowanceToClaimPrize[msg.sender] > 0, "No pending prize to claim.");
        _;
    }

    modifier onlyAllowedToClaimRefund() {
        require(allowanceToClaimRefund[msg.sender] > 0, "No pending refund to claim.");
        _;
    }
    
    /// @notice Grants access to the sender as admin.
    /// @param account Account address of the user.
    function grantAdminAccess(address account) public onlyOwner {
        admin[account] = 1;
    }

    /// @notice Revoques access to the sender as admin.
    /// @param account Account address of the user.
    function revoqueAdminAccess(address account) public onlyOwner {
        admin[account] = 0;
    }

    /// @notice Players claim their prize by calling this function
    function claimPrize() public onlyAllowedToClaimPrize {
        uint256 prizeValue = allowanceToClaimPrize[msg.sender];
        allowanceToClaimPrize[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: prizeValue}("");
        require(success);
    }

    /// @notice Players claim their refund by calling this function.
    /// @dev Before calling refund, cancelGame needs to be called.
    function claimRefund() public onlyAllowedToClaimRefund {
        uint256 refundValue = allowanceToClaimRefund[msg.sender];
        allowanceToClaimRefund[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: refundValue}("");
        require(success);
    }

    /// @notice Game developers call this function to retrieve the amount generated for a specific game.
    /// @param gameId Game identificator.
    /// @return uint256 Value of the total accumulated.
    function getGameAccumulated(uint256 gameId) public view onlyAdmin returns (uint256) {
        return gameIdAccumulated[gameId];
    }
}
