function objectCandidates(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "{") continue;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') {
        inStr = true;
      } else if (c === "{") {
        depth++;
      } else if (c === "}") {
        depth--;
        if (depth === 0) {
          out.push(s.slice(i, j + 1));
          break;
        }
      }
    }
  }
  return out;
}

export default function parseJson(text) {
  const trimmed = String(text).trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  let best;
  for (const candidate of objectCandidates(trimmed)) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        if (!best || Object.keys(parsed).length > Object.keys(best).length) best = parsed;
      }
    } catch {}
  }

  if (best) return best;
  throw new Error("No JSON object found in text");
}
