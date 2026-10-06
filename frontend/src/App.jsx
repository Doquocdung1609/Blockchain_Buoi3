import { useCallback, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getInfo, getProposals, isWalletConnected, subscribeWalletEvents } from "./Blockchain.services";
import Header from "./components/Header";
import NetworkNotice from "./components/NetworkNotice";
import { setGlobalState, useGlobalState } from "./store";
import Home from "./views/Home";
import Proposal from "./views/Proposal";

const App = () => {
  const [loading] = useGlobalState("isLoading");
  const [appError] = useGlobalState("appError");

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setGlobalState("isLoading", true);
    try {
      await Promise.all([getInfo(), getProposals()]);
      setGlobalState("appError", "");
    } catch (error) {
      setGlobalState("appError", error.message);
      if (!silent) toast.error(error.message);
    } finally {
      setGlobalState("isLoading", false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    const initialize = async () => {
      try {
        await isWalletConnected();
        await refresh();
        unsubscribe = subscribeWalletEvents(() => refresh({ silent: true }));
      } catch (error) {
        setGlobalState("appError", error.message);
        setGlobalState("isLoading", false);
      }
    };
    initialize();
    const poll = window.setInterval(() => refresh({ silent: true }), 15000);
    return () => {
      unsubscribe?.();
      window.clearInterval(poll);
    };
  }, [refresh]);

  return (
    <div className="min-h-screen bg-ink text-slate-200">
      <Header onRefresh={refresh} />
      <NetworkNotice onRefresh={refresh} />
      {appError ? (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{appError}</div>
        </div>
      ) : null}
      {loading ? (
        <div className="grid min-h-[55vh] place-items-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-electric" /><p className="mt-4 text-sm text-slate-500">Reading Sepolia state...</p></div></div>
      ) : (
        <Routes>
          <Route path="/" element={<Home onRefresh={refresh} />} />
          <Route path="/proposal/:id" element={<Proposal />} />
        </Routes>
      )}
      <footer className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-2 border-t border-line px-4 py-8 text-xs text-slate-600 sm:flex-row sm:px-6 lg:px-8"><span>DominionDAO · PTIT Blockchain Practical</span><span>Sepolia testnet only · Never share your seed phrase</span></footer>
      <ToastContainer theme="dark" position="top-right" autoClose={5000} newestOnTop closeOnClick pauseOnHover />
    </div>
  );
};

export default App;

