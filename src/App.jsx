import { useState, useEffect, useRef } from "react";

const AGE_GROUPS = [
  { id: "little",  label: "Little Explorer",  ages: "Ages 4–6",  desc: "Simple words, big imagination, gentle adventures" },
  { id: "junior",  label: "Junior Adventurer", ages: "Ages 7–9",  desc: "Exciting quests, funny moments, real challenges" },
  { id: "hero",    label: "Young Hero",        ages: "Ages 10–12", desc: "Epic journeys, deeper mysteries, real stakes" },
];

const THEMES = [
  { id: "space",    label: "🚀 Outer Space",      desc: "Stars, planets, alien friends" },
  { id: "dragons",  label: "🐉 Dragons & Magic",   desc: "Spells, castles, mythical creatures" },
  { id: "ocean",    label: "🌊 Ocean Deep",        desc: "Mermaids, sea monsters, treasure" },
  { id: "jungle",   label: "🌿 Jungle Quest",      desc: "Hidden temples, exotic animals" },
  { id: "pirates",  label: "🏴‍☠️ Pirate Adventure",  desc: "Ships, islands, buried treasure" },
  { id: "school",   label: "✨ Magic School",      desc: "Powers, friendships, secret lessons" },
  { id: "dino",     label: "🦕 Dinosaur World",    desc: "Time travel, prehistoric beasts" },
  { id: "fairy",    label: "🧚 Fairy Kingdom",     desc: "Tiny worlds, big hearts, enchantment" },
];

const SIDEKICKS = [
  { id: "dog",    label: "🐶 Loyal Dog" },
  { id: "dragon", label: "🐲 Baby Dragon" },
  { id: "robot",  label: "🤖 Funny Robot" },
  { id: "cat",    label: "🐱 Clever Cat" },
  { id: "owl",    label: "🦉 Wise Owl" },
  { id: "none",   label: "🌟 Solo Hero" },
];

const LOADING_MSGS = [
  "Opening the storybook…",
  "Drawing the map…",
  "Waking the characters…",
  "Mixing the magic…",
  "The adventure begins…",
  "Something amazing is coming…",
];

const FREE_CHAPTERS = 3;

function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function load(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } }
function remove(key) { try { localStorage.removeItem(key); } catch {} }

const PROGRESS_KEY = "so_progress";
const UNLOCKED_KEY = "so_unlocked";
const EMAIL_KEY    = "so_email";

function buildSystem(profile) {
  const ageGroup = AGE_GROUPS.find(a => a.id === profile.ageGroup);
  const theme    = THEMES.find(t => t.id === profile.theme);
  const sidekick = SIDEKICKS.find(s => s.id === profile.sidekick);

  const ageInstructions = {
    little: "Use very simple words a 4-6 year old understands. Short sentences. Lots of wonder and warmth. Nothing scary.",
    junior: "Write for 7-9 year olds. Fun, exciting, a little bit silly sometimes. Mild peril that resolves happily.",
    hero:   "Write for 10-12 year olds. More complex plot, real stakes, genuine mystery. Treat them as smart readers.",
  };

  return `You are writing a personalised choose-your-own-adventure story for a child that is read aloud by a parent. Every chapter should feel magical and completely written for THIS specific child — but also secretly entertaining for the adult reading it.

HERO: "${profile.childName}" — use their name naturally throughout
AGE GROUP: ${ageGroup?.label} (${ageGroup?.ages})
THEME: ${theme?.label} — ${theme?.desc}
SIDEKICK: ${sidekick?.id === "none" ? "No sidekick — the hero goes it alone" : `A ${sidekick?.label} called ${profile.sidekickName || sidekick?.label}`}
FAVOURITE COLOUR: ${profile.colour} — weave this into the world naturally
FAVOURITE ANIMAL: ${profile.animal} — include this animal somewhere

AGE-APPROPRIATE WRITING:
${ageInstructions[profile.ageGroup]}

HUMOUR RULES:
Include at least one moment per chapter that will make a parent quietly laugh. Think Roald Dahl or Pixar — funny for adults but completely appropriate for kids. A villain whose evil plan is embarrassingly mundane. A sidekick who is dramatically useless. An authority figure who is secretly incompetent.

STORY RULES:
- Pace yourself. Don't throw everything at once. Let one thing happen, let it breathe, then move forward.
- Ground the adventure in real feelings — excitement, nervousness, wonder, friendship.
- One strong moment per chapter is better than five chaotic ones
- Build tension slowly — the best bit is always just before something happens
- Let ${profile.childName} react to things before the next thing hits
- Humour should come from character and situation — not random wackiness
- Every chapter should feel like it could almost be real — even the impossible parts have their own logic
- Use specific vivid details — a colour, a sound, a smell
- End each chapter on ONE clear exciting moment
- Never scary or violent — peril should be exciting not frightening
- Always use ${profile.childName}'s name — make them feel like the star
- Weave in their favourite colour and animal naturally

IMPORTANT OPENING RULES: Do NOT start with breakfast, maps, or waking up. Open in the middle of something already happening — but make it feel REAL first. Ground ${profile.childName} in one specific vivid detail before the magic hits.

Respond ONLY with valid JSON, no markdown:
{
  "chapterTitle": "Fun exciting chapter title",
  "subtitle": "One line that sets the mood",
  "story": "2-3 punchy paragraphs. Short sentences. Every word earns its place. Separate with \\n",
  "choices": [
    { "emoji": "⚡", "text": "First exciting choice", "hint": "What might happen..." },
    { "emoji": "🌟", "text": "Second exciting choice", "hint": "What might happen..." },
    { "emoji": "🎲", "text": "Third surprising choice", "hint": "What might happen..." }
  ]
}`;
}

