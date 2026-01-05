import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useRef, useState } from "react";

export function useUserBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const subscriptionIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!connection || !publicKey) {
      setBalance(null);
      if (subscriptionIdRef.current !== null) {
        connection?.removeAccountChangeListener(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        // Try balance with safety timeout
        const bal = await Promise.race([
          connection.getBalance(publicKey),
          new Promise<number>((_, reject) =>
            setTimeout(() => reject(new Error("RPC timeout")), 5000)
          ),
        ]) as number;
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (e) {
        console.error("Error fetching balance:", e);
        setBalance(null);
        // Avoid subscribing when RPC is down
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Subscribe to account changes for live updates
    try {
      const subId = connection.onAccountChange(
        publicKey,
        (updatedAccountInfo) => {
          setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
        },
        "confirmed"
      );
      subscriptionIdRef.current = subId;
    } catch (e) {
      console.warn("Account subscription failed:", e);
    }

    return () => {
      if (subscriptionIdRef.current !== null) {
        connection.removeAccountChangeListener(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, [connection, publicKey]);

  return { balance, loading };
}
