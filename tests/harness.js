/* Node harness for Advisor Agent Studio.
   Extracts the pure <script id="agent-core"> block from index.html and
   asserts its behavior. Run: node tests/harness.js
   The fixture is a scripted advisor profile with a heavy meeting load,
   mirroring the sample profile in the studio. */
"use strict";
var fs = require("fs"), os = require("os"), path = require("path");

var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
var m = html.match(/<script id="agent-core">([\s\S]*?)<\/script>/);
if (!m) { console.error("agent-core block not found"); process.exit(1); }
var tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "aas-")), "core.js");
fs.writeFileSync(tmp, m[1]);
var C = require(tmp);

var EM = String.fromCharCode(8212); // the em dash character, kept out of the source as a literal
var passed = 0, failed = 0, failures = [];
function check(name, cond) {
  if (cond) { passed++; }
  else { failed++; failures.push(name); console.log("FAIL: " + name); }
}
function includes(name, hay, needle) { check(name, typeof hay === "string" && hay.indexOf(needle) >= 0); }
function excludes(name, hay, needle) { check(name, typeof hay === "string" && hay.indexOf(needle) < 0); }
function near(name, a, b) { check(name, Math.abs(a - b) < 0.001); }

/* ---------- shared fixture: heavy meeting load ---------- */
var CFG = {
  advisorName: "Dana Whitfield", practice: "Whitfield Wealth Partners",
  niche: "small business owners approaching retirement", ownerName: "Dana Whitfield",
  audit: {
    meetingprep:    { hours: "h5p", drain: "dread" },
    meetingnotes:   { hours: "h34", drain: "tedious" },
    meetingfollow:  { hours: "h12", drain: "fine" },
    reviewpackets:  { hours: "h34", drain: "tedious" },
    perfsummary:    { hours: "h12", drain: "tedious" },
    reviewcadence:  { hours: "lt1", drain: "fine" },
    crmhygiene:     { hours: "h12", drain: "tedious" },
    onboarding:     { hours: "h12", drain: "fine" },
    scheduling:     { hours: "h12", drain: "fine" },
    filenotes:      { hours: "h12", drain: "tedious" },
    explainers:     { hours: "h12", drain: "fine" },
    newsletter:     { hours: "lt1", drain: "fine" },
    referraltouches: { hours: "lt1", drain: "fine" }
  },
  modules: null,
  agentName: "Sage", identity: "",
  bearings: ["precise", "discreet"], values: ["accuracy", "sources"], valuesText: "",
  neverDo: ["noadvice", "noinvent", "nocredentials"],
  neverDoText: "Never open a client meeting prep without the last meeting's notes",
  voiceSample: "",
  matrix: {},
  escalation: "Message me directly with what is needed and which client it concerns."
};
var PKG = C.buildAdvisorPackage(CFG);

/* ================= Catalogs ================= */
check("C01 four audit groups", C.AUDIT_GROUPS.length === 4);
check("C02 thirteen audit items", C.AUDIT_ITEMS.length === 13);
check("C03 every item maps to a real module", C.AUDIT_ITEMS.every(function(i){ return !!C.moduleById(i.module); }));
check("C04 every item maps to a real group", C.AUDIT_ITEMS.every(function(i){ return !!C.groupById(i.group); }));
check("C05 four stack modules", C.MODULES.length === 4);
check("C06 module ids in stack order", C.MODULES.map(function(x){ return x.id; }).join(",") === "meeting,review,operations,education");
check("C07 Meeting Prep Partner jobs are preparation, not advice", C.moduleById("meeting").jobs.join(" ").indexOf("prep sheet") >= 0);
check("C08 five hour chips", C.HOUR_CHIPS.length === 5);
check("C09 reclaim rate is 0.6", C.RECLAIM_RATE === 0.6);
check("C10 six matrix actions", C.MATRIX_ACTIONS.length === 6);
check("C11 four matrix levels", Object.keys(C.MATRIX_LEVELS).length === 4);
check("C12 five compliance guardrails", C.COMPLIANCE_GUARDRAILS.length === 5);

/* ================= Scoring ================= */
check("S01 hoursValue reads a chip", C.hoursValue("h34") === 3.5);
check("S02 hoursValue reads a number", C.hoursValue(2) === 2);
check("S03 hoursValue none chip is zero", C.hoursValue("none") === 0);
var SA = C.scoreAudit(CFG);
near("S04 fixture total hours", SA.totalHours, 25);
near("S05 fixture reclaim is 60 percent", SA.reclaimed, 15);
var mp = SA.items.filter(function(i){ return i.id === "meetingprep"; })[0];
near("S06 score is hours x drain x fit", mp.score, 6 * 1.8 * 0.95);
var ONLY = { audit: {} };
C.AUDIT_ITEMS.forEach(function(i){ ONLY.audit[i.id] = { hours: "none", drain: "fine" }; });
ONLY.audit.meetingprep = { hours: 10, drain: "fine" };
var SA2 = C.scoreAudit(ONLY);
check("S07 single routine total", SA2.totalHours === 10);
check("S08 single routine reclaim is 6", SA2.reclaimed === 6);
check("S09 single routine ranked alone", SA2.ranked.length === 1);

