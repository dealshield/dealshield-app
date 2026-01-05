import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64 } = body as { imageBase64: string };
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Use the specific version 001 as the alias might be unstable or not found in some regions/keys
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;
    // Updated prompt to be even more explicit and ask for a strict classification
    const prompt =
      "Strictly analyze this image for prohibited content. Return a raw JSON object (no markdown) with keys: 'weapons' (guns, knives, firearms), 'nudity' (nsfw, exposed skin), 'violence' (fighting, injury), 'blood' (gore). Values must be booleans: true if ANY trace is present, false otherwise. Example: {\"weapons\": false, \"nudity\": false, \"violence\": false, \"blood\": false}";

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    };

    console.log("Sending request to Gemini...");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API error:", res.status, errorText);
      // Try fallback model if the first one fails with 404 (Not Found)
      if (res.status === 404) {
          console.log("Model not found, trying fallback to gemini-1.5-pro...");
          const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
          const res2 = await fetch(fallbackEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
          });
          
          if (res2.ok) {
              const data2 = await res2.json();
              // Process response similar to main flow
              let text = data2?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              console.log("Gemini Fallback Response:", text);
              text = text.replace(/```json/g, "").replace(/```/g, "").trim();
              let parsed = { weapons: false, nudity: false, violence: false, blood: false };
              try {
                  parsed = JSON.parse(text);
                  return NextResponse.json({ result: parsed });
              } catch (e) {
                  console.error("Failed to parse Gemini fallback response", e);
              }
          } else {
             console.error("Fallback failed too:", await res2.text());
          }
      }
      return NextResponse.json({ error: "API error: " + res.status + " " + errorText }, { status: 502 });
    }

    const data = await res.json();
    let text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.raw_text ??
      "";
    
    console.log("Gemini Raw Response:", text);

    // Clean markdown code blocks if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed = { weapons: false, nudity: false, violence: false, blood: false };
    try {
      parsed = JSON.parse(text);
      console.log("Parsed JSON:", parsed);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text, e);
      // Fallback: simple text search if JSON parsing fails
      const lowerText = text.toLowerCase();
      if (lowerText.includes("true")) {
          if (lowerText.includes("weapon")) parsed.weapons = true;
          if (lowerText.includes("nudity") || lowerText.includes("nude")) parsed.nudity = true;
          if (lowerText.includes("violence")) parsed.violence = true;
          if (lowerText.includes("blood")) parsed.blood = true;
      }
    }

    return NextResponse.json({ result: parsed });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
