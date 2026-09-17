import React, { useState, useMemo } from "react";

/* NorthGuard — interactive demo v3
   Nordic Clarity: navy-900 #0B1220, teal-400 #3FBFB0, amber-400 #F5A623
   Two views of the same policy: Areas (treemap, plain-language, for the demo)
   and Map (graph, for people who want the relationships).
*/

const NAVY = "#0B1220";
const NAVY_2 = "#141d2e";
const NAVY_3 = "#1e2a3f";
const TEAL = "#3FBFB0";
const AMBER = "#F5A623";
const INK = "#e8edf4";
const MUTE = "#8a97ab";
const RED = "#e5657a";

const SAMPLE_POLICY = `Company IP Protection Policy

1. Proprietary source code and internal repository names must never be shared with external tools.
2. Customer personal data (names, emails, contract numbers) is confidential.
3. Unreleased pricing, discount structures, and margin figures are restricted.
4. Supplier identities and negotiated terms are protected.
5. Internal project codenames are not to be disclosed.`;

const SAMPLE_PROMPTS = [
  "Refactor this function for readability: function calc(x){return x*1.19}",
  "Draft an email to customer Anna Berger about her contract CN-48213 renewal.",
  "What discount can we offer on the Q3 pricing tier to beat our margin target of 34%?",
];

const SEED = [
  "Why does our CI pipeline time out on the integration suite every Friday?",
  "Draft a reply to customer M. Hoffmann about invoice CN-77210 being late.",
  "How do I write an ASPICE-compliant change request description?",
  "Our build keeps failing after the dependency upgrade — how do I roll back safely?",
  "What margin do we need on the supplier contract to stay above target?",
  "Explain the difference between ISO 26262 ASIL B and ASIL D in simple terms.",
  "Summarise this supplier email from Brechtmann GmbH about their delivery terms.",
  "Our test coverage report is broken, how do I debug the coverage tooling?",
  "Write release notes for the internal repo shiftnorth-core v2.3.",
  "How do I document a requirement change so it passes the audit?",
  "Customer Anna Berger asked about her contract CN-48213 — draft a response.",
  "The regression suite is flaky, what's the standard approach to stabilise it?",
  "What discount structure did we agree for the Q3 tier?",
  "How do I set up traceability from requirement to test case?",
];

const RULES = [
  { id: "email", label: "email address", re: /[\w.+-]+@[\w-]+\.[\w.]+/gi },
  { id: "contract", label: "contract number", re: /\b(?:CN|CT|VN)-\d{3,}\b/gi },
  { id: "margin", label: "margin / percentage figure", re: /\b\d{1,3}(?:[.,]\d+)?\s?%/g },
  { id: "repo", label: "internal repository name", re: /\b[a-z0-9]+-(?:core|internal|prod|api|svc)\b/gi },
];

function runRules(text) {
  const hits = [];
  RULES.forEach((r) => {
    const m = text.match(r.re);
    if (m) hits.push({ rule: r.id, label: r.label, spans: [...new Set(m)] });
  });
  return hits;
}

function matchNodes(text, graph) {
  if (!graph) return [];
  const t = text.toLowerCase();
  return graph.nodes
    .filter((n) =>
      n.label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 4).some((w) => t.includes(w))
    )
    .map((n) => n.id);
}