/* ================= Opportunities and defaults ================= */
var OPPS = C.rankOpportunities(CFG);
check("O01 heavy meeting load ranks meeting prep first", OPPS[0].itemId === "meetingprep");
check("O02 top opportunity maps to Meeting Prep Partner", OPPS[0].module === "meeting" && OPPS[0].moduleName === "Meeting Prep Partner");
check("O03 default modules cover top two scored areas", JSON.stringify(C.defaultModules(CFG)) === JSON.stringify(["meeting", "review"]));
check("O04 resolveModules honors explicit toggles", JSON.stringify(C.resolveModules({ modules: ["education"], audit: CFG.audit })) === JSON.stringify(["education"]));
check("O05 resolveModules never returns empty", C.resolveModules({ modules: [], audit: {} }).length >= 1);
check("O06 module scores rank meeting highest", (function(){ var ms = C.moduleScores(CFG); return ms.meeting > ms.review && ms.meeting > ms.operations; })());

/* ================= The package: structure ================= */
check("P01 package generates with an owner", PKG.length > 0);
var i1 = PKG.indexOf("=== SECTION 1: WHO YOUR AGENT IS ===");
var i2 = PKG.indexOf("=== SECTION 2: WHAT YOUR AGENT DOES ===");
var i3 = PKG.indexOf("=== SECTION 3: WHERE YOU STAY IN CHARGE ===");
check("P02 three section headers present", i1 >= 0 && i2 >= 0 && i3 >= 0);
check("P03 section headers in order", i1 < i2 && i2 < i3);
includes("P04 agent name in package", PKG, "Name: Sage");
includes("P05 advisor and niche in identity", PKG, "chief of staff to Dana Whitfield, a financial advisor serving small business owners approaching retirement");
includes("P06 practice in package", PKG, "Whitfield Wealth Partners");
includes("P07 reclaim estimate in section 2", PKG, "60 percent reclaim rate");
includes("P08 sample first task output in package", PKG, "FIRST TASK OUTPUT (sample");
includes("P09 prep sheet skeleton present when Meeting on", PKG, "REVIEW-MEETING PREP SHEET (skeleton)");
includes("P10 owner line in section 3", PKG, "Accountable owner: Dana Whitfield");
includes("P11 responsibility line in section 3", PKG, "The advisor is responsible for all advice and client communications");
check("P12 zero em dashes in package", PKG.indexOf(EM) < 0);

/* ================= Module toggling ================= */
var EDU_ONLY = Object.assign({}, CFG, { modules: ["education"] });
var PKG_E = C.buildAdvisorPackage(EDU_ONLY);
includes("T01 education module line present when on", PKG_E, "Plain-language education, drafted for your review.");
excludes("T02 meeting module line absent when off", PKG_E, "Every client meeting, prepared before it starts.");
excludes("T03 review module line absent when off", PKG_E, "Packets assembled, cadence held, figures only from you.");
includes("T04 education block in first task when Education on", PKG_E, "CLIENT EDUCATION DRAFTS QUEUED");
excludes("T05 prep sheet absent from first task when Meeting off", PKG_E, "REVIEW-MEETING PREP SHEET");
var TASK_OPS = C.buildFirstTask(Object.assign({}, CFG, { modules: ["operations"] }));
includes("T06 first task shows operations block when on", TASK_OPS, "PRACTICE OPERATIONS CHECK");
excludes("T07 first task hides review block when off", TASK_OPS, "REVIEW PACKET ASSEMBLY");

