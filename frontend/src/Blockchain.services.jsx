import Web3 from "web3";
import abi from "./abis/DominionDAO.json";
import { getGlobalState, setGlobalState } from "./store";

const SEPOLIA_CHAIN_ID = Number(process.env.REACT_APP_CHAIN_ID || 11155111);
const SEPOLIA_CHAIN_HEX = `0x${SEPOLIA_CHAIN_ID.toString(16)}`;
let web3Instance;

const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask to use DominionDAO");
  }
  return window.ethereum;
};

const getWeb3 = () => {
  if (!web3Instance) web3Instance = new Web3(getProvider());
  return web3Instance;
};

const normalizeChainId = (chainId) =>
  typeof chainId === "string" && chainId.startsWith("0x")
    ? parseInt(chainId, 16)
    : Number(chainId);

const isSepolia = () => Number(getGlobalState("chainId")) === SEPOLIA_CHAIN_ID;

const reportError = (error) => {
  const raw =
    error?.data?.message ||
    error?.error?.data?.message ||
    error?.error?.message ||
    error?.message ||
    String(error || "Unknown error");

  if (error?.code === 4001 || /user denied|user rejected/i.test(raw)) {
    return "User rejected transaction";
  }
  if (/insufficient funds/i.test(raw)) return "Insufficient funds for value and gas";
  if (/Only stakeholders|Unauthorized:.*stakeholder/i.test(raw)) return "Not stakeholder";
  if (/Voting period has ended|duration expired/i.test(raw)) return "Proposal expired";
  if (/Voting period is still active/i.test(raw)) return "Voting is still active";
  if (/Already voted|Double voting/i.test(raw)) return "Already voted";
  if (/Proposal did not pass|Insufficient votes/i.test(raw)) return "Proposal not passed";
  if (/Proposal already paid|Payment sent before/i.test(raw)) return "Proposal already paid";
  if (/Invalid beneficiary/i.test(raw)) return "Invalid beneficiary";
  if (/Insufficient DAO balance|Insufficient fund/i.test(raw)) return "DAO insufficient balance";
  if (/Proposal does not exist/i.test(raw)) return "Proposal does not exist";
  if (/network|chain/i.test(raw) && /wrong|switch|mismatch/i.test(raw)) return "Wrong network";

  const reverted = raw.match(/reverted with reason string ['"]([^'"]+)['"]/i);
  return reverted?.[1] || raw.replace(/^Returned error:\s*/i, "");
};

const setTransaction = (patch) => {
  setGlobalState("transaction", {
    ...getGlobalState("transaction"),
    ...patch,
  });
};

const sendTransaction = async (action, method, options) => {
  setTransaction({ action, status: "waiting", hash: "", message: "Waiting for MetaMask" });
  try {
    const pending = method.send(options);
    pending.once("transactionHash", (hash) => {
      setGlobalState("lastTransactionHash", hash);
      setTransaction({ status: "pending", hash, message: "Transaction pending" });
    });
    const receipt = await pending;
    setTransaction({
      status: "confirmed",
      hash: receipt.transactionHash,
      message: "Transaction confirmed",
    });
    return receipt;
  } catch (error) {
    const message = reportError(error);
    setTransaction({ status: "failed", message });
    throw new Error(message);
  }
};

const connectWallet = async () => {
  const provider = getProvider();
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const chainId = normalizeChainId(await provider.request({ method: "eth_chainId" }));
  setGlobalState("connectedAccount", (accounts[0] || "").toLowerCase());
  setGlobalState("chainId", chainId);
  setGlobalState("networkName", chainId === SEPOLIA_CHAIN_ID ? "Sepolia" : "Wrong network");
  return accounts[0] || "";
};

const isWalletConnected = async () => {
  const provider = getProvider();
  const [accounts, rawChainId] = await Promise.all([
    provider.request({ method: "eth_accounts" }),
    provider.request({ method: "eth_chainId" }),
  ]);
  const chainId = normalizeChainId(rawChainId);
  setGlobalState("connectedAccount", (accounts[0] || "").toLowerCase());
  setGlobalState("chainId", chainId);
  setGlobalState("networkName", chainId === SEPOLIA_CHAIN_ID ? "Sepolia" : "Wrong network");
  return accounts[0] || "";
};

// Backwards-compatible alias for the typo used in the lecturer's original sample.
const isWallectConnected = isWalletConnected;

const switchToSepolia = async () => {
  const provider = getProvider();
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
  } catch (error) {
    if (error.code !== 4902) throw new Error(reportError(error));
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SEPOLIA_CHAIN_HEX,
          chainName: "Ethereum Sepolia",
          nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://rpc.sepolia.org"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        },
      ],
    });
  }
};

const getEthereumContract = async () => {
  const address = process.env.REACT_APP_CONTRACT_ADDRESS;
  const web3 = getWeb3();
  if (!address || !web3.utils.isAddress(address)) {
    throw new Error("REACT_APP_CONTRACT_ADDRESS is missing or invalid");
  }
  if (!abi.abi?.length) {
    throw new Error("Contract ABI is missing. Run npm run compile at the project root");
  }
  const contract = new web3.eth.Contract(abi.abi, address);
  setGlobalState("contract", contract);
  return contract;
};

const getEtheriumContract = getEthereumContract;

const performContribute = async (amount) => {
  if (!isSepolia()) throw new Error("Wrong network");
  const web3 = getWeb3();
  const account = getGlobalState("connectedAccount");
  const contract = await getEthereumContract();
  const value = web3.utils.toWei(String(amount), "ether");
  return sendTransaction("contribute", contract.methods.contribute(), { from: account, value });
};

