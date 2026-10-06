import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCheck, FiExternalLink, FiX } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  getInfo,
  getProposal,
  getProposals,
  listVoters,
  payoutBeneficiary,
  voteOnProposal,
} from "../Blockchain.services";
import Countdown from "../components/Countdown";
import TransactionStatus from "../components/TransactionStatus";
import { proposalStatus } from "../components/ProposalList";
import { formatEth, truncate, useGlobalState } from "../store";

const Proposal = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [voters, setVoters] = useState([]);
  const [error, setError] = useState("");
  const [stakeholder] = useGlobalState("isStakeholder");
  const [account] = useGlobalState("connectedAccount");
  const [transaction] = useGlobalState("transaction");
  const [proof] = useGlobalState("beneficiaryProof");
  const busy = ["waiting", "pending"].includes(transaction.status);

  const load = useCallback(async () => {
    try {
      const [nextProposal, nextVoters] = await Promise.all([getProposal(id), listVoters(id)]);
      setProposal(nextProposal);
      setVoters(nextVoters);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(
    () => [{ name: "Votes", Accept: proposal?.upvotes || 0, Reject: proposal?.downvotes || 0 }],
    [proposal]
  );
  const alreadyVoted = voters.some((vote) => vote.voter.toLowerCase() === account?.toLowerCase());
  const status = proposal ? proposalStatus(proposal) : "";

  const refresh = async () => {
    await Promise.all([load(), getInfo(), getProposals()]);
  };

  const vote = async (supported) => {
    try {
      await voteOnProposal(id, supported);
      toast.success(supported ? "ACCEPT vote confirmed" : "REJECT vote confirmed");
      await refresh();
    } catch (voteError) {
      toast.error(voteError.message);
    }
  };

  const payout = async () => {
    try {
      const result = await payoutBeneficiary(id);
      toast.success(`Payout successful: ${result.amount} ETH sent to ${truncate(result.beneficiary)}`);
      await refresh();
    } catch (payoutError) {
      toast.error(payoutError.message);
    }
  };

  if (error) return <main className="mx-auto max-w-5xl px-4 py-12 text-red-300">{error}</main>;
  if (!proposal) return <main className="mx-auto max-w-5xl px-4 py-12 text-slate-400">Loading proposal from Sepolia...</main>;

  const open = status === "OPEN";
  const canVote = stakeholder && open && !alreadyVoted && !busy;
  const canPayout = stakeholder && status === "PASSED" && !busy;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white" to="/"><FiArrowLeft /> Back to proposals</Link>
      <div className="mt-6"><TransactionStatus /></div>
      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="eyebrow">Proposal #{proposal.id}</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">{proposal.title}</h1>
              <p className="mt-4 max-w-3xl leading-7 text-slate-400">{proposal.description}</p>
            </div>
            <div className="rounded-2xl border border-electric/20 bg-electric/5 px-5 py-4 text-right">
              <p className="text-xs uppercase tracking-widest text-slate-500">Requested</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatEth(proposal.amount)} ETH</p>
            </div>
          </div>
        </div>
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Status", status],
            ["Proposer", truncate(proposal.proposer)],
            ["Beneficiary", truncate(proposal.beneficiary)],
            ["Voting countdown", open ? <Countdown deadline={proposal.duration} onExpire={refresh} /> : "00:00"],
          ].map(([label, value]) => <div key={label} className="bg-panel p-5"><p className="text-[10px] uppercase tracking-widest text-slate-600">{label}</p><p className="mt-2 font-mono text-sm text-slate-200">{value}</p></div>)}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between"><div><p className="eyebrow">Vote distribution</p><h2 className="mt-2 text-xl font-semibold text-white">Stakeholder signal</h2></div><p className="text-sm text-slate-500">{proposal.upvotes + proposal.downvotes} total</p></div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#223149" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0d1a2b", border: "1px solid #223149", borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="Accept" fill="#40e0a1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Reject" fill="#fb7185" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="btn-accept" disabled={!canVote} onClick={() => vote(true)}><FiCheck /> ACCEPT</button>
            <button className="btn-reject" disabled={!canVote} onClick={() => vote(false)}><FiX /> REJECT</button>
          </div>
          {alreadyVoted ? <p className="mt-3 text-center text-xs text-slate-500">This wallet has already voted.</p> : null}
          {canPayout ? <button className="btn-primary mt-4 w-full justify-center" onClick={payout}>PAYOUT BENEFICIARY</button> : null}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-line p-6"><p className="eyebrow">Audit trail</p><h2 className="mt-2 text-xl font-semibold text-white">Voters</h2></div>
          <div className="max-h-[390px] divide-y divide-line overflow-y-auto">
            {voters.map((voter, index) => (
              <div key={`${voter.voter}-${index}`} className="flex items-center justify-between gap-4 p-4">
                <div><p className="font-mono text-sm text-slate-200">{truncate(voter.voter)}</p><p className="mt-1 text-xs text-slate-600">{new Date(Number(voter.timestamp) * 1000).toLocaleString()}</p></div>
                <span className={voter.choosen ? "badge-passed" : "badge-rejected"}>{voter.choosen ? "ACCEPT" : "REJECT"}</span>
              </div>
            ))}
            {!voters.length ? <p className="p-8 text-center text-sm text-slate-500">No votes recorded yet.</p> : null}
          </div>
        </section>
      </div>

      {proof && proof.beneficiary.toLowerCase() === proposal.beneficiary.toLowerCase() ? (
        <section className="card mt-6 border-mint/20 p-6">
          <div className="flex items-center gap-2 text-mint"><FiCheck /><h2 className="font-semibold">Payout successful</h2></div>
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-slate-600">Beneficiary</p><p className="mt-1 font-mono text-slate-200">{truncate(proof.beneficiary)}</p></div>
            <div><p className="text-slate-600">Before</p><p className="mt-1 text-slate-200">{formatEth(proof.before, 8)} ETH</p></div>
            <div><p className="text-slate-600">After</p><p className="mt-1 text-slate-200">{formatEth(proof.after, 8)} ETH</p></div>
            <div><p className="text-slate-600">Received</p><p className="mt-1 font-semibold text-mint">+{formatEth(proof.received, 8)} ETH</p></div>
          </div>
          <a className="mt-5 inline-flex items-center gap-2 text-sm text-electric hover:text-white" href={`https://sepolia.etherscan.io/tx/${proof.transactionHash}`} target="_blank" rel="noreferrer">View transaction on Etherscan <FiExternalLink /></a>
        </section>
      ) : null}
    </main>
  );
};

export default Proposal;

