const { ethers } = require("hardhat");
const { expect } = require("chai");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

const GAME_ID_1 = 1;
const GAME_ID_2 = 2;

const turnValuePlayer = "1";
const turnValuePlayer2ToLoose = 2;
const turnValuePlayer2ToWin = 1;
const turnValuePlayerTooLong = "23";
const turnValuePlayerEmpty = "";
const turnValuePlayerInvalid = "3";
const turnValuePlayerNotANumber = "a";

const salt = "aRandomSalt";
let dataHash;
let dataHashTooLong;
let dataHashEmpty;
let dataHashInvalid;
let dataHashNotANumber;

describe("Gameplay", function () {
  let contract;
  let owner;
  let player1;
  let player2;
  let player3;
  let player4;
  let player5;
  let player6;
  let player7;
  let player8;
  let player9;
  let player10;
  let player11;
  let player12;
  let player13;
  let admin1;
  let admin2;

  // Signatures
  let signature;
  let signatureDataTooLong;
  let signatureDataEmpty;
  let signatureDataInvalid;
  let signatureDataNotANumber;

  // Constants
  let MAXIMUM_VALUE_CHALLENGE;
  let MINIMUM_VALUE_CHALLENGE;
  let CHALLENGE_STATUS_EMPTY;
  let CHALLENGE_STATUS_WAITING;
  let CHALLENGE_STATUS_PLAYING;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  before(function () {
    return (async () => {
      const Contract = await ethers.getContractFactory("InflatorTest");
      let accounts = await ethers.getSigners();
      owner = accounts[0];
      player1 = accounts[1];
      player2 = accounts[2];
      player3 = accounts[3];
      player4 = accounts[4];
      player5 = accounts[5];
      player6 = accounts[6];
      player7 = accounts[7];
      player8 = accounts[8];
      player9 = accounts[9];
      player10 = accounts[10];
      player11 = accounts[11];
      player12 = accounts[12];
      player13 = accounts[13];
      admin1 = accounts[12];
      admin2 = accounts[13];
      contract = await Contract.deploy(owner.address);
      await contract.deployed();

      // Valid data hash
      dataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(turnValuePlayer + salt)
      );
      signature = await player1.signMessage(ethers.utils.arrayify(dataHash));

      // Too long data hash
      dataHashTooLong = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(turnValuePlayerTooLong + salt)
      );
      signatureDataTooLong = await player6.signMessage(
        ethers.utils.arrayify(dataHashTooLong)
      );

      // Empty data hash
      dataHashEmpty = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(turnValuePlayerEmpty + salt)
      );
      signatureDataEmpty = await player8.signMessage(
        ethers.utils.arrayify(dataHashEmpty)
      );

      // Invalid data hash
      dataHashInvalid = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(turnValuePlayerInvalid + salt)
      );
      signatureDataInvalid = await player10.signMessage(
        ethers.utils.arrayify(dataHashInvalid)
      );

      // Not a number data hash
      dataHashNotANumber = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(turnValuePlayerNotANumber + salt)
      );
      signatureDataNotANumber = await player12.signMessage(
        ethers.utils.arrayify(dataHashNotANumber)
      );

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

      // Player 1 starts
      await contract.connect(player1).start(GAME_ID_1, dataHash, {
        value: ethers.utils.parseEther("1"),
      });
    })();
  });

  describe("replying a game", function () {
    context("when not valid", function () {
      it("Should revert if value sent is less than MINIMUM_VALUE_CHALLENGE.", async function () {
        const minimumValueInEther = ethers.BigNumber.from(
          MINIMUM_VALUE_CHALLENGE
        );
        await expect(
          contract.connect(player2).reply(player1.address, GAME_ID_2, 1, {
            value: minimumValueInEther.sub(ethers.utils.parseEther("0.000001")),
          })
        ).to.be.revertedWith(
          "Value must be greater than MINIMUM VALUE CHALLENGE and lower or equal to MAXIMUM VALUE CHALLENGE."
        );
      });

      it("Should revert if value sent is more than MAXIMUM_VALUE_CHALLENGE.", async function () {
        await expect(
          contract.connect(player2).reply(player1.address, GAME_ID_2, 1, {
            value: ethers.utils.parseEther("0.01").add(MAXIMUM_VALUE_CHALLENGE),
          })
        ).to.be.revertedWith(
          "Value must be greater than MINIMUM VALUE CHALLENGE and lower or equal to MAXIMUM VALUE CHALLENGE."
        );
      });

      it("Should revert if address sent is zero address.", async function () {
        await expect(
          contract
            .connect(player2)
            .reply(ethers.constants.AddressZero, GAME_ID_2, 1, {
              value: ethers.utils.parseEther("1"),
            })
        ).to.be.revertedWith("Address must be non-zero.");
      });

      it("Should revert if sender address is the same as the one started.", async function () {
        await expect(
          contract.connect(player1).reply(player1.address, GAME_ID_2, 1, {
            value: ethers.utils.parseEther("1"),
          })
        ).to.be.revertedWith("You can't play against yourself.");
      });

      it("Should revert if address sent is not a player.", async function () {
        await expect(
          contract
            .connect(player2)
            .reply("0x0000000000000000000000000000000000000001", GAME_ID_2, 1, {
              value: ethers.utils.parseEther("1"),
            })
        ).to.be.revertedWith("Player address sent is not a player.");
      });

      it("Should revert if value sent is not the same as opponent player.", async function () {
        await expect(
          contract.connect(player2).reply(player1.address, GAME_ID_2, 1, {
            value: ethers.utils.parseEther("1.1"),
          })
        ).to.be.revertedWith("Value must be same as opponent.");
      });

      it("Should revert if challenge is already being replied by another player.", async function () {
        await contract.connect(player1).setChalengeStatusPlayingTest();
        await expect(
          contract.connect(player2).reply(player1.address, GAME_ID_2, 1, {
            value: ethers.utils.parseEther("1"),
          })
        ).to.be.revertedWith("Target player is already playing.");
        await contract.connect(player1).setChalengeStatusWaitingTest();
      });

      it("Should revert if data sent is not valid.", async function () {
        await expect(
          contract.connect(player2).reply(player1.address, GAME_ID_2, 4, {
            value: ethers.utils.parseEther("1"),
          })
        ).to.be.revertedWith("Data sent is not valid.");
      });
    });

    context("when valid", function () {
      let challenge;
      let beforeBalance;

      before(function () {
        return (async () => {
          await mine(1000);

          beforeBalance = await ethers.provider.getBalance(owner.address);

          await contract.connect(player2).reply(player1.address, GAME_ID_2, 1, {
            value: ethers.utils.parseEther("1"),
          });

          challenge = await contract.connect(player1).getChallengeTest();
        })();
      });

      it("Should revert if player that replied tries to reply another challenge.", async function () {
        await expect(
          contract.connect(player2).reply(player3.address, GAME_ID_2, 4, {
            value: ethers.utils.parseEther("1"),
          })
        ).to.be.revertedWith("Player has already an open game.");
      });

      it("Should store the opponent address", async function () {
        const opponentAddress = await contract
          .connect(player2)
          .getOpponentTest();
        expect(opponentAddress).to.equal(player1.address);
      });

      it("Should update the challenge with the player2 address = the sender address", async function () {
        expect(challenge.player2Address).to.equal(player2.address);
      });

      it("Should update the challenge with the player 2 game data.", async function () {
        expect(challenge.player2Data).to.equal(1);
      });

      it("Should update the challenge with the player 2 game id.", async function () {
        expect(challenge.player2GameId).to.equal(GAME_ID_2);
      });

      it("Should update the challenge with a block number > 1000.", async function () {
        expect(challenge.player2BlockNumber).to.greaterThan(1000);
      });

      it("Should update the challenge with a status = CHALLENGE_STATUS_PLAYING.", async function () {
        expect(challenge.status).to.equal(CHALLENGE_STATUS_PLAYING);
      });

      it("Should transfer fees to owner equal to 5% of the total game challenge value.", async function () {
        const afterBalance = await ethers.provider.getBalance(owner.address);
        const expectedIncrease = ethers.utils.parseEther("0.1");
        expect(afterBalance.sub(beforeBalance)).to.equal(expectedIncrease);
      });

      it("Should store a value in game accumulated equal to 5% of each single challenge value.", async function () {
        // Grant access to admin accounts
        await contract.connect(owner).grantAdminAccess(admin1.address);
        await contract.connect(owner).grantAdminAccess(admin2.address);

        // Get accumulated
        const accGame1 = await contract
          .connect(admin1)
          .getGameAccumulated(GAME_ID_1);
        const accGame2 = await contract
          .connect(admin2)
          .getGameAccumulated(GAME_ID_2);

        const expected = ethers.utils.parseEther("0.05");
        expect(accGame1).to.equal(expected);
        expect(accGame2).to.equal(expected);
      });

      it("Should accumulate the value in game accumulated for each next game played", async function () {
        // Player 3 starts
        await contract.connect(player3).start(GAME_ID_1, dataHash, {
          value: ethers.utils.parseEther("2"),
        });

        // Player 4 replies
        await contract.connect(player4).reply(player3.address, GAME_ID_2, 1, {
          value: ethers.utils.parseEther("2"),
        });

        // Get accumulated
        const accGame1 = await contract
          .connect(admin1)
          .getGameAccumulated(GAME_ID_1);
        const accGame2 = await contract
          .connect(admin2)
          .getGameAccumulated(GAME_ID_2);

        const expected = ethers.utils.parseEther("0.15");
        expect(accGame1).to.equal(expected);
        expect(accGame2).to.equal(expected);
      });

      it("Should update challenge game value", async function () {
        const currentValue = challenge.gameValue;
        const expectedValue = ethers.utils.parseEther("1.9");
        expect(currentValue).to.equal(expectedValue);
      });

      it("Should revert if player1 tries to cancel the game", async function () {
        await expect(
          contract.connect(player1).cancelChallenge()
        ).to.be.revertedWith(
          "Challenge can not be cancelled, opponent player already playing."
        );
      });
    });
  });

  describe("resolving a game", function () {
    context("if it is not valid", function () {
      it("Should revert if address sent is not a player.", async function () {
        await expect(
          contract.connect(player2).resolve(turnValuePlayer, salt, signature)
        ).to.be.revertedWith("Address is not a player.");
      });

      it("Should revert if challenge is not ready to be resolved.", async function () {
        // Player 5 starts
        await contract.connect(player5).start(GAME_ID_1, dataHash, {
          value: ethers.utils.parseEther("1"),
        });
        // Player 5 resolves
        await expect(
          contract.connect(player5).resolve(turnValuePlayer, salt, signature)
        ).to.be.revertedWith("Challenge is not ready to be resolved.");
      });

      it("Should revert if signature length is not 65.", async function () {
        await expect(
          contract
            .connect(player1)
            .resolve(turnValuePlayer, salt, "0x1234567890")
        ).to.be.revertedWith("Invalid signature length.");
      });

      it("Should revert if the data is not signed by the player.", async function () {
        const invalidSignature = await player2.signMessage(
          ethers.utils.arrayify(dataHash)
        );

        await expect(
          contract
            .connect(player1)
            .resolve(turnValuePlayer, salt, invalidSignature)
        ).to.be.revertedWith("Data not signed by the initial sender.");
      });

      it("Should revert if challenge data is not matching with the hashed data.", async function () {
        await expect(
          contract
            .connect(player1)
            .resolve(turnValuePlayerTooLong, salt, signature)
        ).to.be.revertedWith("Data not signed by the initial sender.");
      });

      it("Should revert if salt is different.", async function () {
        await expect(
          contract
            .connect(player1)
            .resolve(turnValuePlayer, "wrong salt", signature)
        ).to.be.revertedWith("Data not signed by the initial sender.");
      });

      it("Should revert if data sent length > 1.", async function () {
        await contract.connect(player6).start(GAME_ID_1, dataHashTooLong, {
          value: ethers.utils.parseEther("1"),
        });

        await contract.connect(player7).reply(player6.address, GAME_ID_2, 1, {
          value: ethers.utils.parseEther("1"),
        });

        await expect(
          contract
            .connect(player6)
            .resolve(turnValuePlayerTooLong, salt, signatureDataTooLong)
        ).to.be.revertedWith("Invalid string length.");
      });

      it("Should revert if data sent is empty.", async function () {
        await contract.connect(player8).start(GAME_ID_1, dataHashEmpty, {
          value: ethers.utils.parseEther("1"),
        });

        await contract.connect(player9).reply(player8.address, GAME_ID_2, 1, {
          value: ethers.utils.parseEther("1"),
        });

        await expect(
          contract
            .connect(player8)
            .resolve(turnValuePlayerEmpty, salt, signatureDataEmpty)
        ).to.be.revertedWith("Invalid string length.");
      });

      it("Should revert if data sent is invalid.", async function () {
        await contract.connect(player10).start(GAME_ID_1, dataHashInvalid, {
          value: ethers.utils.parseEther("1"),
        });

        await contract.connect(player11).reply(player10.address, GAME_ID_2, 1, {
          value: ethers.utils.parseEther("1"),
        });

        await expect(
          contract
            .connect(player10)
            .resolve(turnValuePlayerInvalid, salt, signatureDataInvalid)
        ).to.be.revertedWith("The data sent is not valid.");
      });

      it("Should revert if data sent is not a number.", async function () {
        await contract.connect(player12).start(GAME_ID_1, dataHashNotANumber, {
          value: ethers.utils.parseEther("1"),
        });

        await contract.connect(player13).reply(player12.address, GAME_ID_2, 1, {
          value: ethers.utils.parseEther("1"),
        });

        await expect(
          contract
            .connect(player12)
            .resolve(turnValuePlayerNotANumber, salt, signatureDataNotANumber)
        ).to.be.revertedWith("Invalid numerical value.");
      });
    });

    context("if it is valid", function () {
      let challenge;

      context("and player1 wins", function () {
        before(function () {
          return (async () => {
            const Contract = await ethers.getContractFactory("InflatorTest");
            contract = await Contract.deploy(owner.address);
            await contract.deployed();

            await contract.connect(player1).start(GAME_ID_1, dataHash, {
              value: ethers.utils.parseEther("1"),
            });

            await contract
              .connect(player2)
              .reply(player1.address, GAME_ID_2, turnValuePlayer2ToLoose, {
                value: ethers.utils.parseEther("1"),
              });

            await contract
              .connect(player1)
              .resolve(turnValuePlayer, salt, signature);

            challenge = await contract.connect(player1).getChallengeTest();
          })();
        });

        it("Should revert is player2 claims prize", async function () {
          await expect(
            contract.connect(player2).claimPrize()
          ).to.be.revertedWith("No pending prize to claim.");
        });

        it("Should allow player1 to claim prize", async function () {
          const beforeBalance = await ethers.provider.getBalance(
            player1.address
          );
          await contract.connect(player1).claimPrize();
          const afterBalance = await ethers.provider.getBalance(
            player1.address
          );
          expect(afterBalance).to.greaterThan(beforeBalance);
          const value = await contract.connect(player1).refundToClaimTest();
          expect(value).to.equal(0);
        });

        it("Should remove player 1 and reset challenge data", async function () {
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

        it("Should reset opponent address", async function () {
          const opponentAddress = await contract
            .connect(player2)
            .getOpponentTest();
          expect(opponentAddress).to.equal(ethers.constants.AddressZero);
        });
      });

      context("and player2 wins", function () {
        before(function () {
          return (async () => {
            const Contract = await ethers.getContractFactory("InflatorTest");
            contract = await Contract.deploy(owner.address);
            await contract.deployed();

            await contract.connect(player1).start(GAME_ID_1, dataHash, {
              value: ethers.utils.parseEther("1"),
            });

            await contract
              .connect(player2)
              .reply(player1.address, GAME_ID_2, turnValuePlayer2ToWin, {
                value: ethers.utils.parseEther("1"),
              });

            await contract
              .connect(player1)
              .resolve(turnValuePlayer, salt, signature);

            challenge = await contract.connect(player1).getChallengeTest();
          })();
        });

        it("Should revert is player1 claims prize", async function () {
          await expect(
            contract.connect(player1).claimPrize()
          ).to.be.revertedWith("No pending prize to claim.");
        });

        it("Should allow player2 to claim prize", async function () {
          const beforeBalance = await ethers.provider.getBalance(
            player1.address
          );
          await contract.connect(player2).claimPrize();
          const afterBalance = await ethers.provider.getBalance(
            player2.address
          );
          expect(afterBalance).to.greaterThan(beforeBalance);
          const value = await contract.connect(player2).refundToClaimTest();
          expect(value).to.equal(0);
        });

        it("Should remove player 1 and reset challenge data", async function () {
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

        it("Should reset opponent address", async function () {
          const opponentAddress = await contract
            .connect(player2)
            .getOpponentTest();
          expect(opponentAddress).to.equal(ethers.constants.AddressZero);
        });
      });
    });
  });
});
