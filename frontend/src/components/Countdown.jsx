import { useEffect, useRef, useState } from "react";
import { formatCountdown } from "../store";

const secondsLeft = (deadline) => Math.max(0, Number(deadline) - Math.floor(Date.now() / 1000));

const Countdown = ({ deadline, onExpire, className = "" }) => {
  const [remaining, setRemaining] = useState(() => secondsLeft(deadline));
  const expiredOnce = useRef(false);

  useEffect(() => {
    expiredOnce.current = false;
    setRemaining(secondsLeft(deadline));
    const timer = window.setInterval(() => {
      const next = secondsLeft(deadline);
      setRemaining(next);
      if (next === 0 && !expiredOnce.current) {
        expiredOnce.current = true;
        onExpire?.();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, onExpire]);

  return <span className={className}>{remaining === 0 ? "00:00" : formatCountdown(remaining)}</span>;
};

export default Countdown;

