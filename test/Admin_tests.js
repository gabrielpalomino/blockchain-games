const { ethers } = require("hardhat");
const { expect } = require("chai");

const GAME_ID_1 = 1;
const GAME_ID_2 = 2;

const turnValuePlayer1 = "1";
const salt = "aRandomSalt";
let dataHash;

describe("Admin", function () {
  let contract;
  let adminAddress;
  let nonAdminAddress;
  let owner;
  let nonOwner;
  let player1;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  before(function () {
    return (async () => {
      let accounts = await ethers.getSigners();
      owner = accounts[0];
      nonOwner = accounts[1];
      adminAddress = accounts[10].address;
      nonAdminAddress = accounts[11].address;
      player1 = accounts[12];
      const Contract = await ethers.getContractFactory("InflatorTest");
      contract = await Contract.deploy(owner.address);
      await contract.deployed();
    })();
  });

  describe("grant / revoque admin access", function () {
    it("Should allow owner to grant access to an admin address", async function () {
      await contract.connect(owner).grantAdminAccess(adminAddress);
      const value = await contract
        .connect(owner)
        .getAdminAccessTest(adminAddress);
      expect(value).to.equal(1);
    });

    it("Should not allow to a non owner to grant access to any address", async function () {
      await expect(
        contract.connect(nonOwner).grantAdminAccess(nonAdminAddress)
      ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow to a non owner to revoque access to any address", async function () {
      await expect(
        contract.connect(nonOwner).revoqueAdminAccess(nonAdminAddress)
      ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to revoque access to an admin address", async function () {
      await contract.connect(owner).revoqueAdminAccess(adminAddress);
      const value = await contract
        .connect(owner)
        .getAdminAccessTest(adminAddress);
      expect(value).to.equal(0);
    });
  });

  describe("cancel game", function () {
    before(function () {
      return (async () => {
        const Contract = await ethers.getContractFactory("InflatorTest");
        contract = await Contract.deploy(owner.address);
        await contract.deployed();
        dataHash = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["string", "string"],
            [turnValuePlayer1, salt]
          )
        );
        await contract.connect(player1).start(GAME_ID_1, dataHash, {
          value: ethers.utils.parseEther("1"),
        });
        await contract.connect(player1).cancelChallenge();
      })();
    });

    it("Should allow to claim refund", async function () {
      const beforeBalance = await ethers.provider.getBalance(player1.address);
      await contract.connect(player1).claimRefund();
      const afterBalance = await ethers.provider.getBalance(player1.address);
      expect(afterBalance).to.greaterThan(beforeBalance);
      const value = await contract.connect(player1).refundToClaimTest();
      expect(value).to.equal(0);
    });

    it("Should revert if already claimed refund", async function () {
      await expect(contract.connect(player1).claimRefund()).to.revertedWith(
        "No pending refund to claim."
      );
    });
  });
});
