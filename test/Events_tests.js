const { ethers } = require("hardhat");
const { expect } = require("chai");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

const GAME_ID_1 = 1;
const turnValuePlayer = "1";
const salt = "aRandomSalt";
let dataHash;

describe("Events", function () {
  let contract;
  let owner;
  let player1;
  let player2;
  let signature;
  let BLOCKS_TO_CANCEL;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  before(function () {
    return (async () => {
      const accounts = await ethers.getSigners();
      owner = accounts[0];
      player1 = accounts[1];
      player2 = accounts[2];
      const Contract = await ethers.getContractFactory("InflatorTest");
      contract = await Contract.deploy(owner.address);
      await contract.deployed();

      dataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(turnValuePlayer + salt)
      );
      signature = await player1.signMessage(ethers.utils.arrayify(dataHash));

      // DataType contract
      const DataTypesContract = await ethers.getContractFactory(
        "DataTypesTest"
      );
      const dataTypesContract = await DataTypesContract.deploy();
      await dataTypesContract.deployed();

      BLOCKS_TO_CANCEL = await dataTypesContract.BLOCKS_TO_CANCEL_T();
    })();
  });

  describe("starting a game", function () {
    it("Should emit event type OpenChallenge", async function () {
      const expectedAmount = ethers.utils.parseEther("1");
      await expect(
        await contract.connect(player1).start(GAME_ID_1, dataHash, {
          value: ethers.utils.parseEther("1"),
        })
      )
        .to.emit(contract, "OpenChallenge")
        .withArgs(player1.address, expectedAmount);
    });
  });

  describe("replying a game", function () {
    it("Should emit event type Playing", async function () {
      await expect(
        contract.connect(player2).reply(player1.address, GAME_ID_1, 1, {
          value: ethers.utils.parseEther("1"),
        })
      )
        .to.emit(contract, "Playing")
        .withArgs(player1.address, player2.address);
    });
  });

  describe("resolving a game", function () {
    context("if player1 wins", function () {
      before(function () {
        return (async () => {
          const Contract = await ethers.getContractFactory("InflatorTest");
          contract = await Contract.deploy(owner.address);
          await contract.deployed();

          await contract.connect(player1).start(GAME_ID_1, dataHash, {
            value: ethers.utils.parseEther("1"),
          });

          await contract.connect(player2).reply(player1.address, GAME_ID_1, 2, {
            value: ethers.utils.parseEther("1"),
          });
        })();
      });

      it("Should emit event type Won with player1 address and Lost with player2 address", async function () {
        await expect(
          await contract
            .connect(player1)
            .resolve(turnValuePlayer, salt, signature)
        )
          .to.emit(contract, "Won")
          .withArgs(player1.address)
          .to.emit(contract, "Lost")
          .withArgs(player2.address);
      });
    });

    context("if player2 wins", function () {
      before(function () {
        return (async () => {
          const Contract = await ethers.getContractFactory("InflatorTest");
          contract = await Contract.deploy(owner.address);
          await contract.deployed();

          await contract.connect(player1).start(GAME_ID_1, dataHash, {
            value: ethers.utils.parseEther("1"),
          });

          await contract.connect(player2).reply(player1.address, GAME_ID_1, 1, {
            value: ethers.utils.parseEther("1"),
          });
        })();
      });

      it("Should emit event type Won with player2 address and Lost with player1 address", async function () {
        await expect(
          await contract
            .connect(player1)
            .resolve(turnValuePlayer, salt, signature)
        )
          .to.emit(contract, "Won")
          .withArgs(player2.address)
          .to.emit(contract, "Lost")
          .withArgs(player1.address);
      });
    });
  });

  describe("cancelling a game", function () {
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

    it("Should emit event type CancelledChallenge", async function () {
      await expect(await contract.connect(player1).cancelChallenge())
        .to.emit(contract, "CancelledChallenge")
        .withArgs(player1.address);
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

        await contract.connect(player2).reply(player1.address, GAME_ID_1, 1, {
          value: ethers.utils.parseEther("1"),
        });
      })();
    });

    it("Should emit event type Won with player2 address and Lost with player1 address", async function () {
      await mine(BLOCKS_TO_CANCEL);

      await expect(contract.connect(player2).forceCancelChallenge())
        .to.emit(contract, "Won")
        .withArgs(player2.address)
        .to.emit(contract, "Lost")
        .withArgs(player1.address);
    });
  });
});
