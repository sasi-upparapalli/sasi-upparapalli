// computeTimeStats.js
import fs from "fs";
import fetch from "node-fetch";

const token = process.env.GITHUB_TOKEN;
const username = "sasi-upparapalli";

async function fetchCommits(page = 1, entries = []) {
  const resp = await fetch(
    `https://api.github.com/users/${username}/events/public?page=${page}`,
    { headers: { Authorization: `token ${token}` } }
  );
  const events = await resp.json();
  if (!events.length) return entries;
  return fetchCommits(page + 1, entries.concat(events));
}

function timeLabel(dt) {
  const h = new Date(dt).getUTCHours() + 5.5; // IST offset
  if (h < 12) return "morning";
  if (h < 17) return "daytime";
  if (h < 21) return "evening";
  return "night";
}

function bar(count, total) {
  const maxBar = 20;
  const len = Math.round((count / total) * maxBar);
  return "█".repeat(len) + "░".repeat(maxBar - len);
}

(async () => {
  const events = await fetchCommits();
  const counts = { morning: 0, daytime: 0, evening: 0, night: 0 };
  events.forEach(e => {
    if (e.type === "PushEvent") {
      const label = timeLabel(e.created_at);
      counts[label]++;
    }
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  const lines = [
    `🌞 Morning   ${counts.morning} commits   ${bar(counts.morning, total)}   ${((counts.morning/total)*100).toFixed(2)}%`,
    `🌆 Daytime   ${counts.daytime} commits   ${bar(counts.daytime, total)}   ${((counts.daytime/total)*100).toFixed(2)}%`,
    `🌃 Evening   ${counts.evening} commits   ${bar(counts.evening, total)}   ${((counts.evening/total)*100).toFixed(2)}%`,
    `🌙 Night     ${counts.night} commits   ${bar(counts.night, total)}   ${((counts.night/total)*100).toFixed(2)}%`,
  ];

  const content = [
    "### ⏱️ Commit Activity by Time of Day (sasi‑upparapalli)",
    "```text",
    ...lines,
    "```",
  ].join("\n");

  const readme = fs.readFileSync("README.md", "utf8");
  const newReadme = readme.replace(/### ⏱️[\s\S]*?```/, content);
  fs.writeFileSync("README.md", newReadme);
})();
