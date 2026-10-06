import { FiCheckCircle, FiExternalLink, FiLoader, FiXCircle } from "react-icons/fi";
import { truncate, useGlobalState } from "../store";

const TransactionStatus = () => {
  const [transaction] = useGlobalState("transaction");
  if (!transaction || transaction.status === "idle") return null;

  const pending = transaction.status === "waiting" || transaction.status === "pending";
  const failed = transaction.status === "failed";
  const Icon = pending ? FiLoader : failed ? FiXCircle : FiCheckCircle;

  return (
    <div className={`card flex flex-col justify-between gap-3 p-4 text-sm sm:flex-row sm:items-center ${failed ? "!border-red-400/30" : ""}`}>
      <div className="flex items-center gap-3">
        <Icon className={`${pending ? "animate-spin text-electric" : failed ? "text-red-400" : "text-mint"}`} />
        <div>
          <p className="font-medium capitalize text-white">{transaction.action?.replace("-", " ")}</p>
          <p className="text-slate-400">{transaction.message}</p>
        </div>
      </div>
      {transaction.hash ? (
        <a
          className="inline-flex items-center gap-2 text-electric hover:text-white"
          href={`https://sepolia.etherscan.io/tx/${transaction.hash}`}
          target="_blank"
          rel="noreferrer"
        >
          {truncate(transaction.hash)} <FiExternalLink />
        </a>
      ) : null}
    </div>
  );
};

export default TransactionStatus;

