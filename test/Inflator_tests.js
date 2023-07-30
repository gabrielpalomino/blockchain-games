const { ethers } = require("hardhat");
const { expect } = require("chai");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

const GAME_ID_1 = 1;
const GAME_ID_2 = 2;

const turnValuePlayer1 = "1";
const salt = "aRandomSalt";
let dataHash;

describe("Inflator", function () {
  let contract;
  let owner;
  let player1;
  let player2;
  let player3;

  // Constants
  let MAXIMUM_VALUE_CHALLENGE;
  let MINIMUM_VALUE_CHALLENGE;
  let CHALLENGE_STATUS_EMPTY;
  let CHALLENGE_STATUS_WAITING;
  let CHALLENGE_STATUS_PLAYING;
  let BLOCKS_TO_CANCEL;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  before(function () {
    return (async () => {
      let accounts = await ethers.getSigners();
      owner = accounts[0];
      player1 = accounts[1];
      player2 = accounts[2];
      player3 = accounts[3];
      // Main contract
      const Contract = await ethers.getContractFactory("InflatorTest");
      contract = await Contract.deploy(owner.address);
      await contract.deployed();

      // DataType contract
      const DataTypesContract = await ethers.getContractFactory(
        "DataTypesTest"
      );
      const dataTypesContract = await DataTypesContract.deploy();
      await dataTypesContract.deployed();

      // Load constants
      MAXIMUM_VALUE_CHALLENGE =
        await dataTypesContract.MAXIMUM_VALUE_CHALLENGE_T();
      MINIMUM_VALUE_CHALLENGE =
        await dataTypesContract.MINIMUM_VALUE_CHALLENGE_T();
      CHALLENGE_STATUS_EMPTY = await dataTypesContract.CHALLENGE_STATUS_EMPTY();
      CHALLENGE_STATUS_WAITING =
        await dataTypesContract.CHALLENGE_STATUS_WAITING();
      CHALLENGE_STATUS_PLAYING =
        await dataTypesContract.CHALLENGE_STATUS_PLAYING();
      BLOCKS_TO_CANCEL = await dataTypesContract.BLOCKS_TO_CANCEL_T();

      dataHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["string", "string"],
          [turnValuePlayer1, salt]
        )
      );
    })();
  });

  describe("start", function () {
    it("Should revert if value sent is less than MINIMUM_VALUE_CHALLENGE.", async function () {
      const minimumValueInEther = ethers.BigNumber.from(
        MINIMUM_VALUE_CHALLENGE
      );
      await expect(
        contract.connect(player1).start(GAME_ID_1, dataHash, {
          value: minimumValueInEther.sub(ethers.utils.parseEther("0.001")),
        })
      ).to.be.revertedWith(
        "Value must be greater than MINIMUM VALUE CHALLENGE and lower or equal to MAXIMUM VALUE CHALLENGE."
      );
    });

    it("Should revert if value sent is bigger than MAXIMUM_VALUE_CHALLENGE.", async function () {
      await expect(
        contract.connect(player1).start(GAME_ID_1, dataHash, {
          value: ethers.utils.parseEther("0.01").add(MAXIMUM_VALUE_CHALLENGE),
        })
      ).to.be.revertedWith(
        "Value must be greater than MINIMUM VALUE CHALLENGE and lower or equal to MAXIMUM VALUE CHALLENGE."
      );
    });

    it("Should revert if player already started a game.", async function () {
      await contract.connect(player1).start(GAME_ID_1, dataHash, {
        value: ethers.utils.parseEther("1"),
      });
      await expect(
        contract.connect(player1).start(GAME_ID_1, dataHash, {
          value: ethers.utils.parseEther("1"),
        })
      ).to.be.revertedWith("Player has already an open game.");
    });

    describe("adding the first player", function () {
      before(function () {
        return (async () => {
          const Contract = await ethers.getContractFactory("InflatorTest");
          contract = await Contract.deploy(owner.address);
          await contract.deployed();

          await contract.connect(player1).start(GAME_ID_1, dataHash, {
            value: ethers.utils.parseEther("1"),
          });
        })();
      });

      describe("Should create the challenge", function () {
        let challenge;

        before(function () {
          return (async () => {
            challenge = await contract.connect(player1).getChallengeTest();
          })();
        });

        it("Should create the challenge with the player1 address = the sender address", async function () {
          expect(challenge.player1Address).to.equal(player1.address);
        });

        it("Should create the challenge with the player2 address = zero address", async function () {
          expect(challenge.player2Address).to.equal(
            ethers.constants.AddressZero
          );
        });

        it("Should create the challenge with the game value same as sender value", async function () {
          expect(challenge.gameValue).to.equal(ethers.utils.parseEther("1"));
        });

        it("Should create the challenge with the game data same as the data sent.", async function () {
          expect(challenge.player1Data).to.equal(dataHash);
        });

        it("Should create the challenge with the player2 game data = 0.", async function () {
          expect(challenge.player2Data).to.equal(0);
        });

        it("Should create the challenge with the player1 game id same as the game id sent.", async function () {
          expect(challenge.player1GameId).to.equal(GAME_ID_1);
        });

        it("Should create the challenge with the player2 game id = 0.", async function () {
          expect(challenge.player2GameId).to.equal(0);
        });

        it("Should create the challenge with a block number = 0.", async function () {
          expect(challenge.player2BlockNumber).to.equal(0);
        });

        it("Should create the challenge with a status = CHALLENGE_STATUS_WAITING.", async function () {
          expect(challenge.status).to.equal(CHALLENGE_STATUS_WAITING);
        });
      });

      describe("Cancelling the challenge", function () {
        it("Should revert if sender is not a player", async function () {
          await expect(
            contract.connect(player2).cancelChallenge()
          ).to.be.revertedWith("Address not recognized as player.");
        });

        it("Should revert if challenge already has a player2", async function () {
          await contract.connect(player1).setChalengeStatusPlayingTest();
          await expect(
            contract.connect(player1).cancelChallenge()
          ).to.be.revertedWith(
            "Challenge can not be cancelled, opponent player already playing."
          );
          await contract.connect(player1).setChalengeStatusWaitingTest();
        });

        it("Should reset challenge data.", async function () {
          await contract.connect(player1).cancelChallenge();
          const challenge = await contract.connect(player1).getChallengeTest();
          expect(challenge.player1Address).to.equal(
            ethers.constants.AddressZero
          );
          expect(challenge.player2Address).to.equal(
            ethers.constants.AddressZero
          );
          expect(challenge.gameValue).to.equal(0);
          expect(challenge.player1GameId).to.equal(0);
          expect(challenge.player2GameId).to.equal(0);
          expect(challenge.player1Data).to.equal(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          );
          expect(challenge.player2Data).to.equal(0);
          expect(challenge.player2BlockNumber).to.equal(0);
          expect(challenge.status).to.equal(0);
        });

        it("Should register player address to be able to claim refund.", async function () {
          const value = await contract.connect(player1).refundToClaimTest();
          expect(value).to.equal(ethers.utils.parseEther("1"));
        });
      });
    });
  });

  describe("forcing cancel a challenge", function () {
    before(function () {
      return (async () => {
        const Contract = await ethers.getContractFactory("InflatorTest");
        contract = await Contract.deploy(owner.address);
        await contract.deployed();

        await contract.connect(player1).start(GAME_ID_1, dataHash, {
          value: ethers.utils.parseEther("1"),
        });
      })();
    });

    it("Should revert if address of player1 is a zero address", async function () {
      await expect(
        contract.connect(player2).forceCancelChallenge()
      ).to.revertedWith("Opponent address must be non-zero.");
    });

    it("Should revert if address of the sender is not the address of player2", async function () {
      await contract.connect(player2).reply(player1.address, GAME_ID_2, 2, {
        value: ethers.utils.parseEther("1"),
      });

      await expect(
        contract.connect(player3).forceCancelChallenge()
      ).to.revertedWith("Opponent address must be non-zero.");
    });

    it("Should revert if challenge is not in Playing state", async function () {
      await contract.connect(player1).setChalengeStatusWaitingTest();

      await expect(
        contract.connect(player2).forceCancelChallenge()
      ).to.revertedWith("Challenge can not be cancelled.");

      await contract.connect(player1).setChalengeStatusPlayingTest();
    });

    it("Should revert if it is too early to cancel the challenge", async function () {
      await expect(
        contract.connect(player2).forceCancelChallenge()
      ).to.revertedWith("Too early to cancel the challenge.");
    });

    it("Should allow player2 to claim the prize if required time has passed", async function () {
      await mine(BLOCKS_TO_CANCEL);

      await contract.connect(player2).forceCancelChallenge();

      const beforeBalance = await ethers.provider.getBalance(player2.address);
      await contract.connect(player2).claimPrize();
      const afterBalance = await ethers.provider.getBalance(player2.address);
      expect(afterBalance).to.greaterThan(beforeBalance);
      const value = await contract.connect(player2).refundToClaimTest();
      expect(value).to.equal(0);
    });

    it("Should revert if player1 claims the prize", async function () {
      await expect(contract.connect(player1).claimPrize()).to.be.revertedWith(
        "No pending prize to claim."
      );
    });

    it("Should reset challenge data.", async function () {
      const challenge = await contract.connect(player1).getChallengeTest();
      expect(challenge.player1Address).to.equal(ethers.constants.AddressZero);
      expect(challenge.player2Address).to.equal(ethers.constants.AddressZero);
      expect(challenge.gameValue).to.equal(0);
      expect(challenge.player1GameId).to.equal(0);
      expect(challenge.player2GameId).to.equal(0);
      expect(challenge.player1Data).to.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      expect(challenge.player2Data).to.equal(0);
      expect(challenge.player2BlockNumber).to.equal(0);
      expect(challenge.status).to.equal(0);
    });

    it("Should reset opponent address", async function () {
      const opponentAddress = await contract.connect(player2).getOpponentTest();
      expect(opponentAddress).to.equal(ethers.constants.AddressZero);
    });
  });
});
