import { useMemo, useState } from "react";
import { FiArrowRight, FiPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import Countdown from "./Countdown";
import { formatEth, setGlobalState, truncate, useGlobalState } from "../store";

const proposalStatus = (proposal) => {
  if (proposal.paid) return "PAID";
  if (Date.now() / 1000 < proposal.duration) return "OPEN";
  return proposal.upvotes > proposal.downvotes ? "PASSED" : "REJECTED";
};

const statusStyle = {
  OPEN: "badge-open",
  PASSED: "badge-passed",
  REJECTED: "badge-rejected",
  PAID: "badge-paid",
};

const ProposalList = ({ onRefresh }) => {
  const [proposals] = useGlobalState("proposals");
  const [stakeholder] = useGlobalState("isStakeholder");
  const [filter, setFilter] = useState("ALL");
  const visible = useMemo(
    () => proposals.filter((proposal) => filter === "ALL" || proposalStatus(proposal) === filter),
    [filter, proposals]
  );

  return (
    <section className="mt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Governance queue</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Proposals</h2>
        </div>
        {stakeholder ? (
          <button className="btn-primary" onClick={() => setGlobalState("createModal", true)}>
            <FiPlus /> New proposal
          </button>
        ) : (
          <p className="text-sm text-slate-500">Contribute 0.01 ETH to create proposals.</p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["ALL", "OPEN", "PASSED", "REJECTED", "PAID"].map((item) => (
          <button key={item} className={filter === item ? "filter-active" : "filter"} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {visible.map((proposal) => {
          const status = proposalStatus(proposal);
          return (
            <article key={proposal.id} className="card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-500">PROPOSAL #{proposal.id}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{proposal.title}</h3>
                </div>
                <span className={statusStyle[status]}>{status}</span>
              </div>
              <p className="mt-3 line-clamp-2 min-h-[3rem] text-sm leading-6 text-slate-400">{proposal.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-4 border-y border-line/70 py-4 text-sm">
                <div><p className="text-xs uppercase tracking-wider text-slate-600">Amount</p><p className="mt-1 font-semibold text-white">{formatEth(proposal.amount)} ETH</p></div>
                <div><p className="text-xs uppercase tracking-wider text-slate-600">Beneficiary</p><p className="mt-1 font-mono text-slate-300">{truncate(proposal.beneficiary)}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-slate-600">Votes</p><p className="mt-1"><span className="text-mint">{proposal.upvotes} accept</span> <span className="text-slate-600">/</span> <span className="text-red-400">{proposal.downvotes} reject</span></p></div>
                <div><p className="text-xs uppercase tracking-wider text-slate-600">Time remaining</p><p className="mt-1 font-mono text-electric">{status === "OPEN" ? <Countdown deadline={proposal.duration} onExpire={() => onRefresh({ silent: true })} /> : "00:00"}</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-600">by {truncate(proposal.proposer)}</span>
                <Link className="inline-flex items-center gap-2 text-sm font-semibold text-electric hover:text-white" to={`/proposal/${proposal.id}`}>
                  View details <FiArrowRight />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length ? <div className="card mt-5 p-10 text-center text-sm text-slate-500">No proposals match this filter.</div> : null}
    </section>
  );
};

export { proposalStatus };
export default ProposalList;

