import { FiAlertTriangle } from "react-icons/fi";
import { toast } from "react-toastify";
import { switchToSepolia } from "../Blockchain.services";
import { useGlobalState } from "../store";

const NetworkNotice = ({ onRefresh }) => {
  const [chainId] = useGlobalState("chainId");
  if (!chainId || Number(chainId) === 11155111) return null;

  const switchNetwork = async () => {
    try {
      await switchToSepolia();
      await onRefresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="border-b border-amber-400/20 bg-amber-400/10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span className="flex items-center gap-2">
          <FiAlertTriangle className="text-amber-300" /> Please switch to Ethereum Sepolia (Chain ID 11155111).
        </span>
        <button className="btn-secondary !border-amber-300/30 !text-amber-100" onClick={switchNetwork}>
          Switch to Sepolia
        </button>
      </div>
    </div>
  );
};

export default NetworkNotice;
