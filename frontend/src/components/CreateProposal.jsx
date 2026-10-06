import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import Web3 from "web3";
import { raiseProposal } from "../Blockchain.services";
import { setGlobalState, useGlobalState } from "../store";

const emptyForm = { title: "", description: "", beneficiary: "", amount: "" };

const CreateProposal = ({ onRefresh }) => {
  const [open] = useGlobalState("createModal");
  const [balance] = useGlobalState("balance");
  const [transaction] = useGlobalState("transaction");
  const [form, setForm] = useState(emptyForm);
  const busy = ["waiting", "pending"].includes(transaction.status);

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  if (!open) return null;
  const close = () => !busy && setGlobalState("createModal", false);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title) return toast.error("Title is required");
    if (!description) return toast.error("Description is required");
    if (!Web3.utils.isAddress(form.beneficiary) || /^0x0{40}$/i.test(form.beneficiary)) {
      return toast.error("Invalid beneficiary address");
    }
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Amount must be greater than 0");
    if (Number(form.amount) > Number(balance)) return toast.error("Amount exceeds DAO balance");

    try {
      await raiseProposal({ ...form, title, description });
      toast.success("Proposal created on Sepolia");
      setGlobalState("createModal", false);
      await onRefresh({ silent: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form className="card my-8 w-full max-w-xl p-6 sm:p-8" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">On-chain action</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create proposal</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} aria-label="Close proposal form"><FiX /></button>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="proposal-title">Title</label>
            <input id="proposal-title" className="input mt-2" value={form.title} onChange={update("title")} placeholder="Payment for the demo team" />
          </div>
          <div>
            <label className="label" htmlFor="proposal-description">Description</label>
            <textarea id="proposal-description" className="input mt-2 min-h-[110px] resize-y" value={form.description} onChange={update("description")} placeholder="Explain why this payout should be approved" />
          </div>
          <div>
            <label className="label" htmlFor="proposal-beneficiary">Beneficiary</label>
            <input id="proposal-beneficiary" className="input mt-2 font-mono text-sm" value={form.beneficiary} onChange={update("beneficiary")} placeholder="0x..." />
          </div>
          <div>
            <label className="label" htmlFor="proposal-amount">Amount (ETH)</label>
            <input id="proposal-amount" className="input mt-2" type="number" min="0" step="0.001" value={form.amount} onChange={update("amount")} placeholder="0.005" />
            <p className="mt-2 text-xs text-slate-500">Available treasury: {balance} ETH</p>
          </div>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <button className="btn-secondary" type="button" onClick={close}>Cancel</button>
          <button className="btn-primary" type="submit" disabled={busy}>{busy ? "Pending..." : "Create proposal"}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateProposal;

