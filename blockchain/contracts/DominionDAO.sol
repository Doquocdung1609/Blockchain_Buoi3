// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title DominionDAO - a small teaching DAO for the PTIT Web3 practical.
/// @notice Contributions, proposals, votes and payouts are all stored on-chain.
contract DominionDAO is ReentrancyGuard, AccessControl {
    bytes32 public constant CONTRIBUTOR_ROLE = keccak256("CONTRIBUTOR");
    bytes32 public constant STAKEHOLDER_ROLE = keccak256("STAKEHOLDER");

    uint256 public constant MIN_STAKEHOLDER_CONTRIBUTION = 0.01 ether;
    uint256 public constant VOTING_DURATION = 5 minutes;

    uint256 public totalProposals;
    uint256 public daoBalance;

    mapping(uint256 => ProposalStruct) private raisedProposals;
    mapping(address => uint256[]) private stakeholderVotes;
    mapping(uint256 => VotedStruct[]) private votedOn;
    mapping(uint256 => mapping(address => bool)) private hasVoted;
    mapping(address => uint256) private contributors;

    struct ProposalStruct {
        uint256 id;
        uint256 amount;
        uint256 duration;
        uint256 upvotes;
        uint256 downvotes;
        string title;
        string description;
        bool passed;
        bool paid;
        address payable beneficiary;
        address proposer;
        address executor;
    }

    struct VotedStruct {
        address voter;
        uint256 timestamp;
        bool choosen;
    }

    event Action(
        address indexed initiator,
        bytes32 role,
        string message,
        address indexed beneficiary,
        uint256 amount
    );

    modifier stakeholderOnly(string memory message) {
        require(hasRole(STAKEHOLDER_ROLE, msg.sender), message);
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(proposalId < totalProposals, "Proposal does not exist");
        _;
    }

    function contribute() public payable returns (uint256) {
        require(msg.value > 0, "Contribution must be greater than 0");

        contributors[msg.sender] += msg.value;
        daoBalance += msg.value;

        _grantRole(CONTRIBUTOR_ROLE, msg.sender);
        if (contributors[msg.sender] >= MIN_STAKEHOLDER_CONTRIBUTION) {
            _grantRole(STAKEHOLDER_ROLE, msg.sender);
        }

        emit Action(
            msg.sender,
            hasRole(STAKEHOLDER_ROLE, msg.sender)
                ? STAKEHOLDER_ROLE
                : CONTRIBUTOR_ROLE,
            "CONTRIBUTION RECEIVED",
            address(this),
            msg.value
        );

        return daoBalance;
    }

    receive() external payable {
        contribute();
    }

    function createProposal(
        string calldata title,
        string calldata description,
        address beneficiary,
        uint256 amount
    )
        external
        stakeholderOnly("Only stakeholders can create proposals")
        returns (ProposalStruct memory)
    {
        require(bytes(title).length > 0, "Title is required");
        require(bytes(description).length > 0, "Description is required");
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= daoBalance, "Insufficient DAO balance");

        uint256 proposalId = totalProposals++;
        ProposalStruct storage proposal = raisedProposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.beneficiary = payable(beneficiary);
        proposal.amount = amount;
        proposal.duration = block.timestamp + VOTING_DURATION;

        emit Action(
            msg.sender,
            STAKEHOLDER_ROLE,
            "PROPOSAL RAISED",
            beneficiary,
            amount
        );

        return proposal;
    }

    function performVote(uint256 proposalId, bool choosen)
        external
        stakeholderOnly("Only stakeholders can vote")
        proposalExists(proposalId)
        returns (VotedStruct memory)
    {
        ProposalStruct storage proposal = raisedProposals[proposalId];
        require(block.timestamp < proposal.duration, "Voting period has ended");
        require(!proposal.paid, "Proposal already paid");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        hasVoted[proposalId][msg.sender] = true;
        if (choosen) {
            proposal.upvotes++;
        } else {
            proposal.downvotes++;
        }

        stakeholderVotes[msg.sender].push(proposalId);
        VotedStruct memory vote = VotedStruct(msg.sender, block.timestamp, choosen);
        votedOn[proposalId].push(vote);

        emit Action(
            msg.sender,
            STAKEHOLDER_ROLE,
            "PROPOSAL VOTE",
            proposal.beneficiary,
            proposal.amount
        );

        return vote;
    }

    function payBeneficiary(uint256 proposalId)
        external
        stakeholderOnly("Only stakeholders can execute")
        proposalExists(proposalId)
        nonReentrant
        returns (uint256)
    {
        ProposalStruct storage proposal = raisedProposals[proposalId];
        require(block.timestamp >= proposal.duration, "Voting period is still active");
        require(!proposal.paid, "Proposal already paid");
        require(proposal.upvotes > proposal.downvotes, "Proposal did not pass");
        require(proposal.amount <= daoBalance, "Insufficient DAO balance");

        // Checks-effects-interactions: finalize state before the external call.
        proposal.passed = true;
        proposal.paid = true;
        proposal.executor = msg.sender;
        daoBalance -= proposal.amount;

        (bool success, ) = proposal.beneficiary.call{value: proposal.amount}("");
        require(success, "Transfer failed");

        emit Action(
            msg.sender,
            STAKEHOLDER_ROLE,
            "PAYMENT TRANSFERED",
            proposal.beneficiary,
            proposal.amount
        );

        return daoBalance;
    }

    function getProposals() external view returns (ProposalStruct[] memory props) {
        props = new ProposalStruct[](totalProposals);
        for (uint256 i = 0; i < totalProposals; i++) {
            props[i] = _proposalView(i);
        }
    }

    function getProposal(uint256 proposalId)
        external
        view
        proposalExists(proposalId)
        returns (ProposalStruct memory)
    {
        return _proposalView(proposalId);
    }

    function _proposalView(uint256 proposalId)
        private
        view
        returns (ProposalStruct memory proposal)
    {
        proposal = raisedProposals[proposalId];
        if (
            !proposal.paid &&
            block.timestamp >= proposal.duration &&
            proposal.upvotes > proposal.downvotes
        ) {
            proposal.passed = true;
        }
    }

    function getVotesOf(uint256 proposalId)
        external
        view
        proposalExists(proposalId)
        returns (VotedStruct[] memory)
    {
        return votedOn[proposalId];
    }

    function getStakeholderVotes()
        external
        view
        stakeholderOnly("Unauthorized: not a stakeholder")
        returns (uint256[] memory)
    {
        return stakeholderVotes[msg.sender];
    }

    function getStakeholderBalance()
        external
        view
        stakeholderOnly("Unauthorized: not a stakeholder")
        returns (uint256)
    {
        return contributors[msg.sender];
    }

    function getContributorBalance() external view returns (uint256) {
        return contributors[msg.sender];
    }

    function isStakeholder() external view returns (bool) {
        return hasRole(STAKEHOLDER_ROLE, msg.sender);
    }

    function isContributor() external view returns (bool) {
        return hasRole(CONTRIBUTOR_ROLE, msg.sender);
    }

    function getBalance() external view returns (uint256) {
        return contributors[msg.sender];
    }
}