async function callClaude(messages, system, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
const stripFences = (t) => t.replace(/```json/gi, "").replace(/```/g, "").trim();

export default function NorthGuardDemo() {
  const [tab, setTab] = useState("gateway");
  const [view, setView] = useState("areas"); // areas | map
  const [policy, setPolicy] = useState(SAMPLE_POLICY);
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[1]);
  const [graph, setGraph] = useState(null);
  const [building, setBuilding] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [verdict, setVerdict] = useState(null);
  const [reply, setReply] = useState("");
  const [mode, setMode] = useState("redact");
  const [log, setLog] = useState([]);
  const [err, setErr] = useState("");
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  async function buildGraph() {
    setBuilding(true); setErr(""); setGraph(null); setVerdict(null); setReply(""); setPhase("idle");
    try {
      const sys =
        "Extract a protection graph from a company data policy. Return ONLY JSON, no prose or fences. " +
        'Schema: {"nodes":[{"id":"slug","label":"Human Label","kind":"code|pii|pricing|supplier|codename|other"}],' +
        '"edges":[{"from":"slug","to":"slug"}]}. 6-9 nodes, slugs lowercase-hyphenated, labels under 22 chars.';
      const out = await callClaude([{ role: "user", content: `Policy:\n${policy}` }], sys, 900);
      setGraph(JSON.parse(stripFences(out)));
    } catch {
      setErr("Couldn't map that policy. Try simplifying it, then rebuild.");
    } finally { setBuilding(false); }
  }

  async function inspect() {
    if (!graph) { setErr("Map the policy first, so there's something to check against."); return; }
    setErr(""); setVerdict(null); setReply(""); setPhase("scanning");
    const ruleHits = runRules(prompt);
    try {
      const nodeList = graph.nodes.map((n) => `${n.id} (${n.label})`).join(", ");
      const sys =
        "You are a policy inspection engine. Decide which protected nodes a prompt touches and whether it violates policy. " +
        "Return ONLY JSON, no fences: " +
        '{"touched":["node_id"],"violation":true|false,"reason":"one sentence","redacted":"prompt with sensitive spans replaced by [REDACTED]","topic":"2-4 word work topic"}. ' +
        `Protected nodes: ${nodeList}.`;
      const out = await callClaude([{ role: "user", content: `Prompt:\n${prompt}` }], sys, 800);
      const v = JSON.parse(stripFences(out));
      v.ruleHits = ruleHits;
      v.caughtBy = ruleHits.length ? (v.violation ? "rules + LLM" : "rules") : v.violation ? "LLM backstop" : null;
      setVerdict(v); setPhase("done");
      setLog((l) => [{ t: Date.now(), prompt, topic: v.topic || "general", touched: v.touched || [],
        violation: v.violation, mode, sample: false }, ...l]);

      if (v.violation && mode === "block") setReply("");
      else {
        const ans = await callClaude([{ role: "user", content: v.violation ? v.redacted : prompt }],
          "You are a helpful assistant. Answer concisely.", 700);
        setReply(ans);
      }
    } catch {
      setErr("Inspection hiccup — try again."); setPhase("idle");
    }
  }

  function seedWeek() {
    const now = Date.now();
    setLog((l) => [...l, ...SEED.map((p, i) => {
      const touched = matchNodes(p, graph);
      return { t: now - (i + 1) * 3.4e6, prompt: p, topic: "", touched,
        violation: touched.length > 0 || runRules(p).length > 0, mode: "redact", sample: true };
    })]);
  }

  async function generateBriefing() {
    setBriefingLoading(true);
    try {
      const corpus = log.map((l) => `- ${l.prompt}`).join("\n");
      const sys =
        "You analyse a week of employee AI prompts for a management briefing. Return ONLY JSON, no fences: " +
        '{"themes":[{"name":"3-5 words","note":"one sentence on what it signals"}],' +
        '"friction":"2 sentences: where the team is losing time, inferred from what they keep asking",' +
        '"policy_note":"1-2 sentences: whether the policy is well-matched to real work, or blocking legitimate tasks"}. ' +
        "3-4 themes. Be concrete and managerial, not generic.";
      const out = await callClaude([{ role: "user", content: `Prompts:\n${corpus}` }], sys, 900);
      setBriefing(JSON.parse(stripFences(out)));
    } catch {
      setBriefing({ themes: [], friction: "Couldn't generate the briefing — try again.", policy_note: "" });
    } finally { setBriefingLoading(false); }
  }

  const touched = new Set(verdict?.touched || []);

  const exposure = useMemo(() => {
    if (!graph) return [];
    const counts = {};
    log.forEach((l) => (l.touched || []).forEach((id) => (counts[id] = (counts[id] || 0) + 1)));
    return graph.nodes.map((n) => ({ ...n, count: counts[n.id] || 0 })).sort((a, b) => b.count - a.count);
  }, [log, graph]);

  const stats = useMemo(() => {
    const total = log.length, caught = log.filter((l) => l.violation).length;
    return { total, caught, clean: total - caught, rate: total ? Math.round((caught / total) * 100) : 0 };
  }, [log]);

  return (
    <div style={{ minHeight: "100vh", background: NAVY, color: INK, fontFamily: "'Inter Tight',Inter,system-ui,sans-serif" }}>
      <style>{`
        *{box-sizing:border-box}
        .ng{cursor:pointer;border:none;border-radius:8px;font-weight:600;transition:.15s}
        .ng:disabled{opacity:.45;cursor:not-allowed}
        textarea{font-family:'JetBrains Mono',ui-monospace,monospace}
        @keyframes sweep{0%{transform:translateX(-8%)}100%{transform:translateX(108%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes popIn{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        @keyframes ring{0%{r:9;opacity:.9}100%{r:26;opacity:0}}
        @keyframes shimmer{0%,100%{opacity:.35}50%{opacity:.7}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tile{transition:background .35s,color .35s,opacity .35s,transform .35s,box-shadow .35s}
        .bar{transition:width .5s ease}
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 22px 60px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 33, fontWeight: 600, letterSpacing: -0.5 }}>
            North<span style={{ color: TEAL }}>Guard</span>
          </span>
          <span style={{ color: MUTE, fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace" }}>policy · inspect · route</span>
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 18, borderBottom: `1px solid ${NAVY_3}` }}>
          {[["gateway", "Gateway"], ["management", "Management view"]].map(([k, label]) => (
            <button key={k} className="ng" onClick={() => setTab(k)}
              style={{ background: "transparent", color: tab === k ? INK : MUTE, padding: "9px 16px",
                borderRadius: 0, borderBottom: `2px solid ${tab === k ? TEAL : "transparent"}`, fontSize: 14 }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "gateway" ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,1fr) minmax(300px,1.15fr)", gap: 18, marginTop: 20 }}>
            <div>
              <Panel label="1 · Company policy">
                <textarea value={policy} onChange={(e) => setPolicy(e.target.value)} rows={8} style={ta} />
                <button className="ng" onClick={buildGraph} disabled={building} style={{ ...btnTeal, marginTop: 10 }}>
                  {building ? "Reading policy…" : graph ? "Re-read policy" : "Read this policy →"}
                </button>
              </Panel>

              <Panel label="2 · Employee prompt" style={{ marginTop: 14 }}>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} style={ta} />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {SAMPLE_PROMPTS.map((p, i) => (
                    <button key={i} className="ng" onClick={() => setPrompt(p)} style={chip}>example {i + 1}</button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: MUTE }}>On violation:</span>
                  <Toggle mode={mode} setMode={setMode} />
                </div>
                <button className="ng" onClick={inspect} disabled={phase === "scanning" || !graph}
                  style={{ ...btnAmber, marginTop: 12, width: "100%" }}>
                  {phase === "scanning" ? "Inspecting…" : "Inspect & route →"}
                </button>
              </Panel>

              {err && <div style={{ marginTop: 10, color: RED, fontSize: 13, background: "#2a1620", padding: "10px 12px", borderRadius: 8 }}>{err}</div>}
            </div>

            <div>
              <Panel
                label={view === "areas" ? "What you're protecting" : "Policy coverage map"}
                right={<ViewToggle view={view} setView={setView} />}
              >
                {view === "areas" ? (
                  <TileView exposure={exposure} touched={touched} building={building} phase={phase} verdict={verdict} />
                ) : (
                  <GraphView graph={graph} touched={touched} building={building} phase={phase} verdict={verdict} />
                )}
              </Panel>

              {verdict && (
                <Panel label="Verdict" style={{ marginTop: 14, borderColor: verdict.violation ? RED : TEAL }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 15,
                      color: verdict.violation ? RED : TEAL }}>
                      {verdict.violation ? (mode === "block" ? "BLOCKED" : "REDACTED → ROUTED") : "CLEAN → ROUTED"}
                    </span>
                    {verdict.caughtBy && (
                      <span style={{ fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: MUTE,
                        border: `1px solid ${NAVY_3}`, padding: "2px 7px", borderRadius: 20, fontFamily: "'JetBrains Mono',monospace" }}>
                        caught by {verdict.caughtBy}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: MUTE, margin: "8px 0 0", lineHeight: 1.5 }}>{verdict.reason}</p>
                  {verdict.ruleHits?.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11.5, color: MUTE, fontFamily: "'JetBrains Mono',monospace" }}>
                      rules matched: {verdict.ruleHits.map((h) => h.label).join(", ")}
                    </div>
                  )}
                  {verdict.violation && mode === "redact" && (
                    <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: "'JetBrains Mono',monospace",
                      background: NAVY, padding: 10, borderRadius: 6, lineHeight: 1.55 }}>{verdict.redacted}</div>
                  )}
                </Panel>
              )}

              {reply && (
                <Panel label="LLM reply" style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{reply}</div>
                </Panel>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {log.length === 0 ? (
              <Panel label="Management view">
                <div style={{ padding: "26px 4px", textAlign: "center" }}>
                  <p style={{ color: MUTE, fontSize: 14, maxWidth: 460, margin: "0 auto 16px", lineHeight: 1.6 }}>
                    Nothing to report yet. Inspect a few prompts on the Gateway tab, or load a week of sample
                    traffic to see what this looks like with real volume behind it.
                  </p>
                  <button className="ng" onClick={seedWeek} disabled={!graph} style={btnTeal}>Load a sample week</button>
                  {!graph && <div style={{ color: MUTE, fontSize: 12, marginTop: 10 }}>Read a policy first.</div>}
                </div>
              </Panel>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
                  <StatCard n={stats.total} label="requests this week" color={INK} />
                  <StatCard n={stats.caught} label="touched protected data" color={AMBER} />
                  <StatCard n={`${stats.rate}%`} label="exposure rate" color={stats.rate > 40 ? RED : TEAL} />
                  <StatCard n={exposure.filter((e) => e.count > 0).length} label="policy areas hit" color={INK} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,1fr) minmax(300px,1.3fr)", gap: 16, marginTop: 16 }}>
                  <Panel label="Where exposure concentrates">
                    {exposure.map((e) => {
                      const max = Math.max(1, ...exposure.map((x) => x.count));
                      return (
                        <div key={e.id} style={{ marginBottom: 11 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                            <span style={{ color: e.count ? INK : MUTE }}>{e.label}</span>
                            <span style={{ color: MUTE, fontFamily: "'JetBrains Mono',monospace" }}>{e.count}</span>
                          </div>
                          <div style={{ height: 6, background: NAVY, borderRadius: 4, overflow: "hidden" }}>
                            <div className="bar" style={{ width: `${(e.count / max) * 100}%`, height: "100%",
                              background: e.count >= max * 0.6 ? AMBER : TEAL, borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                    <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.5, marginTop: 14, marginBottom: 0 }}>
                      Repeated hits on one area usually mean the work genuinely needs that data — worth asking
                      whether the tooling around it is missing, not just tightening the rule.
                    </p>
                  </Panel>

                  <Panel label="What your people are actually stuck on">
                    {!briefing ? (
                      <div style={{ padding: "18px 2px" }}>
                        <p style={{ color: MUTE, fontSize: 13.5, lineHeight: 1.6, marginTop: 0 }}>
                          The prompts your team writes are an honest record of where the work is hard.
                          Generate a briefing to see the recurring themes behind {log.length} requests.
                        </p>
                        <button className="ng" onClick={generateBriefing} disabled={briefingLoading} style={btnAmber}>
                          {briefingLoading ? "Reading the week…" : "Generate briefing"}
                        </button>
                      </div>
                    ) : (
                      <div>
                        {briefing.themes?.map((t, i) => (
                          <div key={i} style={{ marginBottom: 12, paddingLeft: 11, borderLeft: `2px solid ${TEAL}` }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
                            <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.5, marginTop: 2 }}>{t.note}</div>
                          </div>
                        ))}
                        {briefing.friction && <Block title="Where time is going" body={briefing.friction} accent={AMBER} />}
                        {briefing.policy_note && <Block title="Policy fit" body={briefing.policy_note} accent={TEAL} />}
                        <button className="ng" onClick={generateBriefing} disabled={briefingLoading}
                          style={{ ...chip, marginTop: 12, padding: "6px 12px" }}>
                          {briefingLoading ? "…" : "Regenerate"}
                        </button>
                      </div>
                    )}
                  </Panel>
                </div>

                <Panel label="Activity log" style={{ marginTop: 16 }}>
                  <div style={{ maxHeight: 190, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                    {log.map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 12.3 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", color: MUTE, flexShrink: 0 }}>
                          {new Date(l.t).toLocaleDateString([], { day: "2-digit", month: "short" })}
                        </span>
                        <span style={{ width: 7, height: 7, borderRadius: 9, flexShrink: 0,
                          background: l.violation ? AMBER : TEAL, marginTop: 5 }} />
                        <span style={{ color: MUTE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.prompt}</span>
                        {l.sample && <span style={{ fontSize: 10, color: NAVY_3, flexShrink: 0 }}>sample</span>}
                      </div>
                    ))}
                  </div>
                  {!log.some((l) => l.sample) && (
                    <button className="ng" onClick={seedWeek} disabled={!graph} style={{ ...chip, marginTop: 12, padding: "6px 12px" }}>
                      Load a sample week
                    </button>
                  )}
                </Panel>
              </>
            )}
          </div>
        )}

        <p style={{ color: MUTE, fontSize: 11.5, marginTop: 22, lineHeight: 1.5, fontFamily: "'JetBrains Mono',monospace" }}>
          Demo topology — inspection runs in-browser for illustration. In a real deployment the gateway runs on your
          infrastructure, so prompts never leave your building.
        </p>
      </div>
    </div>
  );
}

/* ---------------- TREEMAP VIEW ---------------- */

const KIND_COLOR = { code: TEAL, pii: AMBER, pricing: "#c98bff", supplier: "#6fa8ff", codename: "#ff9ec4", other: MUTE };

function packRows(items, rows = 2) {
  const total = items.reduce((s, i) => s + i.weight, 0) || 1;
  const target = total / rows;
  const out = [];
  let cur = [], curW = 0;
  items.forEach((it, i) => {
    cur.push(it); curW += it.weight;
    const remaining = items.length - i - 1;
    if ((curW >= target && out.length < rows - 1 && remaining >= rows - out.length - 1) ) {
      out.push({ items: cur, weight: curW }); cur = []; curW = 0;
    }
  });
  if (cur.length) out.push({ items: cur, weight: curW });
  while (out.length < rows && out.some((r) => r.items.length > 1)) {
    const big = out.reduce((a, b) => (a.items.length > b.items.length ? a : b));
    const moved = big.items.pop();
    big.weight -= moved.weight;
    out.push({ items: [moved], weight: moved.weight });
  }
  return out;
}

function TileView({ exposure, touched, building, phase, verdict }) {
  const H = 330;
  if (building) return <Center><span style={{ animation: "pulse 1.2s infinite" }}>Reading the policy…</span></Center>;
  if (!exposure.length) return <Center>Read a policy to see what it protects.</Center>;

  const scanning = phase === "scanning";
  const clean = phase === "done" && verdict && !verdict.violation;

  const items = exposure.map((e) => ({ ...e, weight: 1 + e.count * 1.6 }));
  const rows = packRows(items, items.length > 5 ? 3 : 2);
  const totalW = rows.reduce((s, r) => s + r.weight, 0) || 1;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, height: H }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 7, flex: `${Math.max(row.weight, totalW * 0.18)} 1 0`, minHeight: 62 }}>
            {row.items.map((it) => {
              const hot = touched.has(it.id);
              const col = KIND_COLOR[it.kind] || MUTE;
              return (
                <div key={it.id} className="tile"
                  style={{
                    flex: `${it.weight} 1 0`, minWidth: 74, borderRadius: 10,
                    padding: "11px 12px", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", overflow: "hidden", position: "relative",
                    background: hot ? AMBER : scanning ? NAVY_3 : `${col}1f`,
                    border: `1px solid ${hot ? AMBER : NAVY_3}`,
                    opacity: scanning ? 0.55 : phase === "done" && touched.size > 0 && !hot ? 0.35 : 1,
                    transform: hot ? "scale(1.015)" : "none",
                    boxShadow: hot ? `0 0 0 3px ${AMBER}33` : "none",
                    animation: scanning ? "shimmer 1.1s ease-in-out infinite" : "none",
                  }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25,
                    color: hot ? NAVY : INK }}>{it.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase",
                      color: hot ? NAVY : MUTE, opacity: 0.85 }}>
                      {hot ? "touched" : "protected"}
                    </span>
                    {it.count > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 700,
                        color: hot ? NAVY : col }}>{it.count}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <StatusChip scanning={scanning} clean={clean} phase={phase} n={touched.size} />

      <p style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.5, margin: "12px 0 0" }}>
        Each area grows as your team touches it more often.
      </p>
    </div>
  );
}

/* ---------------- GRAPH VIEW ---------------- */

function GraphView({ graph, touched, building, phase, verdict }) {
  const W = 640, H = 440;
  const positions = useMemo(() => {
    if (!graph) return {};
    const n = graph.nodes.length, cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 74;
    const pos = {};
    graph.nodes.forEach((node, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      pos[node.id] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    return pos;
  }, [graph]);

  if (building) return <Center><span style={{ animation: "pulse 1.2s infinite" }}>Reading the policy…</span></Center>;
  if (!graph) return <Center>Read a policy to see how the protected areas relate.</Center>;

  const scanning = phase === "scanning";
  const clean = phase === "done" && verdict && !verdict.violation;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="trail" x1="0" x2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0.22" />
          </linearGradient>
        </defs>
        {scanning && (
          <g style={{ animation: "sweep 1.4s linear infinite" }}>
            <rect x={-46} y={0} width={46} height={H} fill="url(#trail)" />
            <rect x={0} y={0} width={3} height={H} fill={TEAL} opacity={0.9} />
          </g>
        )}
        {graph.edges?.map((e, i) => {
          const a = positions[e.from], b = positions[e.to];
          if (!a || !b) return null;
          const hot = touched.has(e.from) && touched.has(e.to);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={hot ? AMBER : NAVY_3} strokeWidth={hot ? 2.4 : 1.2} />;
        })}
        {graph.nodes.map((node) => {
          const p = positions[node.id];
          if (!p) return null;
          const hot = touched.has(node.id);
          const col = KIND_COLOR[node.kind] || MUTE;
          return (
            <g key={node.id}>
              {hot && <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={AMBER} strokeWidth={2}
                style={{ animation: "ring 1.6s ease-out infinite" }} />}
              {clean && <circle cx={p.x} cy={p.y} r={15} fill={TEAL} opacity={0.1} />}
              <circle cx={p.x} cy={p.y} r={hot ? 14 : 10}
                fill={hot ? AMBER : scanning ? NAVY_3 : col}
                stroke={hot ? "#fff" : "transparent"} strokeWidth={hot ? 2 : 0}
                style={{ transition: "all .35s" }} />
              <text x={p.x} y={p.y - 21} textAnchor="middle" fontSize="14"
                fill={hot ? AMBER : scanning ? MUTE : INK} fontWeight={hot ? 700 : 500}
                fontFamily="'Inter Tight',Inter,sans-serif" style={{ transition: "all .35s" }}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <StatusChip scanning={scanning} clean={clean} phase={phase} n={touched.size} />
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function StatusChip({ scanning, clean, phase, n }) {
  return (
    <div style={{ position: "absolute", top: 0, right: 0, display: "flex", alignItems: "center", gap: 7,
      fontSize: 11.5, fontFamily: "'JetBrains Mono',monospace",
      color: scanning || clean ? TEAL : n ? AMBER : MUTE }}>
      {scanning && <><Spinner /> checking against policy…</>}
      {clean && <><Check /> nothing protected was touched</>}
      {phase === "done" && n > 0 && <>▲ {n} area{n > 1 ? "s" : ""} touched</>}
      {phase === "idle" && "ready"}
    </div>
  );
}

function ViewToggle({ view, setView }) {
  return (
    <div style={{ display: "inline-flex", background: NAVY, borderRadius: 7, padding: 2, border: `1px solid ${NAVY_3}` }}>
      {[["areas", "Areas"], ["map", "Map"]].map(([k, label]) => (
        <button key={k} className="ng" onClick={() => setView(k)}
          style={{ padding: "4px 11px", fontSize: 11.5, borderRadius: 5,
            background: view === k ? NAVY_3 : "transparent", color: view === k ? INK : MUTE }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Block({ title, body, accent }) {
  return (
    <div style={{ marginTop: 12, background: NAVY, borderRadius: 8, padding: "11px 13px" }}>
      <div style={{ fontSize: 10.5, letterSpacing: 1.3, textTransform: "uppercase", color: accent,
        fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: INK }}>{body}</div>
    </div>
  );
}

function Panel({ label, children, style, right }) {
  return (
    <div style={{ background: NAVY_2, border: `1px solid ${NAVY_3}`, borderRadius: 12, padding: 15, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10 }}>
        <span style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: MUTE,
          fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatCard({ n, label, color }) {
  return (
    <div style={{ background: NAVY_2, border: `1px solid ${NAVY_3}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 29, fontWeight: 700, fontFamily: "'Fraunces',serif", color, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11, color: MUTE, marginTop: 5, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function Toggle({ mode, setMode }) {
  return (
    <div style={{ display: "inline-flex", background: NAVY, borderRadius: 8, padding: 3, border: `1px solid ${NAVY_3}` }}>
      {["block", "redact"].map((m) => (
        <button key={m} className="ng" onClick={() => setMode(m)}
          style={{ padding: "5px 12px", fontSize: 12, borderRadius: 6,
            background: mode === m ? (m === "block" ? RED : TEAL) : "transparent",
            color: mode === m ? NAVY : MUTE }}>
          {m === "block" ? "Block" : "Redact & route"}
        </button>
      ))}
    </div>
  );
}

const Spinner = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={TEAL} strokeWidth="3" strokeDasharray="14 40" strokeLinecap="round" />
  </svg>
);
const Check = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" style={{ animation: "popIn .35s ease-out" }}>
    <circle cx="12" cy="12" r="11" fill={TEAL} opacity="0.16" />
    <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={TEAL} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Center = ({ children }) => (
  <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center",
    color: MUTE, fontSize: 13.5, textAlign: "center", padding: 22 }}>{children}</div>
);

const ta = { width: "100%", background: NAVY, color: INK, border: `1px solid ${NAVY_3}`, borderRadius: 8,
  padding: 11, fontSize: 12.5, lineHeight: 1.55, resize: "vertical", outline: "none" };
const btnTeal = { background: TEAL, color: NAVY, padding: "10px 16px", fontSize: 14 };
const btnAmber = { background: AMBER, color: NAVY, padding: "11px 16px", fontSize: 14.5 };
const chip = { background: NAVY_3, color: MUTE, padding: "4px 10px", fontSize: 11, borderRadius: 6 };
