import ContributePanel from "../components/ContributePanel";
import CreateProposal from "../components/CreateProposal";
import Dashboard from "../components/Dashboard";
import DebugPanel from "../components/DebugPanel";
import ProposalList from "../components/ProposalList";
import TransactionStatus from "../components/TransactionStatus";

const Home = ({ onRefresh }) => (
  <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <section className="mb-8 max-w-3xl">
      <p className="eyebrow">Ethereum Sepolia · live contract data</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Community capital,<br /><span className="text-gradient">governed on-chain.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
        Contribute, become a stakeholder, vote and execute approved payouts through one shared DominionDAO contract.
      </p>
    </section>
    <div className="space-y-6">
      <TransactionStatus />
      <Dashboard />
      <ContributePanel onRefresh={onRefresh} />
    </div>
    <ProposalList onRefresh={onRefresh} />
    <DebugPanel />
    <CreateProposal onRefresh={onRefresh} />
  </main>
);

export default Home;

