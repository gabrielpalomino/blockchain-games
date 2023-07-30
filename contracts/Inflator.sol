pragma solidity >=0.8.17 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./DataTypes.sol";
import "./DataStorage.sol";
import "./GuessHandGame.sol";
import "./Admin.sol";
import "./DataVerificator.sol";

contract Inflator is Ownable, GuessHandGame, DataStorage, Admin, DataVerificator {

    /// Events

    /// @notice Event emitted when a player has started a challenge.
    /// @param player1Address Player1 address.
    /// @param amount The amount played.
    event OpenChallenge(address indexed player1Address, uint256 amount);

    /// @notice Event emitted when a player has cancelled a challenge.
    /// @param player1Address Player1 address.
    event CancelledChallenge(address indexed player1Address);

    /// @notice Event emitted when player2 has replied to player1 challenge.
    /// @param player1Address Player1 address.
    /// @param player2Address Player1 address.
    event Playing(address indexed player1Address, address indexed player2Address);

    /// @notice Event emitted when a challenge has ended.
    /// @param playerAddress The address of the who won.
    event Won(address indexed playerAddress);

    /// @notice Event emitted when a challenge has ended.
    /// @param playerAddress The address of the player who lost.
    event Lost(address indexed playerAddress);

    /// Modifier

    /// Guard value challenge is in range
    modifier onlyValueInRange() {
        require(msg.value >= MINIMUM_VALUE_CHALLENGE && msg.value <= MAXIMUM_VALUE_CHALLENGE, "Value must be greater than MINIMUM VALUE CHALLENGE and lower or equal to MAXIMUM VALUE CHALLENGE.");
        _;
    }

    /// Constructor
    /// @param ownerAddress Address of the owner's contract.
    constructor(address payable ownerAddress) {
        transferOwnership(ownerAddress);
    }

    /// @notice This function needs to be called by the player who wants to start the game.
    /// @param gameId The ID of the game from where the player is playing. This Id is used to compensate game developers.
    /// @param data Hashed data sent as part of the player turn.
    function start(uint256 gameId, bytes32 data) public onlyValueInRange payable {
        /// Guard player is not already playing
        require(challenges[msg.sender].player1Address == address(0), "Player has already an open game.");
        /// Store challenge
        add(gameId, data);
        /// Emit event
        emit OpenChallenge(msg.sender, msg.value);
    }

    /// @notice This function needs to be called by the player who wants to reply to a game challenge.
    /// @dev Entry point for player 2. Performs fee transfer to the owner.
    /// @param player1Address The address of the player to challenge.
    /// @param gameId The ID of the game from where the player is playing. This Id is used to compensate game developers.
    /// @param data The data sent as part of the player turn.
    function reply(address player1Address, uint256 gameId, uint256 data) public onlyValueInRange payable {
        /// Guard the sender is not having an open challenge
        require(opponents[msg.sender] == address(0), "Player has already an open game.");
        /// Guard player address is valid
        require(player1Address != address(0), "Address must be non-zero.");
        /// Guard player started is not the same as the one replied
        require(player1Address != msg.sender, "You can't play against yourself.");
        /// Guard player1 challenge exists
        Challenge memory challenge = challenges[player1Address];
        /// Guard player1Address is the same as stored in the challenge
        require(challenge.player1Address == player1Address , "Player address sent is not a player.");
        /// Guard value sent is same as opponent
        require(msg.value == challenge.gameValue, "Value must be same as opponent.");
        /// Guard player1 is not already playing
        require(challenge.status == ChallengeStatus.Waiting , "Target player is already playing.");
        /// Guard data sent as player's turn is valid
        require(validate(data) == TurnValidation.Valid, "Data sent is not valid.");
        /// Update challenge
        challenges[player1Address].player2Address = msg.sender;
        challenges[player1Address].player2GameId = gameId;
        challenges[player1Address].player2Data = data;
        challenges[player1Address].status = ChallengeStatus.Playing;
        challenges[player1Address].player2BlockNumber = block.number;
        // Update game id accumulated for both players
        /// Calculate fee 5% per single game
        uint256 singleFeeValue = msg.value * 5 / 100;
        /// Store fee for the game Id of current player
        gameIdAccumulated[gameId] = gameIdAccumulated[gameId] + singleFeeValue;
        /// Store fee for the game Id of opponent player
        uint256 player1GameId = challenges[player1Address].player1GameId;
        gameIdAccumulated[player1GameId] = gameIdAccumulated[player1GameId] + singleFeeValue;
        /// Calculate total value challenge
        uint256 totalValueChallenge = msg.value * 2;
        /// Calculate total fee 5% 
        uint256 feeValue = singleFeeValue * 2;
        // Update challenge total game value
        challenges[player1Address].gameValue = totalValueChallenge - feeValue;
        /// Store the oponent address
        opponents[msg.sender] = player1Address;
        /// Transfer fee
        (bool successFeeTransfer, ) = owner().call{value: feeValue}("");
        require(successFeeTransfer, "Failed to send fee value.");
        /// Emit event
        emit Playing(challenge.player1Address, msg.sender);
    }

    /// @notice Verifies signature and hash. In case of verification fails reverts.
    /// @param plainData The data player1 was sending hashed.
    /// @param salt Salt used to hash.
    /// @param signature Signature of the sender.
    function resolve(string calldata plainData, string calldata salt, bytes calldata signature) public {
        Challenge memory challenge = challenges[msg.sender];
        require(challenge.player1Address == msg.sender, "Address is not a player.");
        /// Guard challenge status
        require(challenge.status == ChallengeStatus.Playing , "Challenge is not ready to be resolved.");
        /// Verify data and signature
        verify(plainData, salt, signature, challenge.player1Address, challenge.player1Data);
        /// Convert plainData (string) to uint256 data.
        bytes memory valueBytes = bytes(plainData);
        require(valueBytes.length == 1, "Invalid string length.");
        uint8 digit = uint8(valueBytes[0]);
        require(digit >= 48 && digit <= 57, "Invalid numerical value.");
        uint256 data = uint256(digit - 48);
        require(validate(data) == TurnValidation.Valid, "The data sent is not valid.");
        /// Resolve game
        GameOutput result = resolve(data, challenge.player2Data);
        processEndGame(result, challenge.player1Address, challenge.player2Address, challenge.gameValue);
    }

    /// @notice Checks outcome and declares a winner and a looser. Assings funds. Notifies players.
    /// @param outcome The result given by the game after evaluating both players data. Always in relation to player1.
    /// @param player2Address Address of the player replied the challenge.
    /// @param gameValue Prize of the challenge
    function processEndGame(GameOutput outcome, address player1Address, address player2Address, uint256 gameValue) private {
        address winnerAddress;
        address looserAddress;
        if(outcome == GameOutput.Won) {
            winnerAddress = player1Address;
            looserAddress = player2Address;
        } else {
            winnerAddress = player2Address;
            looserAddress = player1Address;
        }

        /// Allow winner to claim prize
        allowanceToClaimPrize[winnerAddress] = allowanceToClaimPrize[winnerAddress] + gameValue;

        /// Remove player
        remove(player1Address);

        /// Reset opponent
        opponents[player2Address] = address(0);

        /// Emit event
        emit Won(winnerAddress);
        emit Lost(looserAddress);
    }
    
    /// @notice Players that started the challenge can cancel it and get a refund.
    function cancelChallenge() public {
        Challenge memory challenge = challenges[msg.sender];
        require(challenge.player1Address == msg.sender , "Address not recognized as player.");
        require(challenge.status == ChallengeStatus.Waiting , "Challenge can not be cancelled, opponent player already playing.");
        uint256 refund = challenge.gameValue;
        remove(challenge.player1Address);
        allowanceToClaimRefund[msg.sender] = refund;

        /// Emit event
        emit CancelledChallenge(msg.sender);
    }

    /// @notice Players that reply can force to cancel the challenge if the opponent player is not responding in a period time.
    function forceCancelChallenge() public {
        /// Get sender's opponent
        address player1Address = opponents[msg.sender];
        /// Guard player1 address is valid
        require(player1Address != address(0), "Opponent address must be non-zero.");
        Challenge memory challenge = challenges[player1Address];
        require(challenge.player1Address == player1Address , "Player1 address not recognized as player.");
        /// Guard sender is player2
        require(challenge.player2Address == msg.sender , "Player2 address not recognized as player.");
        /// Guard the challenge status is playing
        require(challenge.status == ChallengeStatus.Playing , "Challenge can not be cancelled.");
        /// Guard the required time has passed
        require(block.number >= challenge.player2BlockNumber + BLOCKS_TO_CANCEL, "Too early to cancel the challenge.");
        // Declare player2 the winner
        processEndGame(GameOutput.Lost, challenge.player1Address, challenge.player2Address, challenge.gameValue);
    }
}