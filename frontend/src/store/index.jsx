import { createGlobalState } from "react-hooks-global-state";

const initialTransaction = {
  action: "",
  status: "idle",
  hash: "",
  message: "",
};

const { setGlobalState, useGlobalState, getGlobalState } = createGlobalState({
  createModal: false,
  connectedAccount: "",
  contract: null,
  proposals: [],
  isStakeholder: false,
  balance: "0",
  mybalance: "0",
  chainId: "",
  networkName: "Unknown",
  currentBlock: "-",
  isLoading: true,
  transaction: initialTransaction,
  lastTransactionHash: "",
  beneficiaryProof: null,
  appError: "",
});

const truncate = (value = "", start = 6, end = 4) => {
  if (!value || value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const formatEth = (value, maximumFractionDigits = 5) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(number);
};

const formatCountdown = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export {
  formatCountdown,
  formatEth,
  getGlobalState,
  initialTransaction,
  setGlobalState,
  truncate,
  useGlobalState,
};