/* ================= The soul ================= */
includes("L01 preset never-do lands in package", PKG, "Never give advice or recommendations, to a client or to anyone else");
includes("L02 no-credentials preset lands in package", PKG, "Never ask for, store, or repeat client credentials, account numbers, or government IDs");
includes("L03 free-text never-do lands verbatim", PKG, "Never open a client meeting prep without the last meeting's notes");
includes("L04 bearing prompt lands in package", PKG, "Figures are quoted exactly as supplied");
includes("L05 value prompt lands in package", PKG, "Show every source");
var EDITED = Object.assign({}, CFG, { voiceSample: "Custom voice line, written by the advisor, precise and calm." });
check("L06 edited voice sample resolves exactly", C.resolveVoiceSample(EDITED) === "Custom voice line, written by the advisor, precise and calm.");
includes("L07 edited voice sample ships in package", C.buildAdvisorPackage(EDITED), "Custom voice line, written by the advisor, precise and calm.");
check("L08 generated voice sample is non-empty", C.buildVoiceSample(CFG).length > 20);
check("L09 blank name falls back to a default", C.resolveAgentName({ agentName: "  " }) === C.DEFAULT_AGENT_NAME && C.DEFAULT_AGENT_NAME.length > 0);
includes("L10 blank name still ships named in package", C.buildAdvisorPackage(Object.assign({}, CFG, { agentName: "" })), "Name: " + C.DEFAULT_AGENT_NAME);
check("L11 nichePhrase without a niche stays generic", C.nichePhrase({}) === "their clients");
check("L12 generated identity carries name, advisor, and niche", C.defaultIdentity(CFG).indexOf("You are Sage, chief of staff to Dana Whitfield, a financial advisor serving small business owners approaching retirement") === 0);
check("L13 zero em dashes in first task output", C.buildFirstTask(CFG).indexOf(EM) < 0);

/* ================= Sample output: placeholders, never figures ================= */
var TASK = C.buildFirstTask(CFG);
includes("X01 sample carries the advisor-supplied numbers placeholder", TASK, "[advisor supplies the numbers, cited to source]");
includes("X02 sample carries bracket placeholders", TASK, "[client name, from your CRM]");
check("X03 sample contains no digit-percent patterns", !/\d\s*%/.test(TASK));
check("X04 sample contains no digits at all, so no figure can be invented", !/\d/.test(TASK));
includes("X05 sample escalates un-supplied figures", TASK, "any figure you have not supplied");

/* ================= Approvals, guardrails, and the owner gate ================= */
function defOf(id){ return C.MATRIX_ACTIONS.filter(function(a){ return a.id === id; })[0].def; }
check("A01 no matrix row defaults to Runs freely", C.MATRIX_ACTIONS.every(function(a){ return a.def !== "free"; }));
check("A02 draft a client email defaults to notify", defOf("draftClientEmail") === "notify");
check("A03 draft educational content defaults to notify", defOf("draftEducation") === "notify");
check("A04 send any client communication defaults to ask", defOf("sendCommunication") === "ask");
check("A05 prepare a review packet defaults to ask", defOf("prepareReviewPacket") === "ask");
check("A06 update CRM records defaults to ask", defOf("updateCrm") === "ask");
check("A07 publish or post defaults to ask", defOf("publishPost") === "ask");
includes("A08 default draft rule renders as runs then notifies", PKG, "- Draft a client email: Runs, then notifies me");
includes("A09 default send rule renders as ask first", PKG, "- Send any client communication: Always ask first");
excludes("A10 package never renders a Runs freely standing order", PKG, ": Runs freely");
var TITLES = ["PREPARES, NEVER ADVISES", "NO INVENTED FIGURES", "NO CREDENTIALS, EVER", "CLIENT INFORMATION STAYS PUT", "SUITABILITY STAYS WITH THE ADVISOR"];
TITLES.forEach(function(t, i){ includes("A11." + (i + 1) + " guardrail in section 3: " + t, PKG, t); });
includes("A12 prepares-never-advises text present", PKG, "never gives financial advice or recommendations");
includes("A13 numbers only from the advisor, cited to source", PKG, "only use numbers the advisor supplies, cited to their source");
includes("A14 pasted credentials stop and flag", PKG, "stop and flag it to the advisor immediately");
includes("A15 client information never crosses clients", PKG, "nothing about one client is ever used with another");
includes("A16 agent flags, never fills, gaps", PKG, "the agent flags, never fills, gaps in a client's picture");
includes("A17 guardrails stated to outrank the matrix", PKG, "outrank the matrix");
var NOCHIPS = Object.assign({}, CFG, { neverDo: [], neverDoText: "" });
var PKG_NC = C.buildAdvisorPackage(NOCHIPS);
TITLES.forEach(function(t, i){ includes("A18." + (i + 1) + " guardrail binds with zero never-do chips: " + t, PKG_NC, t); });
includes("A19 responsibility line binds with zero never-do chips", PKG_NC, "the agent's output is preparatory");
check("A20 no owner, no package", C.buildAdvisorPackage(Object.assign({}, CFG, { ownerName: "" })) === "");
check("A21 owner gate explains itself", C.ownerGate({ ownerName: " " }).ok === false && C.ownerGate({ ownerName: " " }).message.indexOf("No owner, no agent") === 0);
check("A22 owner gate passes with a name", C.ownerGate(CFG).ok === true);

/* ================= Whole-file hygiene ================= */
check("F01 zero em dashes anywhere in index.html", html.indexOf(EM) < 0);

console.log("Advisor Agent Studio harness: " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
if (failed) { console.log("Failures: " + failures.join(" | ")); process.exit(1); }
