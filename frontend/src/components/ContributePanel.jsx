import { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { toast } from "react-toastify";
import { performContribute } from "../Blockchain.services";
import { useGlobalState } from "../store";

const ContributePanel = ({ onRefresh }) => {
  const [amount, setAmount] = useState("");
  const [account] = useGlobalState("connectedAccount");
  const [chainId] = useGlobalState("chainId");
  const [transaction] = useGlobalState("transaction");
  const busy = ["waiting", "pending"].includes(transaction.status);
  const enabled = Boolean(account) && Number(chainId) === 11155111 && !busy;

  const contribute = async (event) => {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("Enter an amount greater than 0");
    try {
      const receipt = await performContribute(amount);
      toast.success(`Contribution confirmed: ${receipt.transactionHash.slice(0, 10)}...`);
      setAmount("");
      await onRefresh({ silent: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Treasury access</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Contribute to the DAO</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Contributions are recorded on Sepolia. Your cumulative total must reach 0.01 ETH to unlock stakeholder actions.
          </p>
        </div>
        <FiArrowUpRight className="mt-1 text-2xl text-electric" />
      </div>
      <form className="mt-6" onSubmit={contribute}>
        <label className="label" htmlFor="contribution">ETH amount</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              id="contribution"
              className="input pr-16"
              type="number"
              min="0"
              step="0.001"
              placeholder="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">ETH</span>
          </div>
          <button className="btn-primary justify-center sm:min-w-[150px]" disabled={!enabled} type="submit">
            {busy ? "Pending..." : "Contribute"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["0.01", "0.02", "0.05"].map((value) => (
            <button key={value} className="chip" type="button" onClick={() => setAmount(value)}>
              {value} ETH
            </button>
          ))}
        </div>
      </form>
    </section>
  );
};

export default ContributePanel;

