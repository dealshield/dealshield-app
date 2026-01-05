export const getSolPrice = async (): Promise<number | null> => {
  // 1. Try Helius DAS API (getAsset for SOL Mint) - Primary & Reliable
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (rpcUrl) {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "helius-das-price",
          method: "getAsset",
          params: {
            id: "So11111111111111111111111111111111111111112", // SOL Mint Address
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        // Helius DAS API returns price info in token_info
        const price = json.result?.token_info?.price_info?.price_per_token;
        if (price) {
          return price;
        }
      }
    }
  } catch (err) {
    console.warn("Helius DAS price fetch failed, trying fallback...", err);
  }

  // 2. Try Jupiter API (very reliable for Solana)
  try {
    const res = await fetch(
      "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112"
    );
    if (res.ok) {
      const data = await res.json();
      const price = data?.data?.["So11111111111111111111111111111111111111112"]?.price;
      if (price) return parseFloat(price);
    }
  } catch (err) {
    console.warn("Jupiter API failed, trying fallback...", err);
  }

  // 3. Try CoinGecko (fallback)
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    if (res.ok) {
      const data = await res.json();
      if (data.solana?.usd) return data.solana.usd;
    }
  } catch (err) {
    console.warn("CoinGecko API failed, trying fallback...", err);
  }

  // 4. Try Binance API (last resort)
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT"
    );
    if (res.ok) {
      const data = await res.json();
      if (data.price) return parseFloat(data.price);
    }
  } catch (err) {
    console.warn("Binance API failed.", err);
  }

  // 5. Return null if all fail
  return null;
};
