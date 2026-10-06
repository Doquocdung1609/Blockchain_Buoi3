import { FiBox, FiClock, FiDatabase, FiUserCheck } from "react-icons/fi";
import { formatEth, useGlobalState } from "../store";

const Dashboard = () => {
  const [balance] = useGlobalState("balance");
  const [mybalance] = useGlobalState("mybalance");
  const [stakeholder] = useGlobalState("isStakeholder");
  const [proposals] = useGlobalState("proposals");
  const open = proposals.filter((proposal) => Date.now() / 1000 < proposal.duration && !proposal.paid).length;

  const cards = [
    { label: "DAO Balance", value: `${formatEth(balance)} ETH`, icon: FiDatabase, accent: "text-electric" },
    { label: "My Contribution", value: `${formatEth(mybalance)} ETH`, icon: FiBox, accent: "text-violet" },
    { label: "My Role", value: stakeholder ? "Stakeholder" : "Contributor / Guest", icon: FiUserCheck, accent: "text-mint" },
    { label: "Open Proposals", value: String(open), icon: FiClock, accent: "text-amber-300" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, accent }) => (
        <article key={label} className="card group relative overflow-hidden p-5">
          <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-electric/5 blur-2xl transition group-hover:bg-electric/10" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <Icon className={accent} />
          </div>
          <p className="mt-4 text-xl font-semibold text-white">{value}</p>
        </article>
      ))}
    </section>
  );
};

export default Dashboard;

