const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("GuessHandGame", function () {
  let contract;

  // Constants
  let LEFT_HAND;
  let RIGHT_HAND;
  let TURN_VALIDATION_VALID;
  let TURN_VALIDATION_INVALID;
  let GAME_OUTPUT_WON;
  let GAME_OUTPUT_LOST;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  before(function () {
    return (async () => {
      const Contract = await ethers.getContractFactory("InflatorTest");
      accounts = await ethers.getSigners();
      const ownerAccount = accounts[10];
      const ownerAddress = ownerAccount.address;
      contract = await Contract.deploy(ownerAddress);

      const GuessHandGameContract = await ethers.getContractFactory(
        "GuessHandGameTest"
      );
      const guessHandGameContract = await GuessHandGameContract.deploy();
      await guessHandGameContract.deployed();

      // Load constants
      LEFT_HAND = await guessHandGameContract.LEFT_HAND_T();
      RIGHT_HAND = await guessHandGameContract.RIGHT_HAND_T();

      const DataTypesContract = await ethers.getContractFactory(
        "DataTypesTest"
      );
      const dataTypesContract = await DataTypesContract.deploy();
      await dataTypesContract.deployed();

      TURN_VALIDATION_VALID = await dataTypesContract.TURN_VALIDATION_VALID();
      TURN_VALIDATION_INVALID =
        await dataTypesContract.TURN_VALIDATION_INVALID();

      GAME_OUTPUT_WON = await dataTypesContract.GAME_OUTPUT_WON();
      GAME_OUTPUT_LOST = await dataTypesContract.GAME_OUTPUT_LOST();
    })();
  });

  describe("validate", function () {
    it("Should return VALID if data sent is LEFT_HAND.", async function () {
      const result = await contract.validateTest(LEFT_HAND);
      expect(result).to.equal(TURN_VALIDATION_VALID);
    });

    it("Should return VALID if data sent is RIGHT_HAND.", async function () {
      const result = await contract.validateTest(RIGHT_HAND);
      expect(result).to.equal(TURN_VALIDATION_VALID);
    });

    it("Should return INVALID if data sent is different than LEFT_HAND or RIGHT_HAND.", async function () {
      const result = await contract.validateTest(4);
      expect(result).to.equal(TURN_VALIDATION_INVALID);
    });
  });

  describe("resolve", function () {
    it("Should return LOST if data sent is LEFT_HAND / LEFT_HAND.", async function () {
      const result = await contract.resolveTest(LEFT_HAND, LEFT_HAND);
      expect(result).to.equal(GAME_OUTPUT_LOST);
    });

    it("Should return LOST if data sent is RIGHT_HAND / RIGHT_HAND.", async function () {
      const result = await contract.resolveTest(RIGHT_HAND, RIGHT_HAND);
      expect(result).to.equal(GAME_OUTPUT_LOST);
    });

    it("Should return WON if data sent is LEFT_HAND / RIGHT_HAND.", async function () {
      const result = await contract.resolveTest(LEFT_HAND, RIGHT_HAND);
      expect(result).to.equal(GAME_OUTPUT_WON);
    });

    it("Should return WON if data sent is RIGHT_HAND / LEFT_HAND.", async function () {
      const result = await contract.resolveTest(RIGHT_HAND, LEFT_HAND);
      expect(result).to.equal(GAME_OUTPUT_WON);
    });
  });
});
