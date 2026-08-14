import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  text: z.string().min(1).max(6000),
  mode: z.enum(["hinglish", "hindi", "english"]).default("hinglish"),
});

const STYLE: Record<string, string> = {
  hinglish:
    "Bolo ek friendly Indian coding teacher ki tarah, natural Indian Hindi accent mein, medium-slow pace. Hindi words ko Indian Hindi pronunciation ke saath bolo aur DSA/technical terms English mein hi rakho. American ya British accent bilkul nahi. Sirf ye transcript bolo, kuch add ya translate na karo:",
  hindi:
    "एक मित्रवत भारतीय कंप्यूटर साइंस शिक्षक की तरह स्वाभाविक भारतीय हिंदी उच्चारण में, मध्यम-धीमी गति से बोलिए। DSA/तकनीकी शब्द अंग्रेज़ी में ही रखिए। नीचे दिया ट्रांसक्रिप्ट ही बोलिए, कुछ जोड़िए या बदलिए नहीं:",
  english:
    "Read this aloud as a friendly computer science teacher, clear and medium-slow. Speak only the transcript:",
};

export const Route = createFileRoute("/api/public/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("TTS is not configured", { status: 503 });
        }

        let parsed;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        const prompt = `${STYLE[parsed.mode]}\n\n${parsed.text}`;

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/audio/speech",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-tts",
              stream_format: "audio",
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    // Warm, natural voice that handles Hindi/Hinglish well.
                    prebuiltVoiceConfig: { voiceName: "Achernar" },
                  },
                  languageCode: parsed.mode === "english" ? "en-US" : "hi-IN",
                },
              },
            }),
          },
        );

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error(`TTS failed [${upstream.status}]: ${detail}`);
          return new Response(detail || "TTS failed", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "audio/wav",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
