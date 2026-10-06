const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const STAKE = ethers.utils.parseEther("0.01");
const HALF_STAKE = ethers.utils.parseEther("0.005");
const PAYOUT = ethers.utils.parseEther("0.005");

describe("DominionDAO", function () {
  let dao;
  let owner;
  let alice;
  let bob;
  let beneficiary;

  beforeEach(async function () {
    [owner, alice, bob, beneficiary] = await ethers.getSigners();
    const DominionDAO = await ethers.getContractFactory("DominionDAO");
    dao = await DominionDAO.deploy();
    await dao.deployed();
  });

  async function contributeStakeholder(signer = owner) {
    await dao.connect(signer).contribute({ value: STAKE });
  }

  async function createProposal(signer = owner, receiver = beneficiary.address) {
    await contributeStakeholder(signer);
    await dao
      .connect(signer)
      .createProposal("Demo payout", "PTIT five-minute proposal", receiver, PAYOUT);
  }

  async function expireProposal() {
    await network.provider.send("evm_increaseTime", [5 * 60]);
    await network.provider.send("evm_mine");
  }

  it("deploys with the documented constants and an empty treasury", async function () {
    expect(dao.address).to.properAddress;
    expect(await dao.MIN_STAKEHOLDER_CONTRIBUTION()).to.equal(STAKE);
    expect(await dao.VOTING_DURATION()).to.equal(300);
    expect(await dao.daoBalance()).to.equal(0);
  });

  it("accepts contributions and increases the DAO balance", async function () {
    await expect(dao.connect(alice).contribute({ value: HALF_STAKE }))
      .to.emit(dao, "Action")
      .withArgs(alice.address, await dao.CONTRIBUTOR_ROLE(), "CONTRIBUTION RECEIVED", dao.address, HALF_STAKE);
    expect(await dao.daoBalance()).to.equal(HALF_STAKE);
  });

  it("tracks each member contribution", async function () {
    await dao.connect(alice).contribute({ value: HALF_STAKE });
    await dao.connect(alice).contribute({ value: HALF_STAKE });
    expect(await dao.connect(alice).getBalance()).to.equal(STAKE);
    expect(await dao.connect(bob).getBalance()).to.equal(0);
  });

  it("grants stakeholder status only when cumulative contribution reaches 0.01 ETH", async function () {
    await dao.connect(alice).contribute({ value: HALF_STAKE });
    expect(await dao.connect(alice).isStakeholder()).to.equal(false);
    await dao.connect(alice).contribute({ value: HALF_STAKE });
    expect(await dao.connect(alice).isStakeholder()).to.equal(true);
  });

  it("rejects a zero contribution", async function () {
    await expect(dao.contribute({ value: 0 })).to.be.revertedWith("Contribution must be greater than 0");
  });

  it("prevents a non-stakeholder from creating a proposal", async function () {
    await expect(
      dao.connect(alice).createProposal("No", "Not allowed", beneficiary.address, 1)
    ).to.be.revertedWith("Only stakeholders can create proposals");
  });

  it("creates a proposal with the correct on-chain data and five-minute duration", async function () {
    await contributeStakeholder(owner);
    const transaction = await dao.createProposal("Title", "Description", beneficiary.address, PAYOUT);
    const receipt = await transaction.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const proposal = await dao.getProposal(0);

    expect(proposal.id).to.equal(0);
    expect(proposal.title).to.equal("Title");
    expect(proposal.description).to.equal("Description");
    expect(proposal.beneficiary).to.equal(beneficiary.address);
    expect(proposal.proposer).to.equal(owner.address);
    expect(proposal.amount).to.equal(PAYOUT);
    expect(proposal.duration).to.equal(block.timestamp + 300);
    expect((await dao.getProposals()).length).to.equal(1);
  });

  it("validates proposal title, description, beneficiary, amount and DAO balance", async function () {
    await contributeStakeholder(owner);
    await expect(dao.createProposal("", "Description", beneficiary.address, 1)).to.be.revertedWith("Title is required");
    await expect(dao.createProposal("Title", "", beneficiary.address, 1)).to.be.revertedWith("Description is required");
    await expect(dao.createProposal("Title", "Description", ethers.constants.AddressZero, 1)).to.be.revertedWith("Invalid beneficiary address");
    await expect(dao.createProposal("Title", "Description", beneficiary.address, 0)).to.be.revertedWith("Amount must be greater than 0");
    await expect(dao.createProposal("Title", "Description", beneficiary.address, STAKE.add(1))).to.be.revertedWith("Insufficient DAO balance");
  });

  it("allows a stakeholder to vote and updates the count", async function () {
    await createProposal();
    await expect(dao.performVote(0, true)).to.emit(dao, "Action");
    const proposal = await dao.getProposal(0);
    expect(proposal.upvotes).to.equal(1);
    expect(proposal.downvotes).to.equal(0);
    const votes = await dao.getVotesOf(0);
    expect(votes[0].voter).to.equal(owner.address);
    expect(votes[0].choosen).to.equal(true);
  });

  it("records reject votes", async function () {
    await createProposal();
    await dao.performVote(0, false);
    const proposal = await dao.getProposal(0);
    expect(proposal.upvotes).to.equal(0);
    expect(proposal.downvotes).to.equal(1);
  });

  it("prevents duplicate voting", async function () {
    await createProposal();
    await dao.performVote(0, true);
    await expect(dao.performVote(0, false)).to.be.revertedWith("Already voted");
  });

  it("prevents voting after expiration", async function () {
    await createProposal();
    await expireProposal();
    await expect(dao.performVote(0, true)).to.be.revertedWith("Voting period has ended");
  });

  it("prevents payout before expiration", async function () {
    await createProposal();
    await dao.performVote(0, true);
    await expect(dao.payBeneficiary(0)).to.be.revertedWith("Voting period is still active");
  });

  it("prevents payout for a rejected proposal", async function () {
    await createProposal();
    await dao.performVote(0, false);
    await expireProposal();
    await expect(dao.payBeneficiary(0)).to.be.revertedWith("Proposal did not pass");
  });

  it("pays a passed proposal, increases beneficiary balance and decreases DAO balance", async function () {
    await createProposal();
    await dao.performVote(0, true);
    await expireProposal();

    const before = await ethers.provider.getBalance(beneficiary.address);
    await expect(dao.payBeneficiary(0))
      .to.emit(dao, "Action")
      .withArgs(owner.address, await dao.STAKEHOLDER_ROLE(), "PAYMENT TRANSFERED", beneficiary.address, PAYOUT);
    const after = await ethers.provider.getBalance(beneficiary.address);
    const proposal = await dao.getProposal(0);

    expect(after.sub(before)).to.equal(PAYOUT);
    expect(await dao.daoBalance()).to.equal(STAKE.sub(PAYOUT));
    expect(proposal.passed).to.equal(true);
    expect(proposal.paid).to.equal(true);
    expect(proposal.executor).to.equal(owner.address);
  });

  it("prevents paying the same proposal twice", async function () {
    await createProposal();
    await dao.performVote(0, true);
    await expireProposal();
    await dao.payBeneficiary(0);
    await expect(dao.payBeneficiary(0)).to.be.revertedWith("Proposal already paid");
  });

  it("rejects invalid proposal ids in read, vote and payout operations", async function () {
    await contributeStakeholder(owner);
    await expect(dao.getProposal(999)).to.be.revertedWith("Proposal does not exist");
    await expect(dao.getVotesOf(999)).to.be.revertedWith("Proposal does not exist");
    await expect(dao.performVote(999, true)).to.be.revertedWith("Proposal does not exist");
    await expect(dao.payBeneficiary(999)).to.be.revertedWith("Proposal does not exist");
  });

  it("allows any stakeholder to execute an approved payout", async function () {
    await createProposal(owner);
    await contributeStakeholder(alice);
    await dao.connect(owner).performVote(0, true);
    await dao.connect(alice).performVote(0, true);
    await expireProposal();
    await dao.connect(alice).payBeneficiary(0);
    expect((await dao.getProposal(0)).executor).to.equal(alice.address);
  });
});