export default function StoryOurs() {
  const [screen,         setScreen]         = useState("onboarding");
  const [profile,        setProfile]        = useState({
    childName: "", sidekickName: "",
    ageGroup: "junior", theme: "dragons",
    sidekick: "dog", colour: "Blue", animal: "Lion",
  });
  const [chapter,        setChapter]        = useState(null);
  const [displayedText,  setDisplayedText]  = useState("");
  const [isTyping,       setIsTyping]       = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [chapterNum,     setChapterNum]     = useState(1);
  const [storyHistory,   setStoryHistory]   = useState([]);
  const [error,          setError]          = useState("");
  const [loadingMsg,     setLoadingMsg]     = useState(LOADING_MSGS[0]);
  const [showPaywall,    setShowPaywall]    = useState(false);
  const [unlocked,       setUnlocked]       = useState(false);
  const [returning,      setReturning]      = useState(false);
  const [emailInput,     setEmailInput]     = useState("");
  const [emailScreen,    setEmailScreen]    = useState(false);
  const [emailLoading,   setEmailLoading]   = useState(false);
  const [emailError,     setEmailError]     = useState("");

  const typingRef  = useRef(null);
  const loadingRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("unlocked") === "true") {
      setEmailScreen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Check saved email/unlock
    const savedEmail = load(EMAIL_KEY);
    if (savedEmail && load(UNLOCKED_KEY)) {
      setUnlocked(true);
      setEmailInput(savedEmail);
    }

    // Load saved progress
    const saved = load(PROGRESS_KEY);
    if (saved?.profile && saved?.chapterNum > 1) {
      setReturning(true);
      setProfile(saved.profile);
      setChapterNum(saved.chapterNum);
      setStoryHistory(saved.storyHistory || []);
    }
  }, []);

  useEffect(() => {
    if (screen === "loading") {
      let i = 0;
      loadingRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MSGS.length;
        setLoadingMsg(LOADING_MSGS[i]);
      }, 1800);
    }
    return () => clearInterval(loadingRef.current);
  }, [screen]);

  function stopLoading() {
    clearInterval(loadingRef.current);
    clearTimeout(timeoutRef.current);
  }

  async function handleEmailSubmit() {
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailLoading(true);
    setEmailError("");

    try {
      // Save subscriber to Supabase
      await fetch("/.netlify/functions/save-subscriber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      // Save locally
      save(EMAIL_KEY, emailInput.trim());
      save(UNLOCKED_KEY, true);
      setUnlocked(true);
      setEmailScreen(false);
      setShowPaywall(false);

      // Continue to next chapter if they were at paywall
      if (chapterNum > FREE_CHAPTERS) {
        generateChapter(null, true);
      }
    } catch (err) {
      setEmailError("Something went wrong. Please try again.");
    }

    setEmailLoading(false);
  }

  async function handleEmailCheck() {
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailLoading(true);
    setEmailError("");

    try {
      const res = await fetch("/.netlify/functions/check-subscriber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      const data = await res.json();

      if (data.subscribed) {
        save(EMAIL_KEY, emailInput.trim());
        save(UNLOCKED_KEY, true);
        setUnlocked(true);
        setEmailScreen(false);
        setShowPaywall(false);
        if (chapterNum > FREE_CHAPTERS) generateChapter(null, true);
      } else {
        setEmailError("No subscription found for this email. Please subscribe to continue.");
      }
    } catch (err) {
      setEmailError("Something went wrong. Please try again.");
    }

    setEmailLoading(false);
  }

  async function generateChapter(choiceMade = null, forceUnlocked = false) {
    if (chapterNum > FREE_CHAPTERS && !unlocked && !forceUnlocked) {
      setShowPaywall(true);
      return;
    }

    setScreen("loading");
    setError("");
    setLoadingMsg(LOADING_MSGS[0]);

    timeoutRef.current = setTimeout(() => {
      stopLoading();
      setError("Took too long to load. Please try again!");
      setScreen(chapter ? "story" : "onboarding");
    }, 30000);

    try {
      const userMsg = storyHistory.length === 0
        ? `Begin Chapter 1 of ${profile.childName}'s adventure. IMPORTANT: Do NOT start with breakfast, maps, or waking up. Open in the middle of something already happening. Ground ${profile.childName} in one specific vivid detail before the magic hits. Make ${profile.childName} feel like the hero from the very first sentence. Include something funny that will make the parent smile.`
        : `Story so far:\n${storyHistory.join("\n\n")}\n\nChapter ${chapterNum}. ${profile.childName} chose: "${choiceMade?.text}". Open showing the immediate exciting result. Keep the momentum but let the moment breathe before the next thing happens.`;

      const res = await fetch("/.netlify/functions/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystem(profile),
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await res.json();
      stopLoading();

      if (!res.ok) throw new Error(JSON.stringify(data) || `HTTP ${res.status}`);

      const text   = data.content.map(b => b.text || "").join("");
      const clean  = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setChapter(parsed);
      const newHistory = [...storyHistory, `Ch${chapterNum} — ${parsed.chapterTitle}: ${parsed.story.substring(0, 180)}…`];
      setStoryHistory(newHistory);
      setSelectedChoice(null);
      setScreen("story");
      typeStory(parsed.story);

      save(PROGRESS_KEY, { profile, chapterNum: chapterNum + 1, storyHistory: newHistory });
    } catch (e) {
      stopLoading();
      setError(`Oops! Something went wrong: ${e.message}`);
      setScreen(chapter ? "story" : "onboarding");
    }
  }

  async function generateEnding() {
    setScreen("loading");
    setError("");
    setLoadingMsg("Writing the perfect ending…");

    timeoutRef.current = setTimeout(() => {
      stopLoading();
      setError("Took too long. Please try again!");
      setScreen("story");
    }, 30000);

    try {
      const userMsg = `Story so far:\n${storyHistory.join("\n\n")}\n\nWrite a final triumphant ending. ${profile.childName} saves the day and celebrates. Include one last funny callback to something earlier. Warm, joyful, satisfying.`;

      const res = await fetch("/.netlify/functions/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystem(profile) + `\n\nIMPORTANT: This is the FINAL ENDING. ${profile.childName} must win and end happy. Do NOT repeat what just happened.`,
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await res.json();
      stopLoading();

      if (!res.ok) throw new Error(JSON.stringify(data) || `HTTP ${res.status}`);

      const text   = data.content.map(b => b.text || "").join("");
      const clean  = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      parsed.isEnding = true;

      setChapter(parsed);
      setScreen("story");
      typeStory(parsed.story);
    } catch (e) {
      stopLoading();
      setError(`Oops! Something went wrong: ${e.message}`);
      setScreen("story");
    }
  }

  function typeStory(text) {
    clearTimeout(typingRef.current);
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    function tick() {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        typingRef.current = setTimeout(tick, 18);
      } else {
        setIsTyping(false);
      }
    }
    tick();
  }

  async function handleCheckout() {
    try {
      const res = await fetch("/.netlify/functions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: window.location.origin + "?unlocked=true",
          cancelUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Something went wrong. Please try again.");
    } catch { alert("Something went wrong. Please try again."); }
  }

  function handleStart() {
    if (!profile.childName.trim()) return;
    setReturning(false);
    setChapterNum(1);
    setStoryHistory([]);
    setChapter(null);
    setShowPaywall(false);
    generateChapter();
  }

  function handleNextChapter() {
    if (!selectedChoice) return;
    const next = chapterNum + 1;
    setChapterNum(next);
    if (next > FREE_CHAPTERS && !unlocked) {
      setShowPaywall(true);
      return;
    }
    generateChapter(selectedChoice);
  }

  function handleRestart() {
    clearTimeout(typingRef.current);
    stopLoading();
    remove(PROGRESS_KEY);
    setScreen("onboarding");
    setChapter(null);
    setChapterNum(1);
    setStoryHistory([]);
    setSelectedChoice(null);
    setDisplayedText("");
    setError("");
    setShowPaywall(false);
    setReturning(false);
    setEmailScreen(false);
  }

  const paragraphs    = displayedText.split("\n").filter(p => p.trim());
  const showChoices   = !isTyping && chapter?.choices?.length > 0 && !chapter?.isEnding;
  const showEndingBtn = !isTyping && chapter && !chapter.isEnding && chapterNum >= 2;

  const S = {
    app:          { minHeight: "100vh", background: "#0f1923", color: "#f0f4ff", fontFamily: "'Georgia', serif" },
    content:      { maxWidth: 680, margin: "0 auto", padding: "0 20px 100px" },
    header:       { textAlign: "center", padding: "48px 0 36px", borderBottom: "2px solid rgba(100,180,255,0.15)", marginBottom: 40 },
    stars:        { fontSize: 24, letterSpacing: 8, marginBottom: 16, opacity: 0.7 },
    logo:         { fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 700, color: "#f0f4ff", marginBottom: 10, letterSpacing: 2, textShadow: "0 0 40px rgba(100,180,255,0.4)" },
    logoAccent:   { color: "#64b4ff" },
    tagline:      { fontStyle: "italic", fontSize: 17, color: "rgba(240,244,255,0.5)" },
    welcome:      { fontSize: 18, lineHeight: 1.7, color: "rgba(240,244,255,0.75)", marginBottom: 40, borderLeft: "3px solid rgba(100,180,255,0.4)", paddingLeft: 20, fontStyle: "italic" },
    sectionHdr:   { fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#64b4ff", opacity: 0.8, marginBottom: 16, marginTop: 32 },
    grid2:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 8 },
    fieldGroup:   { marginBottom: 20 },
    label:        { display: "block", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#64b4ff", opacity: 0.7, marginBottom: 8 },
    input:        { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,180,255,0.2)", borderRadius: 8, padding: "13px 16px", fontFamily: "inherit", fontSize: 16, color: "#f0f4ff", outline: "none", boxSizing: "border-box" },
    select:       { width: "100%", background: "#131f2e", border: "1px solid rgba(100,180,255,0.2)", borderRadius: 8, padding: "13px 16px", fontFamily: "inherit", fontSize: 16, color: "#f0f4ff", outline: "none", boxSizing: "border-box" },
    pillRow:      { display: "flex", flexWrap: "wrap", gap: 8 },
    pill:         { padding: "8px 14px", border: "1px solid rgba(100,180,255,0.2)", borderRadius: 20, fontSize: 14, color: "rgba(240,244,255,0.55)", cursor: "pointer", background: "transparent", fontFamily: "inherit" },
    pillActive:   { padding: "8px 14px", border: "1px solid #64b4ff", borderRadius: 20, fontSize: 14, color: "#f0f4ff", cursor: "pointer", background: "rgba(100,180,255,0.12)", fontFamily: "inherit" },
    themeGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    themeBtn:     { padding: "12px 14px", border: "1px solid rgba(100,180,255,0.15)", borderRadius: 10, fontSize: 15, color: "rgba(240,244,255,0.6)", cursor: "pointer", background: "rgba(255,255,255,0.03)", fontFamily: "inherit", textAlign: "left" },
    themeBtnOn:   { padding: "12px 14px", border: "1px solid #64b4ff", borderRadius: 10, fontSize: 15, color: "#f0f4ff", cursor: "pointer", background: "rgba(100,180,255,0.1)", fontFamily: "inherit", textAlign: "left" },
    btnPrimary:   { width: "100%", padding: "18px 0", marginTop: 32, background: "linear-gradient(135deg, #1a6fb5, #2196f3)", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(33,150,243,0.3)" },
    btnGhost:     { width: "100%", padding: "14px 0", marginTop: 12, background: "transparent", border: "1px solid rgba(100,180,255,0.25)", borderRadius: 10, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "rgba(100,180,255,0.6)", cursor: "pointer", fontFamily: "inherit" },
    profileBar:   { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(100,180,255,0.12)", borderRadius: 8, padding: "11px 18px", marginBottom: 32 },
    chapterMeta:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(100,180,255,0.1)" },
    chTitle:      { fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 700, lineHeight: 1.3, color: "#f0f4ff", marginBottom: 8 },
    chSubtitle:   { fontStyle: "italic", fontSize: 16, color: "#64b4ff", marginBottom: 36, opacity: 0.8 },
    storyBody:    { fontSize: "clamp(17px, 2.5vw, 20px)", lineHeight: 1.95, color: "rgba(240,244,255,0.88)" },
    storyP:       { marginBottom: 24 },
    cursor:       { display: "inline-block", width: 2, height: "1em", background: "#64b4ff", marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" },
    skipHint:     { fontSize: 10, color: "rgba(100,180,255,0.25)", textAlign: "center", marginTop: 20, cursor: "pointer", letterSpacing: 3, textTransform: "uppercase" },
    choiceSection:{ marginTop: 48, paddingTop: 32, borderTop: "1px solid rgba(100,180,255,0.1)" },
    choicePrompt: { fontSize: 18, color: "rgba(240,244,255,0.6)", marginBottom: 24, textAlign: "center", fontStyle: "italic" },
    choiceList:   { display: "flex", flexDirection: "column", gap: 12 },
    choiceBtn:    { padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,180,255,0.15)", borderRadius: 10, fontSize: 17, color: "rgba(240,244,255,0.75)", cursor: "pointer", textAlign: "left", lineHeight: 1.5, fontFamily: "inherit" },
    choiceSel:    { padding: "16px 20px", background: "rgba(100,180,255,0.1)", border: "1px solid #64b4ff", borderRadius: 10, fontSize: 17, color: "#f0f4ff", cursor: "pointer", textAlign: "left", lineHeight: 1.5, fontFamily: "inherit" },
    choiceHint:   { fontSize: 12, color: "rgba(240,244,255,0.3)", marginTop: 6 },
    continueBtn:  { marginTop: 24, padding: "15px 36px", background: "linear-gradient(135deg, #1a6fb5, #2196f3)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#fff", cursor: "pointer", display: "block", marginLeft: "auto", marginRight: "auto", fontFamily: "inherit" },
    endingBtn:    { marginTop: 16, padding: "10px 24px", background: "transparent", border: "1px solid rgba(100,180,255,0.25)", borderRadius: 10, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(100,180,255,0.5)", cursor: "pointer", display: "block", marginLeft: "auto", marginRight: "auto", fontFamily: "inherit" },
    loadingState: { textAlign: "center", padding: "80px 0" },
    bookEmoji:    { fontSize: 52, marginBottom: 24, display: "block", animation: "bounce 1.5s ease-in-out infinite" },
    loadingText:  { fontStyle: "italic", fontSize: 18, color: "rgba(240,244,255,0.45)" },
    errorMsg:     { background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)", borderRadius: 8, padding: "16px 20px", fontSize: 16, color: "#ff9999", marginTop: 20, textAlign: "center" },
    paywall:      { textAlign: "center", padding: "60px 20px" },
    pwEmoji:      { fontSize: 64, marginBottom: 20 },
    pwTitle:      { fontSize: 30, fontWeight: 700, color: "#f0f4ff", marginBottom: 12 },
    pwSub:        { fontSize: 18, color: "rgba(240,244,255,0.55)", marginBottom: 16, lineHeight: 1.7 },
    pwPerks:      { background: "rgba(100,180,255,0.06)", border: "1px solid rgba(100,180,255,0.15)", borderRadius: 10, padding: "20px", marginBottom: 32, textAlign: "left" },
    perk:         { fontSize: 16, color: "rgba(240,244,255,0.75)", marginBottom: 10, paddingLeft: 4 },
    pwBtn:        { padding: "18px 48px", background: "linear-gradient(135deg, #1a6fb5, #2196f3)", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#fff", cursor: "pointer", fontFamily: "inherit", marginBottom: 16, display: "block", width: "100%", maxWidth: 360, marginLeft: "auto", marginRight: "auto", boxShadow: "0 4px 20px rgba(33,150,243,0.3)" },
    pwCancel:     { fontSize: 13, color: "rgba(240,244,255,0.3)", marginTop: 16, cursor: "pointer", fontStyle: "italic" },
    retBox:       { background: "rgba(100,180,255,0.06)", border: "1px solid rgba(100,180,255,0.2)", borderRadius: 10, padding: "24px", marginBottom: 32, textAlign: "center" },
    retTxt:       { fontSize: 18, color: "rgba(240,244,255,0.75)", marginBottom: 20, fontStyle: "italic" },
    emailBox:     { textAlign: "center", padding: "60px 20px" },
    emailTitle:   { fontSize: 28, fontWeight: 700, color: "#f0f4ff", marginBottom: 12 },
    emailSub:     { fontSize: 17, color: "rgba(240,244,255,0.55)", marginBottom: 32, lineHeight: 1.7, fontStyle: "italic" },
    emailInput:   { width: "100%", maxWidth: 360, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,180,255,0.3)", borderRadius: 10, padding: "14px 18px", fontFamily: "inherit", fontSize: 17, color: "#f0f4ff", outline: "none", boxSizing: "border-box", marginBottom: 12, display: "block", marginLeft: "auto", marginRight: "auto" },
    emailBtn:     { padding: "15px 36px", background: "linear-gradient(135deg, #1a6fb5, #2196f3)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "block", marginLeft: "auto", marginRight: "auto", marginBottom: 16 },
    emailAlt:     { fontSize: 13, color: "rgba(240,244,255,0.3)", cursor: "pointer", fontStyle: "italic" },
    emailErr:     { fontSize: 14, color: "#ff9999", marginTop: 8, textAlign: "center" },
  };

  const css = `
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f1923; }
    select option { background: #131f2e; }
  `;

  const COLOURS = ["Red", "Blue", "Green", "Purple", "Yellow", "Orange", "Pink", "Gold"];
  const ANIMALS  = ["Lion", "Dragon", "Eagle", "Wolf", "Tiger", "Dolphin", "Fox", "Bear"];

  function PillSelect({ options, value, onChange }) {
    return (
      <div style={S.pillRow}>
        {options.map(o => (
          <button key={o} style={value === o ? S.pillActive : S.pill} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={S.app}>
        <div style={S.content}>

          <header style={S.header}>
            <div style={S.stars}>⭐ 📖 ⭐</div>
            <div style={S.logo}>Story <span style={S.logoAccent}>Ours</span></div>
            <div style={S.tagline}>Adventures written just for your child</div>
          </header>

          {/* Email verification screen */}
          {emailScreen && (
            <div style={S.emailBox}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>🌟</div>
              <h2 style={S.emailTitle}>Welcome to Story Ours!</h2>
              <p style={S.emailSub}>
                Enter the email you used to subscribe and we'll unlock unlimited adventures on any device.
              </p>
              <input
                style={S.emailInput}
                type="email"
                placeholder="your@email.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
              />
              {emailError && <div style={S.emailErr}>{emailError}</div>}
              <button style={S.emailBtn} onClick={handleEmailSubmit} disabled={emailLoading}>
                {emailLoading ? "Checking…" : "Unlock My Stories →"}
              </button>
              <div style={S.emailAlt} onClick={() => setEmailScreen(false)}>Go back</div>
            </div>
          )}

          {/* Onboarding */}
          {!emailScreen && screen === "onboarding" && (
            <div>
              <p style={S.welcome}>Every story is written especially for your child — their name, their favourite things, their choices shape every adventure. Funny enough for parents. Magical enough for kids.</p>

              {returning && (
                <div style={S.retBox}>
                  <p style={S.retTxt}>Welcome back! {profile.childName}'s adventure is waiting! 🌟</p>
                  <button style={S.btnPrimary} onClick={() => { setReturning(false); setScreen("story"); if (!chapter) generateChapter(); }}>Continue the Adventure</button>
                  <button style={S.btnGhost} onClick={() => { setReturning(false); remove(PROGRESS_KEY); }}>Start a New Story</button>
                </div>
              )}

              {!returning && (
                <>
                  {/* Already subscribed? */}
                  {!unlocked && (
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <span style={{ fontSize: 14, color: "rgba(240,244,255,0.35)", fontStyle: "italic" }}>
                        Already subscribed?{" "}
                        <span style={{ color: "#64b4ff", cursor: "pointer" }} onClick={() => setEmailScreen(true)}>
                          Sign in with your email
                        </span>
                      </span>
                    </div>
                  )}

                  <div style={S.sectionHdr}>About the Hero</div>
                  <div style={S.grid2}>
                    <div style={S.fieldGroup}>
                      <label style={S.label}>Child's Name</label>
                      <input style={S.input} type="text" placeholder="Their name" value={profile.childName}
                        onChange={e => setProfile(p => ({ ...p, childName: e.target.value }))} />
                    </div>
                    <div style={S.fieldGroup}>
                      <label style={S.label}>Age Group</label>
                      <select style={S.select} value={profile.ageGroup} onChange={e => setProfile(p => ({ ...p, ageGroup: e.target.value }))}>
                        {AGE_GROUPS.map(a => <option key={a.id} value={a.id}>{a.label} — {a.ages}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Favourite Colour</label>
                    <PillSelect options={COLOURS} value={profile.colour} onChange={v => setProfile(p => ({ ...p, colour: v }))} />
                  </div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Favourite Animal</label>
                    <PillSelect options={ANIMALS} value={profile.animal} onChange={v => setProfile(p => ({ ...p, animal: v }))} />
                  </div>

                  <div style={S.sectionHdr}>Choose the Adventure</div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Story Theme</label>
                    <div style={S.themeGrid}>
                      {THEMES.map(t => (
                        <button key={t.id} style={profile.theme === t.id ? S.themeBtnOn : S.themeBtn}
                          onClick={() => setProfile(p => ({ ...p, theme: t.id }))}>{t.label}</button>
                      ))}
                    </div>
                  </div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Sidekick</label>
                    <div style={S.themeGrid}>
                      {SIDEKICKS.map(s => (
                        <button key={s.id} style={profile.sidekick === s.id ? S.themeBtnOn : S.themeBtn}
                          onClick={() => setProfile(p => ({ ...p, sidekick: s.id }))}>{s.label}</button>
                      ))}
                    </div>
                  </div>

                  {profile.sidekick !== "none" && (
                    <div style={S.fieldGroup}>
                      <label style={S.label}>Sidekick's Name (optional)</label>
                      <input style={S.input} type="text" placeholder="Give them a name!"
                        value={profile.sidekickName || ""}
                        onChange={e => setProfile(p => ({ ...p, sidekickName: e.target.value }))} />
                    </div>
                  )}

                  {error && <div style={S.errorMsg}>{error}</div>}

                  <button style={{ ...S.btnPrimary, opacity: profile.childName.trim() ? 1 : 0.4 }}
                    onClick={handleStart} disabled={!profile.childName.trim()}>
                    🚀 Begin the Adventure!
                  </button>
                </>
              )}
            </div>
          )}

          {/* Loading */}
          {!emailScreen && screen === "loading" && (
            <div style={S.loadingState}>
              <span style={S.bookEmoji}>📖</span>
              <div style={S.loadingText}>{loadingMsg}</div>
            </div>
          )}

          {/* Paywall */}
          {!emailScreen && showPaywall && (
            <div style={S.paywall}>
              <div style={S.pwEmoji}>🌟</div>
              <h2 style={S.pwTitle}>The adventure continues!</h2>
              <p style={S.pwSub}>{profile.childName} has come so far — and the best chapters are still ahead.</p>
              <div style={S.pwPerks}>
                <div style={S.perk}>✅ Unlimited chapters — never stop mid-adventure</div>
                <div style={S.perk}>✅ Unlimited new stories — new theme any time</div>
                <div style={S.perk}>✅ Works on any device with your email</div>
                <div style={{ ...S.perk, marginBottom: 0 }}>✅ Cancel anytime</div>
              </div>
              <button style={S.pwBtn} onClick={handleCheckout}>Unlock All Stories — $2.99/mo</button>
              <div style={{ ...S.emailAlt, marginTop: 16 }} onClick={() => { setShowPaywall(false); setEmailScreen(true); }}>
                Already subscribed? Sign in with email
              </div>
              <div style={{ ...S.pwCancel, marginTop: 12 }} onClick={handleRestart}>Start a different story instead</div>
            </div>
          )}

          {/* Story */}
          {!emailScreen && screen === "story" && chapter && !showPaywall && (
            <div>
              <div style={S.profileBar}>
                <div style={{ fontStyle: "italic", fontSize: 15, color: "rgba(240,244,255,0.6)" }}>{profile.childName}'s adventure 🌟</div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#64b4ff", textTransform: "uppercase" }}>Chapter {chapterNum}</div>
                <button style={{ background: "none", border: "none", fontSize: 12, color: "rgba(100,180,255,0.4)", cursor: "pointer", fontFamily: "inherit" }} onClick={handleRestart}>New Story</button>
              </div>

              <div style={S.chapterMeta}>
                <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#64b4ff", opacity: 0.7 }}>Chapter {chapterNum}</span>
                <span style={{ fontSize: 20 }}>{THEMES.find(t => t.id === profile.theme)?.label.split(" ")[0]}</span>
              </div>

              <h2 style={S.chTitle}>{chapter.chapterTitle}</h2>
              <div style={S.chSubtitle}>{chapter.subtitle}</div>

              <div style={S.storyBody}>
                {paragraphs.map((p, i) => (
                  <p key={i} style={S.storyP}>
                    {p}{isTyping && i === paragraphs.length - 1 && <span style={S.cursor} />}
                  </p>
                ))}
              </div>

              {isTyping && (
                <div style={S.skipHint} onClick={() => { clearTimeout(typingRef.current); setDisplayedText(chapter.story); setIsTyping(false); }}>
                  Tap to read all
                </div>
              )}

              {error && <div style={S.errorMsg}>{error}</div>}

              {showChoices && (
                <div style={S.choiceSection}>
                  <p style={S.choicePrompt}>What does {profile.childName} do next?</p>
                  <div style={S.choiceList}>
                    {chapter.choices.map((c, i) => (
                      <button key={i} style={selectedChoice?.text === c.text ? S.choiceSel : S.choiceBtn}
                        onClick={() => setSelectedChoice(c)}>
                        <span style={{ fontSize: 20, marginRight: 10 }}>{c.emoji}</span>
                        {c.text}
                        <div style={S.choiceHint}>{c.hint}</div>
                      </button>
                    ))}
                  </div>
                  {selectedChoice && (
                    <button style={S.continueBtn} onClick={handleNextChapter}>Let's go! →</button>
                  )}
                  {showEndingBtn && (
                    <button style={S.endingBtn} onClick={generateEnding}>⭐ Finish my story</button>
                  )}
                </div>
              )}

              {chapter.isEnding && (
                <div style={{ ...S.choiceSection, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🌟</div>
                  <p style={{ fontStyle: "italic", fontSize: 20, color: "rgba(240,244,255,0.6)", marginBottom: 32 }}>
                    The End! {profile.childName} saved the day! 🎉
                  </p>
                  <button style={S.continueBtn} onClick={handleRestart}>Start a New Adventure!</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