const getInfo = async () => {
  const web3 = getWeb3();
  const chainId = normalizeChainId(await getProvider().request({ method: "eth_chainId" }));
  const currentBlock = await web3.eth.getBlockNumber();
  setGlobalState("chainId", chainId);
  setGlobalState("networkName", chainId === SEPOLIA_CHAIN_ID ? "Sepolia" : "Wrong network");
  setGlobalState("currentBlock", String(currentBlock));

  if (chainId !== SEPOLIA_CHAIN_ID) {
    setGlobalState("balance", "0");
    setGlobalState("mybalance", "0");
    setGlobalState("isStakeholder", false);
    return;
  }

  const contract = await getEthereumContract();
  const account = getGlobalState("connectedAccount");
  const balance = await contract.methods.daoBalance().call();
  setGlobalState("balance", web3.utils.fromWei(balance, "ether"));

  if (!account) {
    setGlobalState("mybalance", "0");
    setGlobalState("isStakeholder", false);
    return;
  }

  const [stakeholder, personalBalance] = await Promise.all([
    contract.methods.isStakeholder().call({ from: account }),
    contract.methods.getBalance().call({ from: account }),
  ]);
  setGlobalState("mybalance", web3.utils.fromWei(personalBalance, "ether"));
  setGlobalState("isStakeholder", Boolean(stakeholder));
};

const raiseProposal = async ({ title, description, beneficiary, amount }) => {
  if (!isSepolia()) throw new Error("Wrong network");
  const web3 = getWeb3();
  const contract = await getEthereumContract();
  const account = getGlobalState("connectedAccount");
  const value = web3.utils.toWei(String(amount), "ether");
  return sendTransaction(
    "proposal",
    contract.methods.createProposal(title, description, beneficiary, value),
    { from: account }
  );
};

const structuredProposal = (proposal) => ({
  id: Number(proposal.id),
  amount: getWeb3().utils.fromWei(String(proposal.amount), "ether"),
  amountWei: String(proposal.amount),
  duration: Number(proposal.duration),
  upvotes: Number(proposal.upvotes),
  downvotes: Number(proposal.downvotes),
  title: proposal.title,
  description: proposal.description,
  passed: Boolean(proposal.passed),
  paid: Boolean(proposal.paid),
  beneficiary: proposal.beneficiary,
  proposer: proposal.proposer,
  executor: proposal.executor,
});

const getProposals = async () => {
  if (!isSepolia()) {
    setGlobalState("proposals", []);
    return [];
  }
  const contract = await getEthereumContract();
  const proposals = (await contract.methods.getProposals().call())
    .map(structuredProposal)
    .reverse();
  setGlobalState("proposals", proposals);
  return proposals;
};

const getProposal = async (id) => {
  const contract = await getEthereumContract();
  return structuredProposal(await contract.methods.getProposal(id).call());
};

const voteOnProposal = async (proposalId, supported) => {
  if (!isSepolia()) throw new Error("Wrong network");
  const contract = await getEthereumContract();
  const account = getGlobalState("connectedAccount");
  return sendTransaction(
    supported ? "vote-accept" : "vote-reject",
    contract.methods.performVote(proposalId, supported),
    { from: account }
  );
};

const listVoters = async (id) => {
  const contract = await getEthereumContract();
  return contract.methods.getVotesOf(id).call();
};

const payoutBeneficiary = async (id) => {
  if (!isSepolia()) throw new Error("Wrong network");
  const web3 = getWeb3();
  const contract = await getEthereumContract();
  const account = getGlobalState("connectedAccount");
  const proposal = await getProposal(id);
  const beforeWei = await web3.eth.getBalance(proposal.beneficiary);
  const receipt = await sendTransaction("payout", contract.methods.payBeneficiary(id), {
    from: account,
  });
  const afterWei = await web3.eth.getBalance(proposal.beneficiary);
  const receivedWei = web3.utils.toBN(afterWei).sub(web3.utils.toBN(beforeWei));
  const proof = {
    transactionHash: receipt.transactionHash,
    beneficiary: proposal.beneficiary,
    amount: proposal.amount,
    before: web3.utils.fromWei(beforeWei, "ether"),
    after: web3.utils.fromWei(afterWei, "ether"),
    received: web3.utils.fromWei(receivedWei, "ether"),
  };
  setGlobalState("beneficiaryProof", proof);
  return proof;
};

const subscribeWalletEvents = (onChange) => {
  const provider = getProvider();
  const handleAccounts = async (accounts) => {
    setGlobalState("connectedAccount", (accounts[0] || "").toLowerCase());
    await onChange();
  };
  const handleChain = async (rawChainId) => {
    const chainId = normalizeChainId(rawChainId);
    setGlobalState("chainId", chainId);
    setGlobalState("networkName", chainId === SEPOLIA_CHAIN_ID ? "Sepolia" : "Wrong network");
    await onChange();
  };
  provider.on("accountsChanged", handleAccounts);
  provider.on("chainChanged", handleChain);
  return () => {
    provider.removeListener("accountsChanged", handleAccounts);
    provider.removeListener("chainChanged", handleChain);
  };
};

export {
  SEPOLIA_CHAIN_ID,
  connectWallet,
  getEthereumContract,
  getEtheriumContract,
  getInfo,
  getProposal,
  getProposals,
  isWallectConnected,
  isWalletConnected,
  listVoters,
  payoutBeneficiary,
  performContribute,
  raiseProposal,
  reportError,
  subscribeWalletEvents,
  switchToSepolia,
  voteOnProposal,
};

