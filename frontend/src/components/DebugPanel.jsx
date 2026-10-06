import { useState } from "react";
import { FiChevronDown, FiTerminal } from "react-icons/fi";
import { formatEth, truncate, useGlobalState } from "../store";

const DebugPanel = () => {
  const [open, setOpen] = useState(false);
  const [network] = useGlobalState("networkName");
  const [chainId] = useGlobalState("chainId");
  const [account] = useGlobalState("connectedAccount");
  const [balance] = useGlobalState("balance");
  const [mybalance] = useGlobalState("mybalance");
  const [stakeholder] = useGlobalState("isStakeholder");
  const [block] = useGlobalState("currentBlock");
  const contract = process.env.REACT_APP_CONTRACT_ADDRESS || "Not configured";

  const rows = [
    ["Network", network || "Unknown"],
    ["Chain ID", chainId || "-"],
    ["Contract", truncate(contract, 10, 6)],
    ["Connected wallet", account ? truncate(account, 10, 6) : "Not connected"],
    ["DAO balance", `${formatEth(balance)} ETH`],
    ["My contribution", `${formatEth(mybalance)} ETH`],
    ["Stakeholder", String(stakeholder)],
    ["Current block", block],
  ];

  return (
    <aside className="card mt-8 overflow-hidden">
      <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-300"><FiTerminal className="text-electric" /> Developer / Demo Info</span>
        <FiChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {rows.map(([label, value]) => (
            <div key={label} className="bg-panel p-4"><p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 break-all font-mono text-xs text-slate-300">{value}</p></div>
          ))}
        </div>
      ) : null}
    </aside>
  );
};

export default DebugPanel;

