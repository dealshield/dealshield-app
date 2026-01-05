const https = require('https');

// Use the correct mainnet RPC URL with the API key
const url = "https://mainnet.helius-rpc.com/?api-key=63cc80c1-dd13-4871-92a7-fda1c365d3b1";

// 1. Test Basic Connectivity (getBlockHeight)
const testConnection = () => {
    console.log("Testing Connection...");
    const data = JSON.stringify({
        jsonrpc: "2.0",
        id: "test-conn",
        method: "getBlockHeight",
        params: []
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Connection Test Response:", body);
            testPriceFetch();
        });
    });

    req.on('error', (e) => console.error("Connection Error:", e));
    req.write(data);
    req.end();
};

// 2. Test Price Fetch (getAccountInfo for Pyth Feed)
const testPriceFetch = () => {
    console.log("\nTesting Price Fetch (Pyth V2 Account)...");
    const data = JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-price",
        method: "getAccountInfo",
        params: [
            "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenGWNSwJ4HoJw", 
            { encoding: "base64" }
        ]
    });

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };

    const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Price Fetch Raw Body:", body.substring(0, 200) + "..."); 
            try {
                const json = JSON.parse(body);
                if (json.result && json.result.value) {
                    console.log("Account Data Found!");
                } else {
                    console.log("No account data found (Result is null).");
                }
            } catch (e) { console.error("Parse Error:", e); }
            testJupiter();
        });
    });

    req.on('error', (e) => console.error("Price Fetch Error:", e));
    req.write(data);
    req.end();
};

// 3. Test Jupiter API
const testJupiter = () => {
    console.log("\nTesting Jupiter API...");
    const jupUrl = "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112";
    
    https.get(jupUrl, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Jupiter Response:", body.substring(0, 200) + "...");
            testCoinGecko();
        });
    }).on('error', (e) => {
        console.error("Jupiter Error:", e.message);
        testCoinGecko();
    });
};

// 4. Test CoinGecko API
const testCoinGecko = () => {
    console.log("\nTesting CoinGecko API...");
    const cgUrl = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
    const options = { headers: { 'User-Agent': 'Mozilla/5.0' } };

    https.get(cgUrl, options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("CoinGecko Response:", body);
            testHeliusDAS();
        });
    }).on('error', (e) => {
        console.error("CoinGecko Error:", e.message);
        testHeliusDAS();
    });
};

// 5. Test Helius DAS API (getAsset)
const testHeliusDAS = () => {
    console.log("\nTesting Helius DAS API (getAsset)...");
    const data = JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-das",
        method: "getAsset",
        params: {
            id: "So11111111111111111111111111111111111111112"
        }
    });

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };

    const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log("Helius DAS Response:", body.substring(0, 500) + "...");
            try {
                const json = JSON.parse(body);
                if (json.result && json.result.token_info) {
                   console.log("Token Info Found.");
                   if (json.result.token_info.price_info) {
                       console.log("Price Info Found:", json.result.token_info.price_info);
                   } else {
                       console.log("No price_info in token_info.");
                   }
                } else {
                    console.log("No token_info found or error.");
                }
            } catch (e) { console.error(e); }
        });
    });

    req.on('error', (e) => console.error("Helius DAS Error:", e));
    req.write(data);
    req.end();
};

// Start
testConnection();
