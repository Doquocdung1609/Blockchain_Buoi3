import { FiActivity, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { connectWallet, switchToSepolia } from "../Blockchain.services";
import { truncate, useGlobalState } from "../store";

const Header = ({ onRefresh }) => {
  const [account] = useGlobalState("connectedAccount");
  const [chainId] = useGlobalState("chainId");
  const [networkName] = useGlobalState("networkName");
  const correctNetwork = Number(chainId) === 11155111;

  const connect = async () => {
    try {
      await connectWallet();
      await onRefresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const switchNetwork = async () => {
    try {
      await switchToSepolia();
      await onRefresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric shadow-glow">
            <span className="text-lg font-black">D</span>
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mint ring-2 ring-ink" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-white">DOMINION</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">DAO Protocol</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold sm:flex ${
              correctNetwork
                ? "border-mint/30 bg-mint/10 text-mint"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
            }`}
          >
            <FiActivity />
            {networkName || "Detecting network"}
          </div>
          {!correctNetwork && chainId ? (
            <button className="btn-secondary" onClick={switchNetwork}>
              Switch to Sepolia
            </button>
          ) : account ? (
            <div className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-sm text-slate-200">
              <span className="h-2 w-2 rounded-full bg-mint" />
              <span>{truncate(account)}</span>
            </div>
          ) : (
            <button className="btn-primary" onClick={connect}>
              <span className="hidden sm:inline">Connect wallet</span>
              <span className="sm:hidden">Connect</span>
              <FiChevronRight />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
