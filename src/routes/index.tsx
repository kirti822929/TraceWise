import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { TRACEWISE_SHELL } from "@/tracewise/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TraceWise — AI DSA Video Explainer with Hinglish Voice" },
      {
        name: "description",
        content:
          "Paste any DSA problem and get an animated video walkthrough with dry run, code and narration in Indian Hinglish, Hindi or English.",
      },
      { property: "og:title", content: "TraceWise — AI DSA Video Explainer" },
      {
        property: "og:description",
        content:
          "Animated DSA solutions with Indian-accent Hinglish narration, dry runs and code explanations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: "/tracewise/styles.css" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: TraceWisePage,
});

const SCRIPTS = [
  "/tracewise/animations.js",
  "/tracewise/narrator.js",
  "/tracewise/player.js",
  "/tracewise/app.js",
];

function TraceWisePage() {
  useEffect(() => {
    const stored = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", stored);

    let cancelled = false;

    const load = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          `script[data-tracewise="${src}"]`,
        );
        if (existing) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.dataset.tracewise = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });

    (async () => {
      for (const src of SCRIPTS) {
        if (cancelled) return;
        await load(src);
      }
    })().catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      id="tracewise-root"
      dangerouslySetInnerHTML={{ __html: TRACEWISE_SHELL }}
    />
  );
}
