"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, AudioLines, BookOpenCheck, BrainCircuit, Check, CheckCircle2,
  ChevronRight, CircleHelp, Clock3, Flame, Gauge, Headphones, Lock, Mic,
  Pause, Play, RotateCcw, ShieldCheck, Sparkles, Star, Target, TimerReset,
  Trophy, Volume2, X, Zap, CalendarDays, MessageCircle, Settings2, Map,
} from "lucide-react";
import {
  buildBackward, buildSession, evaluateSpeech, patterns, stages,
  type DrillPrompt, type PatternDefinition, type WeakPoint,
} from "./training-engine";

type Screen = "home" | "training" | "results";
type Phase = "stage-intro" | "ready" | "countdown" | "speak" | "self-grade" | "success" | "correction";
type Grade = "correct" | "almost" | "slow" | "again";
type ModalName = "patterns" | "weak" | "reviews" | "method" | "pronunciation" | "coach" | "voice" | "timetable" | null;
type WeakPointScores = Record<WeakPoint, number>;
type DayStatus = "paused" | "not-started" | "complete";
type CoachStatus = "checking" | "ready" | "setup" | "signin" | "forbidden" | "error";
type CoachMessage = { role: "user" | "assistant"; content: string };

type DayProgress = {
  activeSeconds: number;
  totalSeconds: number;
  status: DayStatus;
  completedPrompts: number;
};

type ReviewItem = {
  id: string;
  patternId: string;
  label: string;
  dueAt: string;
  interval: "24h" | "7d";
  done: boolean;
};

type HistoryEntry = {
  id: string;
  patternId: string;
  endedAt: string;
  accuracy: number;
  averageReaction: number | null;
  activeSeconds: number;
  masteryBefore: number;
  masteryAfter: number;
  mainMistake: WeakPoint | null;
};

type ActiveSession = {
  patternId: string;
  dayNumber: number;
  promptIndex: number;
  activeSeconds: number;
  baseActiveSeconds: number;
  startedAt: string;
  totalPauseSeconds: number;
  pausedAt?: string | null;
  attempts: number;
  correct: number;
  almost: number;
  slow: number;
  combo: number;
  bestCombo: number;
  xpEarned: number;
  reactionTimes: number[];
  mistakes: WeakPointScores;
  weakBaseline?: WeakPointScores;
};

type ProgressState = {
  version: 3;
  sessionNumber: number;
  selectedDay: number;
  selectedPatternId: string;
  xp: number;
  streak: number;
  totalActiveSeconds: number;
  mastery: Record<string, number>;
  weakPoints: WeakPointScores;
  reviews: ReviewItem[];
  history: HistoryEntry[];
  lastTrainingDate: string | null;
  savedSessions: Record<string, ActiveSession>;
  dayProgress: Record<string, DayProgress>;
  voiceURI: string | null;
};

type SessionResult = HistoryEntry & {
  dayNumber: number;
  dayActiveSeconds: number;
  dayTargetSeconds: number;
  attempts: number;
  correct: number;
  bestCombo: number;
  xpEarned: number;
  improvement: number | null;
  wallSeconds: number | null;
  pauseSeconds: number;
};

interface SpeechRecognitionAlternativeLike { transcript: string; confidence: number }
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike extends Event {
  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionInstanceLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onspeechstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionConstructorLike { new (): SpeechRecognitionInstanceLike }
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  }
}

const STORAGE_KEY = "fsi-speaking-arcade-v3";
const PREVIOUS_KEY = "fsi-speaking-arcade-v2";
const LEGACY_KEY = "american-english-quest-v1";
const EMPTY_WEAK_POINTS: WeakPointScores = { grammar: 0, pronunciation: 0, speed: 0, vocabulary: 0, fluency: 0 };
const DEFAULT_PROGRESS: ProgressState = {
  version: 3,
  sessionNumber: 2,
  selectedDay: 1,
  selectedPatternId: "focused-on",
  xp: 1210,
  streak: 2,
  totalActiveSeconds: 121 * 60,
  mastery: { "focused-on": 28, "supposed-ended": 34, "usually-today": 18 },
  weakPoints: { grammar: 4, pronunciation: 2, speed: 3, vocabulary: 1, fluency: 2 },
  reviews: [
    { id: "legacy-ended-up", patternId: "supposed-ended", label: "ended up + verb-ing", dueAt: new Date(2026, 8, 5).toISOString(), interval: "24h", done: false },
    { id: "legacy-put-off", patternId: "supposed-ended", label: "put it off until noon", dueAt: new Date(2026, 8, 11).toISOString(), interval: "7d", done: false },
  ],
  history: [],
  lastTrainingDate: null,
  savedSessions: {},
  dayProgress: {
    "1": { activeSeconds: 30 * 60, totalSeconds: 600 * 60, status: "paused", completedPrompts: 5 },
    "2": { activeSeconds: 91 * 60, totalSeconds: 600 * 60, status: "paused", completedPrompts: 14 },
    "3": { activeSeconds: 0, totalSeconds: 600 * 60, status: "not-started", completedPrompts: 0 },
  },
  voiceURI: null,
};

const questDays = [
  { day: 1, title: "FOCUS MODE", subtitle: "Goals, confidence & English mode", patternId: "focused-on", color: "mint" },
  { day: 2, title: "PLAN SHIFT", subtitle: "Routines, delays & changed plans", patternId: "supposed-ended", color: "coral" },
  { day: 3, title: "CLASS SURVIVAL", subtitle: "Clarify, repeat & ask for help", patternId: "didnt-catch", color: "violet" },
] as const;

const timetable = [
  { time: "08:00–08:30", minutes: 30, title: "Warm-up & Retrieval", method: "Voice diary · rapid recall" },
  { time: "08:40–09:20", minutes: 40, title: "Dialogue & Meaning", method: "Situation first · no blind memorizing" },
  { time: "09:30–10:15", minutes: 45, title: "Mimicry Lab", method: "Repetition · backward build-up" },
  { time: "10:30–11:20", minutes: 50, title: "Pattern Lock I", method: "Substitution drill" },
  { time: "11:30–12:15", minutes: 45, title: "Shape Shift", method: "Transformation drill" },
  { time: "13:15–13:55", minutes: 40, title: "3-Second Response", method: "Response drill" },
  { time: "14:05–14:45", minutes: 40, title: "Question Chain", method: "Question-and-answer drill" },
  { time: "15:00–15:50", minutes: 50, title: "Pattern Lock II", method: "Expansion · reduction" },
  { time: "16:00–16:50", minutes: 50, title: "Sound Workshop", method: "Minimal pair · shadowing" },
  { time: "17:00–17:40", minutes: 40, title: "Chunk Forge", method: "Useful chunks · timed retrieval" },
  { time: "18:30–19:15", minutes: 45, title: "Recombination", method: "Old material → new sentences" },
  { time: "19:25–20:10", minutes: 45, title: "Canada School", method: "Situation drill" },
  { time: "20:20–21:10", minutes: 50, title: "Role-play Arena", method: "Teacher · classmate · homestay" },
  { time: "21:20–21:50", minutes: 30, title: "Final Boss", method: "Free response · result · review" },
] as const;

const weakLabels: Record<WeakPoint, string> = {
  grammar: "Grammar", pronunciation: "Pronunciation", speed: "Reaction speed",
  vocabulary: "Vocabulary", fluency: "Fluency",
};
const gradeMeta: Record<Grade, { label: string; symbol: string; weak: WeakPoint | null }> = {
  correct: { label: "Correct", symbol: "✓", weak: null },
  almost: { label: "Almost", symbol: "△", weak: "grammar" },
  slow: { label: "Too Slow", symbol: "⏱", weak: "speed" },
  again: { label: "Try Again", symbol: "↻", weak: "fluency" },
};
const pronunciationNotes: Record<string, string> = {
  "focused-on": "Stress FOCUSED and the key -ing action. Link ‘focused on’ smoothly, but keep the final sound in focused audible.",
  "supposed-ended": "Contrast supposed / suppose and ended / end it. Keep ‘was supposed to’ as one smooth chunk.",
  "usually-today": "Contrast usually / unusual. Reduce ‘I am’ to I’m, but keep the -ing ending audible.",
  "didnt-catch": "Contrast catch / caught. Link ‘catch the’ without deleting the final sound.",
  "trying-need": "Contrast trying / tiring. Keep the /r/ and lightly reduce ‘to’ in ‘trying to’.",
  "reason-is-that": "Link ‘reason I’ smoothly; keep the final /n/ before the vowel in I.",
  "see-point": "Contrast point / pointed. Hold the final /t/ lightly before ‘but’.",
  "rather-because": "Contrast rather / ladder. Use the American flap in ‘rather’ and no ‘to’ after rather.",
  "about-to-when": "Reduce ‘about to’ naturally, but keep the target chunk recognizable.",
  "what-i-mean": "Link ‘what I’ and stress MEAN. Keep the repair phrase calm, not apologetic.",
  "like-to-know": "Reduce ‘like to’ lightly and keep whether distinct from weather.",
  "if-had": "Link ‘if I had’ as one thought group. Keep had audible before the past participle.",
  "not-only": "Stress NOT ONLY and the matching word after BUT ALSO; keep both halves parallel.",
};

const chunkGlosses = [
  { match: "was supposed to", gloss: "本来应该……；后面接动词原形" },
  { match: "ended up", gloss: "结果却／最后竟然；后面通常接 verb-ing" },
  { match: "putting it off", gloss: "把它拖延、推迟" },
  { match: "past midnight", gloss: "超过午夜、凌晨十二点以后" },
  { match: "running late", gloss: "时间来不及了、眼看要迟到" },
  { match: "focused on", gloss: "专注于；on 后接名词或 verb-ing" },
  { match: "didn't catch", gloss: "刚才没听清／没听懂某一部分" },
  { match: "could you", gloss: "礼貌请求：你可以……吗？" },
  { match: "would rather", gloss: "更愿意；后面直接接动词原形，不加 to" },
  { match: "what i mean", gloss: "我的意思是……；用来修正或澄清表达" },
];

function isUSVoice(voice: SpeechSynthesisVoice) {
  return voice.lang.replace("_", "-").toLowerCase() === "en-us";
}

function isLikelyMaleVoice(voice: SpeechSynthesisVoice) {
  return /\b(guy|david|mark|christopher|eric|roger|tony|fred|aaron|albert|alex|arthur|bruce|daniel|eddy|joey|junior|matthew|nathan|ralph|reed|rocko)\b/i.test(voice.name);
}

function voiceScore(voice: SpeechSynthesisVoice) {
  let score = 0;
  if (isLikelyMaleVoice(voice)) score += 100;
  if (/natural|online/i.test(voice.name)) score += 25;
  if (/microsoft/i.test(voice.name)) score += 12;
  if (/google/i.test(voice.name)) score += 8;
  if (voice.localService) score += 2;
  return score;
}

function bestUSMaleVoice(voices: SpeechSynthesisVoice[]) {
  return voices.filter((voice) => isUSVoice(voice) && isLikelyMaleVoice(voice)).sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
}

function coachAnswer(query: string, prompt: DrillPrompt, pattern: PatternDefinition) {
  const normalized = query.trim().toLowerCase();
  const answer = prompt.answer;
  const matchedChunk = chunkGlosses.find((item) => answer.toLowerCase().includes(item.match) || normalized.includes(item.match));
  if (/发音|pronunc|怎么读|读音|stress/.test(normalized)) {
    return `发音重点：${pronunciationNotes[pattern.id] ?? "先听慢速 model，再做 backward build-up，最后用正常速度 shadow 三遍。"}`;
  }
  if (/grammar|语法|为什么|why|verb-?ing|\b-ing\b|时态|tense|结构/.test(normalized)) {
    return `Grammar map：${pattern.rule}。这题只要求你锁住 “${pattern.frame}”，其他内容只是替换槽位。`;
  }
  if (/chunk|语块|重点|phrase/.test(normalized)) {
    return matchedChunk
      ? `关键语块 “${matchedChunk.match}” = ${matchedChunk.gloss}。整块记忆，不要逐词翻译。`
      : `今天的核心 chunk 是 “${pattern.frame}”。本题提示：${prompt.hint ?? pattern.rule}`;
  }
  if (/场景|situation|什么时候|自然|native|use/.test(normalized)) {
    return `真实使用场景：${pattern.world}。先说核心句，再根据需要补一个 reason 或 next step；日常对话里不用故意说得很长。`;
  }
  if (/例句|example|another|类似/.test(normalized)) {
    return `相似例句：${prompt.transferAnswer}`;
  }
  const cueMeaning = /[\u4e00-\u9fff]/.test(prompt.cue) ? prompt.cue : pattern.meaning;
  return `这句在当前剧情里的意思是：${cueMeaning}。参考表达：${answer}${matchedChunk ? ` 其中 “${matchedChunk.match}” 表示“${matchedChunk.gloss}”。` : ""}`;
}

function formatTime(totalSeconds: number) {
  const value = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
function formatReaction(value: number | null) { return value === null ? "—" : `${(value / 1000).toFixed(1)}s`; }
function getYangonDateKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function clamp(value: number, min = 0, max = 100) { return Math.min(max, Math.max(min, value)); }
function topWeakPoint(scores: WeakPointScores): WeakPoint | null {
  const sorted = (Object.entries(scores) as Array<[WeakPoint, number]>).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[1] > 0 ? sorted[0][0] : null;
}
function addHours(hours: number) { return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(); }

function Ring({ value, label, size = "normal" }: { value: number; label: string; size?: "normal" | "large" }) {
  const safe = clamp(value);
  return (
    <div className={`mastery-ring ${size === "large" ? "mastery-ring-large" : ""}`} style={{ "--ring-value": `${safe * 3.6}deg` } as React.CSSProperties}>
      <div><strong>{safe}%</strong><span>{label}</span></div>
    </div>
  );
}

function CoachAvatar({ className = "", alt = "Pixel Coach", eager = false }: { className?: string; alt?: string; eager?: boolean }) {
  return (
    // A direct asset is intentional: the deployed Next image-optimization route is unavailable on this Site.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src="/coach-bot.webp?v=5"
      alt={alt}
      width={600}
      height={672}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallback === "true") return;
        image.dataset.fallback = "true";
        image.src = "/coach-bot.svg?v=5";
      }}
    />
  );
}

function GameLogo() {
  return (
    <div className="game-logo" aria-label="American English Quest">
      <span className="logo-cube"><Zap /></span>
      <span><strong>AEQ</strong><small>FSI SPEAKING ARCADE</small></span>
    </div>
  );
}

export default function Home() {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [phase, setPhase] = useState<Phase>("stage-intro");
  const [modal, setModal] = useState<ModalName>(null);
  const [sessionPromptIndex, setSessionPromptIndex] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pauseStartedAt, setPauseStartedAt] = useState<number | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [diarySeconds, setDiarySeconds] = useState(120);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [suggestedGrade, setSuggestedGrade] = useState<Grade | null>(null);
  const [feedbackIssue, setFeedbackIssue] = useState("");
  const [repeatCount, setRepeatCount] = useState(0);
  const [isTransfer, setIsTransfer] = useState(false);
  const [modelRevealed, setModelRevealed] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [clockNow, setClockNow] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachReply, setCoachReply] = useState("");
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachStatus, setCoachStatus] = useState<CoachStatus>("checking");
  const [coachModel, setCoachModel] = useState("gpt-5.6-luna");
  const [coachLoading, setCoachLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const coachAbortRef = useRef<AbortController | null>(null);

  const activePattern = useMemo(() => patterns.find((pattern) => pattern.id === progress.selectedPatternId) ?? patterns[0], [progress.selectedPatternId]);
  const selectedDayInfo = questDays.find((item) => item.day === progress.selectedDay) ?? null;
  const selectedDayProgress = progress.dayProgress[String(progress.selectedDay)] ?? { activeSeconds: 0, totalSeconds: 600 * 60, status: "not-started" as const, completedPrompts: 0 };
  const savedSession = progress.savedSessions[activePattern.id];
  const weakBaseline = session?.weakBaseline ?? savedSession?.weakBaseline ?? progress.weakPoints;
  const prompts = useMemo(() => buildSession(activePattern, weakBaseline), [activePattern, weakBaseline]);
  const currentPrompt = prompts[Math.min(sessionPromptIndex, prompts.length - 1)];
  const currentStageIndex = stages.findIndex((stage) => stage.id === currentPrompt?.stageId);
  const currentStage = stages[Math.max(0, currentStageIndex)];
  const mastery = progress.mastery[activePattern.id] ?? 0;
  const playerLevel = Math.max(1, Math.floor(progress.xp / 500) + 1);
  const dueReviews = progress.reviews.filter((item) => !item.done && new Date(item.dueAt).getTime() <= clockNow);
  const sessionAccuracy = session && session.attempts > 0 ? Math.round((session.correct / session.attempts) * 100) : 100;
  const currentCue = isTransfer ? currentPrompt?.transferCue : currentPrompt?.cue;
  const currentAnswer = isTransfer ? currentPrompt?.transferAnswer : currentPrompt?.answer;
  const coachPrompt = currentPrompt && isTransfer ? { ...currentPrompt, cue: currentPrompt.transferCue, answer: currentPrompt.transferAnswer } : currentPrompt;
  const usMaleVoices = useMemo(() => voices.filter((voice) => isUSVoice(voice) && isLikelyMaleVoice(voice)).sort((a, b) => voiceScore(b) - voiceScore(a)), [voices]);
  const selectedVoice = useMemo(() => {
    const savedVoice = voices.find((voice) => voice.voiceURI === progress.voiceURI && isUSVoice(voice) && isLikelyMaleVoice(voice));
    return savedVoice ?? bestUSMaleVoice(voices);
  }, [progress.voiceURI, voices]);

  function beginRecognition(startedAt: number) {
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) { setRecognitionAvailable(false); return; }
    try {
      recognitionRef.current?.stop();
      const recognition = new Constructor();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onspeechstart = () => setReactionMs((previous) => previous ?? performance.now() - startedAt);
      recognition.onresult = (event) => {
        let next = "";
        for (let index = 0; index < event.results.length; index += 1) next += event.results[index][0]?.transcript ?? "";
        setTranscript(next.trim());
        setReactionMs((previous) => previous ?? performance.now() - startedAt);
      };
      recognition.onerror = () => { setListening(false); setRecognitionAvailable(false); };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch {
      setRecognitionAvailable(false);
      setListening(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<ProgressState>;
          if (parsed.version === 3) {
            setProgress({
              ...DEFAULT_PROGRESS,
              ...parsed,
              version: 3,
              mastery: { ...DEFAULT_PROGRESS.mastery, ...(parsed.mastery ?? {}) },
              weakPoints: { ...DEFAULT_PROGRESS.weakPoints, ...(parsed.weakPoints ?? {}) },
              savedSessions: parsed.savedSessions ?? {},
              dayProgress: { ...DEFAULT_PROGRESS.dayProgress, ...(parsed.dayProgress ?? {}) },
            });
          }
        } else {
          const previousSaved = window.localStorage.getItem(PREVIOUS_KEY);
          if (previousSaved) {
            const previous = JSON.parse(previousSaved) as Partial<ProgressState> & { activeSession?: Partial<ActiveSession> | null };
            const old = previous.activeSession;
            const migratedDayNumber = old?.patternId === "supposed-ended" ? 2 : old?.patternId === "focused-on" ? 1 : 0;
            const migratedTrackedSeconds = migratedDayNumber > 0 ? (DEFAULT_PROGRESS.dayProgress[String(migratedDayNumber)]?.activeSeconds ?? 0) : 0;
            const migratedActiveSeconds = Math.max(old?.activeSeconds ?? 0, migratedTrackedSeconds);
            const migratedSession = old?.patternId ? {
              patternId: old.patternId,
              dayNumber: migratedDayNumber,
              promptIndex: old.promptIndex ?? 0,
              activeSeconds: migratedActiveSeconds,
              baseActiveSeconds: migratedActiveSeconds,
              startedAt: old.startedAt ?? new Date().toISOString(),
              totalPauseSeconds: old.totalPauseSeconds ?? 0,
              pausedAt: old.pausedAt ?? null,
              attempts: old.attempts ?? 0,
              correct: old.correct ?? 0,
              almost: old.almost ?? 0,
              slow: old.slow ?? 0,
              combo: old.combo ?? 0,
              bestCombo: old.bestCombo ?? 0,
              xpEarned: old.xpEarned ?? 0,
              reactionTimes: old.reactionTimes ?? [],
              mistakes: { ...EMPTY_WEAK_POINTS, ...(old.mistakes ?? {}) },
              weakBaseline: { ...DEFAULT_PROGRESS.weakPoints, ...(old.weakBaseline ?? previous.weakPoints ?? {}) },
            } satisfies ActiveSession : null;
            setProgress({
              ...DEFAULT_PROGRESS,
              xp: previous.xp ?? DEFAULT_PROGRESS.xp,
              streak: previous.streak ?? DEFAULT_PROGRESS.streak,
              totalActiveSeconds: previous.totalActiveSeconds ?? DEFAULT_PROGRESS.totalActiveSeconds,
              mastery: { ...DEFAULT_PROGRESS.mastery, ...(previous.mastery ?? {}) },
              weakPoints: { ...DEFAULT_PROGRESS.weakPoints, ...(previous.weakPoints ?? {}) },
              reviews: previous.reviews ?? DEFAULT_PROGRESS.reviews,
              history: previous.history ?? [],
              lastTrainingDate: previous.lastTrainingDate ?? null,
              savedSessions: migratedSession ? { [migratedSession.patternId]: migratedSession } : {},
            });
          } else {
            const legacy = window.localStorage.getItem(LEGACY_KEY);
            if (legacy) {
              const parsedLegacy = JSON.parse(legacy) as { xp?: number; streak?: number; activeSeconds?: Record<string, number> };
              const total = Object.values(parsedLegacy.activeSeconds ?? {}).reduce((sum, value) => sum + value, 0);
              setProgress((previous) => ({ ...previous, xp: parsedLegacy.xp ?? previous.xp, streak: parsedLegacy.streak ?? previous.streak, totalActiveSeconds: total || previous.totalActiveSeconds }));
            }
          }
        }
      } catch {
        setToast("Saved progress could not be read. A safe starter profile is active.");
      } finally {
        setRecognitionAvailable(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
        setClockNow(Date.now());
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    const timer = window.setTimeout(loadVoices, 0);
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  useEffect(() => {
    if (!hydrated) return;
    const interval = window.setInterval(() => setClockNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [hydrated]);

  useEffect(() => {
    if (screen !== "training" || paused || phase === "stage-intro") return;
    const interval = window.setInterval(() => setActiveSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [screen, paused, phase]);

  useEffect(() => {
    if (!hydrated || !session || screen !== "training" || activeSeconds % 5 !== 0) return;
    const snapshot = { ...session, promptIndex: sessionPromptIndex, activeSeconds };
    const nextDayProgress = session.dayNumber > 0 ? {
      ...progress.dayProgress,
      [String(session.dayNumber)]: {
        ...(progress.dayProgress[String(session.dayNumber)] ?? { totalSeconds: 600 * 60, completedPrompts: 0 }),
        activeSeconds,
        status: "paused" as DayStatus,
        completedPrompts: Math.max(progress.dayProgress[String(session.dayNumber)]?.completedPrompts ?? 0, sessionPromptIndex),
      },
    } : progress.dayProgress;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...progress,
      savedSessions: { ...progress.savedSessions, [activePattern.id]: snapshot },
      dayProgress: nextDayProgress,
    }));
  }, [activePattern.id, activeSeconds, hydrated, progress, screen, session, sessionPromptIndex]);

  useEffect(() => {
    if (paused || phase !== "countdown" || countdown === null) return;
    if (countdown > 1) {
      const timer = window.setTimeout(() => setCountdown((value) => (value ?? 1) - 1), 1000);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setCountdown(null);
      setPhase("speak");
      const start = performance.now();
      beginRecognition(start);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, paused, phase]);

  useEffect(() => {
    if (paused || phase !== "speak" || currentPrompt?.kind !== "Voice diary" || diarySeconds <= 0) return;
    const interval = window.setInterval(() => setDiarySeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [currentPrompt?.kind, diarySeconds, paused, phase]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function speak(text: string, rate = 0.9) {
    if (!soundOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!selectedVoice) {
      setModal("voice");
      setToast("American male voice is not ready. Choose or install one in Voice Lock.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  function previewVoice(voice: SpeechSynthesisVoice) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hi, I’m your Pixel Coach. Let’s lock this pattern in.");
    utterance.voice = voice;
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  const stopRecognition = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    setListening(false);
  }, []);

  function resetCoachConversation() {
    coachAbortRef.current?.abort();
    coachAbortRef.current = null;
    setCoachMessages([]);
    setCoachReply("");
    setCoachQuestion("");
    setCoachLoading(false);
  }

  function resetPrompt(nextPhase: Phase = "ready") {
    stopRecognition();
    resetCoachConversation();
    setPhase(nextPhase);
    setCountdown(null);
    setDiarySeconds(120);
    setTranscript("");
    setReactionMs(null);
    setSuggestedGrade(null);
    setFeedbackIssue("");
    setRepeatCount(0);
    setIsTransfer(false);
    setModelRevealed(false);
  }

  function startSession() {
    setPaused(false);
    setPauseStartedAt(null);
    const saved = progress.savedSessions[activePattern.id];
    if (saved) {
      const savedPauseStarted = saved.pausedAt ? new Date(saved.pausedAt).getTime() : NaN;
      const offlinePauseSeconds = Number.isFinite(savedPauseStarted) ? Math.max(0, Math.round((new Date().getTime() - savedPauseStarted) / 1000)) : 0;
      const normalized: ActiveSession = {
        ...saved,
        dayNumber: saved.dayNumber ?? progress.selectedDay,
        baseActiveSeconds: saved.baseActiveSeconds ?? 0,
        totalPauseSeconds: saved.totalPauseSeconds + offlinePauseSeconds,
        pausedAt: null,
      };
      setSession(normalized);
      setSessionPromptIndex(Math.min(normalized.promptIndex, prompts.length - 1));
      setActiveSeconds(normalized.activeSeconds);
    } else {
      const dayBase = selectedDayInfo ? selectedDayProgress.activeSeconds : 0;
      const trackedPrompt = selectedDayInfo ? selectedDayProgress.completedPrompts : 0;
      const resumeIndex = trackedPrompt > 0 && trackedPrompt < prompts.length ? trackedPrompt : 0;
      const fresh: ActiveSession = {
        patternId: activePattern.id, dayNumber: selectedDayInfo?.day ?? 0, promptIndex: resumeIndex,
        activeSeconds: dayBase, baseActiveSeconds: dayBase, startedAt: new Date().toISOString(),
        totalPauseSeconds: 0, pausedAt: null, attempts: 0, correct: 0, almost: 0, slow: 0, combo: 0,
        bestCombo: 0, xpEarned: 0, reactionTimes: [], mistakes: { ...EMPTY_WEAK_POINTS },
        weakBaseline: { ...progress.weakPoints },
      };
      setSession(fresh);
      setSessionPromptIndex(resumeIndex);
      setActiveSeconds(dayBase);
      setProgress((previous) => ({ ...previous, savedSessions: { ...previous.savedSessions, [activePattern.id]: fresh } }));
    }
    resetPrompt("stage-intro");
    setScreen("training");
  }

  function beginCue() {
    setTranscript("");
    setReactionMs(null);
    setSuggestedGrade(null);
    setCountdown(3);
    setPhase("countdown");
  }

  function finishSpeaking() {
    stopRecognition();
    const evaluation = evaluateSpeech(transcript, currentAnswer, activePattern.id);
    const suggested: Grade = reactionMs !== null && reactionMs > 3000 ? "slow" : evaluation.score >= 0.84 ? "correct" : evaluation.score >= 0.62 ? "almost" : "again";
    setSuggestedGrade(suggested);
    setFeedbackIssue(evaluation.issue);
    setPhase("self-grade");
  }

  function grade(gradeValue: Grade) {
    if (!session) return;
    const weak = gradeMeta[gradeValue].weak;
    const nextCombo = gradeValue === "correct" ? session.combo + 1 : 0;
    const earned = gradeValue === "correct" ? 20 + Math.min(20, nextCombo * 2) : gradeValue === "almost" ? 6 : 2;
    const nextSession: ActiveSession = {
      ...session,
      attempts: session.attempts + 1,
      correct: session.correct + (gradeValue === "correct" ? 1 : 0),
      almost: session.almost + (gradeValue === "almost" ? 1 : 0),
      slow: session.slow + (gradeValue === "slow" ? 1 : 0),
      combo: nextCombo,
      bestCombo: Math.max(session.bestCombo, nextCombo),
      xpEarned: session.xpEarned + earned,
      reactionTimes: reactionMs === null ? session.reactionTimes : [...session.reactionTimes, reactionMs],
      mistakes: weak ? { ...session.mistakes, [weak]: session.mistakes[weak] + 1 } : session.mistakes,
    };
    setSession(nextSession);
    setProgress((previous) => {
      let nextWeakPoints = previous.weakPoints;
      if (weak) {
        nextWeakPoints = { ...previous.weakPoints, [weak]: previous.weakPoints[weak] + 1 };
      } else if (nextCombo > 0 && nextCombo % 3 === 0 && currentPrompt.tags?.[0]) {
        const recovered = currentPrompt.tags[0];
        nextWeakPoints = { ...previous.weakPoints, [recovered]: Math.max(0, previous.weakPoints[recovered] - 1) };
      }
      return { ...previous, xp: previous.xp + earned, weakPoints: nextWeakPoints, savedSessions: { ...previous.savedSessions, [activePattern.id]: nextSession } };
    });
    if (gradeValue === "correct") { setPhase("success"); return; }
    setFeedbackIssue(gradeValue === "slow" ? "The sentence may be accurate, but the response started after the 3-second window. Lock the opening chunk first." : feedbackIssue || "Compare your sentence with the model and repair the target chunk.");
    setRepeatCount(0);
    setPhase("correction");
  }

  function markPronunciationIssue() {
    if (session) {
      const next = { ...session, mistakes: { ...session.mistakes, pronunciation: session.mistakes.pronunciation + 1 } };
      setSession(next);
      setProgress((previous) => ({ ...previous, weakPoints: { ...previous.weakPoints, pronunciation: previous.weakPoints.pronunciation + 1 }, savedSessions: { ...previous.savedSessions, [activePattern.id]: next } }));
    }
    setModal("pronunciation");
  }

  function runShadow() {
    speak(currentAnswer, repeatCount === 0 ? 0.78 : repeatCount === 1 ? 0.88 : 0.96);
    setRepeatCount((value) => Math.min(3, value + 1));
  }
  function startTransfer() {
    resetCoachConversation();
    setIsTransfer(true);
    setRepeatCount(0);
    setTranscript("");
    setReactionMs(null);
    setSuggestedGrade(null);
    setFeedbackIssue("");
    setPhase("ready");
  }

  function advancePrompt() {
    if (isTransfer) setToast("Transfer passed. Correction locked.");
    const nextIndex = sessionPromptIndex + 1;
    if (nextIndex >= prompts.length) { completeSession(); return; }
    const changesStage = prompts[nextIndex].stageId !== currentPrompt.stageId;
    setSessionPromptIndex(nextIndex);
    if (session) {
      const nextSession = { ...session, promptIndex: nextIndex, activeSeconds };
      setSession(nextSession);
      setProgress((previous) => ({ ...previous, savedSessions: { ...previous.savedSessions, [activePattern.id]: nextSession } }));
    }
    resetPrompt(changesStage ? "stage-intro" : "ready");
  }

  function completeSession() {
    if (!session) return;
    stopRecognition();
    const endedAt = new Date().toISOString();
    const finalAttempts = Math.max(1, session.attempts);
    const accuracy = Math.round((session.correct / finalAttempts) * 100);
    const averageReaction = session.reactionTimes.length ? Math.round(session.reactionTimes.reduce((sum, value) => sum + value, 0) / session.reactionTimes.length) : null;
    const masteryBefore = progress.mastery[activePattern.id] ?? 0;
    const masteryGain = Math.max(3, Math.round(accuracy / 12) + (averageReaction !== null && averageReaction <= 3000 ? 3 : 0));
    const masteryAfter = clamp(masteryBefore + masteryGain);
    const mainMistake = topWeakPoint(session.mistakes);
    const previousSame = [...progress.history].reverse().find((entry) => entry.patternId === activePattern.id && entry.averageReaction !== null);
    const improvement = previousSame?.averageReaction && averageReaction ? Math.round(((previousSame.averageReaction - averageReaction) / previousSame.averageReaction) * 100) : null;
    const roundActiveSeconds = Math.max(0, activeSeconds - (session.baseActiveSeconds ?? 0));
    const completedAtMs = new Date(endedAt).getTime();
    const entry: HistoryEntry = { id: `session-${completedAtMs}`, patternId: activePattern.id, endedAt, accuracy, averageReaction, activeSeconds: roundActiveSeconds, masteryBefore, masteryAfter, mainMistake };
    const startedAt = new Date(session.startedAt).getTime();
    const wallSeconds = Number.isFinite(startedAt) ? Math.max(roundActiveSeconds, Math.round((completedAtMs - startedAt) / 1000)) : null;
    const dayTargetSeconds = session.dayNumber > 0 ? (progress.dayProgress[String(session.dayNumber)]?.totalSeconds ?? 600 * 60) : 0;
    setResult({ ...entry, dayNumber: session.dayNumber, dayActiveSeconds: activeSeconds, dayTargetSeconds, attempts: session.attempts, correct: session.correct, bestCombo: session.bestCombo, xpEarned: session.xpEarned, improvement, wallSeconds, pauseSeconds: session.totalPauseSeconds });
    const nextPattern = patterns.find((pattern) => pattern.unlockAt <= progress.xp && (progress.mastery[pattern.id] ?? 0) < 70) ?? patterns[(patterns.findIndex((pattern) => pattern.id === activePattern.id) + 1) % patterns.length];
    setProgress((previous) => {
      const nextSavedSessions = { ...previous.savedSessions };
      delete nextSavedSessions[activePattern.id];
      const currentDay = session.dayNumber > 0 ? previous.dayProgress[String(session.dayNumber)] : null;
      const nextDayProgress = session.dayNumber > 0 ? {
        ...previous.dayProgress,
        [String(session.dayNumber)]: {
          activeSeconds,
          totalSeconds: currentDay?.totalSeconds ?? 600 * 60,
          status: activeSeconds >= (currentDay?.totalSeconds ?? 600 * 60) ? "complete" as DayStatus : "paused" as DayStatus,
          completedPrompts: prompts.length,
        },
      } : previous.dayProgress;
      return {
        ...previous,
        sessionNumber: previous.sessionNumber + 1,
        selectedPatternId: session.dayNumber > 0 ? activePattern.id : nextPattern.id,
        streak: previous.lastTrainingDate === getYangonDateKey() ? previous.streak : previous.streak + 1,
        totalActiveSeconds: previous.totalActiveSeconds + roundActiveSeconds,
        mastery: { ...previous.mastery, [activePattern.id]: masteryAfter },
        reviews: [
          ...previous.reviews,
          { id: `${entry.id}-24h`, patternId: activePattern.id, label: activePattern.frame, dueAt: addHours(24), interval: "24h", done: false },
          { id: `${entry.id}-7d`, patternId: activePattern.id, label: activePattern.frame, dueAt: addHours(24 * 7), interval: "7d", done: false },
        ],
        history: [...previous.history, entry], lastTrainingDate: getYangonDateKey(),
        savedSessions: nextSavedSessions,
        dayProgress: nextDayProgress,
      };
    });
    setScreen("results");
  }

  const togglePause = useCallback(() => {
    if (!session) return;
    if (!paused) {
      const pauseNow = new Date();
      setPauseStartedAt(pauseNow.getTime());
      setPaused(true);
      stopRecognition();
      const pausedAt = pauseNow.toISOString();
      const snapshot = { ...session, activeSeconds, promptIndex: sessionPromptIndex, pausedAt };
      setProgress((previous) => ({
        ...previous,
        savedSessions: { ...previous.savedSessions, [activePattern.id]: snapshot },
        dayProgress: session.dayNumber > 0 ? {
          ...previous.dayProgress,
          [String(session.dayNumber)]: {
            ...(previous.dayProgress[String(session.dayNumber)] ?? { totalSeconds: 600 * 60, completedPrompts: 0 }),
            activeSeconds,
            status: "paused",
            completedPrompts: Math.max(previous.dayProgress[String(session.dayNumber)]?.completedPrompts ?? 0, sessionPromptIndex),
          },
        } : previous.dayProgress,
      }));
      return;
    }
    const pauseDelta = pauseStartedAt ? Math.round((new Date().getTime() - pauseStartedAt) / 1000) : 0;
    const next = { ...session, totalPauseSeconds: session.totalPauseSeconds + pauseDelta, pausedAt: null };
    setSession(next);
    setProgress((previous) => ({ ...previous, savedSessions: { ...previous.savedSessions, [activePattern.id]: next } }));
    setPauseStartedAt(null);
    setPaused(false);
  }, [activePattern.id, activeSeconds, pauseStartedAt, paused, session, sessionPromptIndex, stopRecognition]);

  useEffect(() => {
    if (screen !== "training" || !session) return;
    const pauseWhenHidden = () => {
      if (document.visibilityState === "hidden" && !paused) togglePause();
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [paused, screen, session, togglePause]);

  function selectPattern(pattern: PatternDefinition) {
    if (pattern.unlockAt > progress.xp) return;
    resetCoachConversation();
    setProgress((previous) => ({ ...previous, selectedDay: 0, selectedPatternId: pattern.id }));
    setModal(null);
    setToast(`${pattern.title} loaded as the next mission.`);
  }
  function selectDay(dayNumber: number) {
    const nextDay = questDays.find((item) => item.day === dayNumber);
    if (!nextDay) return;
    resetCoachConversation();
    setProgress((previous) => ({ ...previous, selectedDay: dayNumber, selectedPatternId: nextDay.patternId }));
    setScreen("home");
    setResult(null);
    setModal(null);
    setToast(`Day ${dayNumber} loaded. Your saved checkpoint is ready.`);
  }
  async function checkCoachStatus() {
    setCoachStatus("checking");
    try {
      const response = await fetch("/api/coach", { cache: "no-store", credentials: "include" });
      const payload = await response.json() as { status?: CoachStatus; model?: string };
      setCoachStatus(payload.status ?? "error");
      if (payload.model) setCoachModel(payload.model);
    } catch {
      setCoachStatus("error");
    }
  }
  async function askAICoach(question: string) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || !coachPrompt || coachLoading) return;
    if (coachStatus !== "ready") {
      await checkCoachStatus();
      return;
    }

    const history = coachMessages.slice(-6);
    setCoachMessages((previous) => [...previous, { role: "user", content: cleanQuestion }]);
    setCoachQuestion("");
    setCoachLoading(true);
    coachAbortRef.current?.abort();
    const controller = new AbortController();
    coachAbortRef.current = controller;

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: cleanQuestion,
          history,
          context: {
            dayNumber: session?.dayNumber ?? selectedDayInfo?.day ?? 0,
            pattern: activePattern.frame,
            meaning: activePattern.meaning,
            rule: activePattern.rule,
            world: activePattern.world,
            drillType: coachPrompt.kind,
            cue: coachPrompt.cue,
            modelAnswer: coachPrompt.answer,
            hint: coachPrompt.hint,
            learnerAnswer: transcript,
          },
        }),
        signal: controller.signal,
      });
      const payload = await response.json() as { reply?: string; error?: string; status?: CoachStatus; model?: string };
      if (payload.status) setCoachStatus(payload.status);
      if (payload.model) setCoachModel(payload.model);
      if (!response.ok || !payload.reply) throw new Error(payload.error || "Pixel Coach could not answer.");
      setCoachMessages((previous) => [...previous, { role: "assistant", content: payload.reply! }]);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      const message = error instanceof Error ? error.message : "Pixel Coach is temporarily unavailable.";
      setCoachMessages((previous) => [...previous, { role: "assistant", content: `Connection note: ${message}` }]);
    } finally {
      if (coachAbortRef.current === controller) coachAbortRef.current = null;
      setCoachLoading(false);
    }
  }
  function openCoach(topic = "meaning") {
    if (!coachPrompt) return;
    setCoachQuestion("");
    setCoachReply(coachAnswer(topic, coachPrompt, activePattern));
    setModal("coach");
    void checkCoachStatus();
  }
  function markReviewDone(id: string) {
    setProgress((previous) => ({ ...previous, reviews: previous.reviews.map((item) => item.id === id ? { ...item, done: true } : item), xp: previous.xp + 15 }));
  }

  if (!hydrated) {
    return <main className="boot-screen"><div className="boot-mark"><Zap /></div><p>LOADING SPEAKING ENGINE</p><span><i /><i /><i /></span></main>;
  }

  return (
    <main className={`arcade-shell screen-${screen} ${phase === "correction" ? "is-error" : ""}`}>
      <div className="world-grid" /><div className="ambient-orb ambient-cyan" /><div className="ambient-orb ambient-violet" />

      {screen === "home" && (
        <section className="home-screen screen-enter">
          <header className="home-header">
            <GameLogo />
            <nav className="home-nav" aria-label="Game data">
              <button onClick={() => setModal("timetable")}><Clock3 /> 10H Route</button>
              <button onClick={() => setModal("patterns")}><BookOpenCheck /> Pattern Vault</button>
              <button onClick={() => setModal("weak")}><Target /> Weak Points</button>
              <button onClick={() => setModal("reviews")} className={dueReviews.length ? "has-alert" : ""}><TimerReset /> Review Queue {dueReviews.length > 0 && <b>{dueReviews.length}</b>}</button>
              <button className={`voice-lock-button ${selectedVoice ? "is-ready" : "needs-setup"}`} onClick={() => setModal("voice")}><Settings2 /> {selectedVoice ? "US VOICE LOCKED" : "SET VOICE"}</button>
            </nav>
          </header>

          <div className="home-main">
            <section className="quest-map-panel">
              <div className="quest-map-heading"><div><span><Map /> MAKE-UP QUEST MAP</span><h2>Choose the day you want to finish.</h2></div><button onClick={() => setModal("timetable")}><CalendarDays /> VIEW 08:00–21:50 ROUTE</button></div>
              <div className="day-card-row">
                {questDays.map((day) => {
                  const dayData = progress.dayProgress[String(day.day)] ?? { activeSeconds: 0, totalSeconds: 600 * 60, status: "not-started" as DayStatus, completedPrompts: 0 };
                  const percentage = clamp(Math.round((dayData.activeSeconds / dayData.totalSeconds) * 100));
                  return (
                    <button key={day.day} className={`day-card day-${day.color} ${progress.selectedDay === day.day ? "selected" : ""}`} onClick={() => selectDay(day.day)}>
                      <span className="day-card-top"><b>DAY {day.day}</b><em>{dayData.status === "complete" ? "COMPLETE" : dayData.status === "paused" ? "PAUSED" : "NEW"}</em></span>
                      <strong>{day.title}</strong><small>{day.subtitle}</small>
                      <span className="day-progress-copy"><b>{formatTime(dayData.activeSeconds)}</b><i>{percentage}% / 10H</i></span>
                      <span className="day-progress-bar"><i style={{ width: `${percentage}%` }} /></span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="mission-layout">
              <section className="mission-copy-card">
                <div className="mission-kicker"><span>{selectedDayInfo ? `DAY ${selectedDayInfo.day}` : "FREE PLAY"}</span><i /><span>SESSION {String(progress.sessionNumber).padStart(2, "0")}</span></div>
                <div className="mission-title-row"><span className="today-label">TODAY&apos;S PATTERN</span><span className="cefr-badge">{activePattern.cefr} · LV.{activePattern.level}</span></div>
                <h1>{activePattern.frame}</h1>
                <p className="pattern-meaning">{activePattern.meaning}</p>
                <p className="pattern-world">{activePattern.world}</p>

                <div className="mission-console">
                  <Ring value={mastery} label="MASTERY" />
                  <div className="console-stat"><span>DIFFICULTY</span><strong>{activePattern.cefr}</strong><small>{activePattern.level <= 3 ? "FOUNDATION" : activePattern.level <= 7 ? "REAL-LIFE" : "ADVANCED"}</small></div>
                  <div className="console-stat"><span>QUEST CHECKPOINT</span><strong>{selectedDayInfo ? formatTime(selectedDayProgress.activeSeconds) : `${prompts.length} DRILLS`}</strong><small>{selectedDayInfo ? `${Math.round(selectedDayProgress.activeSeconds / 60)} / 600 ACTIVE MIN` : "ONE CUE AT A TIME"}</small></div>
                </div>

                <button className="press-start" onClick={startSession}>
                  <span>{savedSession ? "RESUME MISSION" : selectedDayProgress.completedPrompts > 0 && selectedDayProgress.completedPrompts < prompts.length ? "CONTINUE CHECKPOINT" : selectedDayProgress.completedPrompts >= prompts.length ? "START NEXT ROUND" : "PRESS TO START"}</span><span className="start-arrow"><Play /></span><span className="scan-line" />
                </button>
                <p className="start-note"><ShieldCheck /> One pattern · one cue · three-second reaction · instant repair.</p>
              </section>

              <aside className="pixel-coach-home">
                <div className="coach-status"><i /> PIXEL COACH READY</div>
                <div className="coach-speech">
                  <span>{selectedDayInfo ? `Day ${selectedDayInfo.day} checkpoint found.` : "Free-play pattern loaded."}</span>
                  <strong>{selectedDayProgress.status === "paused" ? "Your progress is safe. We continue—never skip." : "I explain meaning, chunks, grammar, and pronunciation on every cue."}</strong>
                </div>
                <CoachAvatar className="home-coach-avatar" alt="Pixel Coach" eager />
                <div className="coach-buttons"><button onClick={() => openCoach("meaning")}><MessageCircle /> AI COACH</button><button onClick={() => setModal("voice")}><Volume2 /> HEAR VOICE</button></div>
                <div className={`voice-chip ${selectedVoice ? "ready" : "warning"}`}><span>{selectedVoice ? "AMERICAN MALE VOICE" : "VOICE SETUP NEEDED"}</span><strong>{selectedVoice?.name ?? "No verified en-US male voice found"}</strong></div>
              </aside>
            </div>
          </div>

          <footer className="home-footer">
            <div><Flame /><span>STREAK<strong>{progress.streak}</strong></span></div>
            <div><Star /><span>XP<strong>{progress.xp.toLocaleString()}</strong></span></div>
            <div><Trophy /><span>PLAYER LEVEL<strong>{playerLevel}</strong></span></div>
            <button onClick={() => setModal("method")}><CircleHelp /> FSI METHOD</button>
          </footer>
        </section>
      )}

      {screen === "training" && session && currentPrompt && (
        <section className="training-screen screen-enter">
          <header className="training-hud">
            <button className="hud-action" onClick={togglePause}><Pause /> Pause</button>
            <div className="stage-rail" aria-label={`Stage ${currentStageIndex + 1} of ${stages.length}`}>
              {stages.map((stage, index) => (
                <span key={stage.id} className={index < currentStageIndex ? "done" : index === currentStageIndex ? "current" : ""}>
                  <i>{index < currentStageIndex ? <Check /> : index + 1}</i><b>{stage.title}</b>
                </span>
              ))}
            </div>
            <div className="hud-numbers"><span className="hud-day">{session.dayNumber > 0 ? `DAY ${session.dayNumber}` : "FREE"}</span><span><Clock3 /> {formatTime(activeSeconds)}</span><span className="combo"><Zap /> ×{session.combo}</span><span><Star /> {progress.xp}</span></div>
          </header>

          {phase === "stage-intro" ? (
            <div className="stage-portal screen-enter" key={currentStage.id}>
              <CoachAvatar className="portal-coach" alt="Pixel Coach" />
              <span className="portal-code">{currentStage.code}</span><div className="portal-icon"><span>{currentStageIndex + 1}</span></div>
              <h2>{currentStage.title}</h2><p>{currentStage.subtitle}</p>
              <div className="method-chip"><BrainCircuit /> {currentStage.method}</div>
              <button className="primary-game-button" onClick={() => setPhase("ready")}>ENTER STAGE <ArrowRight /></button>
            </div>
          ) : (
            <div className="focus-chamber">
              <div className="focus-meta"><span>{session.dayNumber > 0 ? `DAY ${session.dayNumber} · ` : ""}{currentStage.code} · LEVEL {currentPrompt.level}</span><span>{currentPrompt.kind}</span><span>{sessionPromptIndex + 1} / {prompts.length}</span></div>

              <article className={`cue-card phase-${phase}`} key={`${currentPrompt.id}-${isTransfer ? "transfer" : "main"}`}>
                {isTransfer && <div className="transfer-banner"><Zap /> TRANSFER TEST · NEW CUE</div>}
                {phase === "countdown" ? (
                  <div className="countdown-view" aria-live="assertive"><span>SPEAK IN</span><div className="countdown-reactor"><strong key={countdown}>{countdown}</strong><i /></div><p>Don&apos;t build it in Chinese.</p></div>
                ) : phase === "success" ? (
                  <div className="success-view">
                    <div className="success-burst"><Check /></div><span>REACTION LOCKED</span><h2>Correct ✓</h2>
                    <p>{reactionMs === null ? "Clean pattern response." : `Reaction ${formatReaction(reactionMs)} · combo ×${session.combo}`}</p>
                    <div className="combo-energy"><i style={{ width: `${Math.min(100, session.combo * 10)}%` }} /></div>
                    <button className="primary-game-button" onClick={advancePrompt}>NEXT CUE <ArrowRight /></button>
                  </div>
                ) : phase === "correction" ? (
                  <div className="correction-view">
                    <div className="correction-label"><RotateCcw /> CORRECTION LOOP</div><h2>Freeze. Fix the chunk.</h2><p className="coach-error">{feedbackIssue}</p>
                    {transcript && <div className="heard-line"><span>YOU SAID</span><p>{transcript}</p></div>}
                    <div className="model-line"><span>CLEAN MODEL</span><p>{currentAnswer}</p><button onClick={() => speak(currentAnswer, 0.82)}><Volume2 /> Hear it</button></div>
                    <div className="repeat-track">{[0, 1, 2].map((index) => <i key={index} className={index < repeatCount ? "done" : ""}>{index < repeatCount ? <Check /> : index + 1}</i>)}<span>SHADOW ×3</span></div>
                    {repeatCount < 3 ? <button className="primary-game-button correction-button" onClick={runShadow}><Headphones /> SHADOW {repeatCount + 1} / 3</button> : <button className="primary-game-button" onClick={startTransfer}><Zap /> RUN TRANSFER TEST</button>}
                  </div>
                ) : (
                  <>
                    <div className="cue-topline"><span>{phase === "self-grade" ? "RATE YOUR RESPONSE" : currentPrompt.instruction}</span><div><button className="ask-coach-button" onClick={() => openCoach("meaning")}><CoachAvatar alt="" /> Ask Pixel</button><button onClick={() => setModelRevealed((value) => !value)} title="Use only if stuck"><CircleHelp /> Hint</button></div></div>
                    <div className="cue-content">
                      <p className="cue-language">{currentPrompt.stageId === "lock" ? "AUDIO MODEL" : currentCue?.match(/[\u4e00-\u9fff]/) ? "CHINESE CUE" : "SPEAKING CUE"}</p>
                      {currentPrompt.stageId === "lock" && !modelRevealed ? (
                        <button className="listen-gate" onClick={() => { setModelRevealed(true); speak(currentAnswer, 0.86); }}><span><Headphones /></span><strong>LISTEN FIRST</strong><small>Meaning → rhythm → words</small></button>
                      ) : <h2>{currentPrompt.stageId === "lock" ? currentAnswer : currentCue}</h2>}
                      {modelRevealed && currentPrompt.stageId !== "lock" && <div className="hint-box"><span>CHUNK MAP</span>{currentPrompt.hint ?? activePattern.rule}</div>}
                    </div>

                    {phase === "ready" && (
                      <div className="response-launch">
                        {currentPrompt.stageId === "lock" && modelRevealed && <button className="audio-model-button" onClick={() => speak(currentAnswer, 0.9)}><Volume2 /> Replay model</button>}
                        <button className="react-button" onClick={beginCue} disabled={currentPrompt.stageId === "lock" && !modelRevealed}><span><Mic /></span><strong>START 3-SECOND REACTION</strong><small>Speak before you edit</small></button>
                      </div>
                    )}

                    {phase === "speak" && (
                      <div className="speaking-zone">
                        <div className={`mic-orbit ${listening ? "is-listening" : ""}`}><Mic /><i /><i /></div>
                        <div><strong>{currentPrompt.kind === "Voice diary" ? formatTime(diarySeconds) : "SPEAK NOW"}</strong><span>{recognitionAvailable ? "Live speech check is listening" : "Speak aloud, then self-grade"}</span></div>
                        {transcript && <p className="live-transcript">{transcript}</p>}
                        <button className="finish-speaking" onClick={finishSpeaking}>I&apos;VE SPOKEN <Check /></button>
                      </div>
                    )}

                    {phase === "self-grade" && (
                      <div className="grade-zone">
                        {transcript ? <div className="transcript-check"><span>VOICE CHECK {suggestedGrade && <>· SUGGESTS {gradeMeta[suggestedGrade].label.toUpperCase()}</>}</span><p>{transcript}</p></div> : <p className="manual-note">No transcript available. Use honest self-grading—your spoken response still counts.</p>}
                        <div className="grade-grid">{(Object.keys(gradeMeta) as Grade[]).map((gradeValue) => <button key={gradeValue} className={`grade-${gradeValue} ${suggestedGrade === gradeValue ? "suggested" : ""}`} onClick={() => grade(gradeValue)}><b>{gradeMeta[gradeValue].symbol}</b><span>{gradeMeta[gradeValue].label}</span></button>)}</div>
                      </div>
                    )}
                  </>
                )}
              </article>

              {phase !== "countdown" && phase !== "correction" && phase !== "success" && (
                <div className="focus-footer"><button onClick={markPronunciationIssue}><AudioLines /> Pronunciation feels unstable</button><div className="overall-progress"><i style={{ width: `${((sessionPromptIndex + (phase === "success" ? 1 : 0)) / prompts.length) * 100}%` }} /></div><span>{sessionAccuracy}% accuracy</span></div>
              )}
            </div>
          )}

          {paused && (
            <div className="pause-overlay screen-enter"><div className="pause-card"><span><Pause /></span><p>MISSION PAUSED</p><h2>Your place is saved.</h2><div><Clock3 /> Active time {formatTime(activeSeconds)}</div><button className="primary-game-button" onClick={togglePause}><Play /> RESUME</button><button className="quiet-link" onClick={() => { setScreen("home"); setPaused(false); }}>RETURN TO HQ</button></div></div>
          )}
        </section>
      )}

      {screen === "results" && result && (
        <section className="result-screen screen-enter">
          <div className="result-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          <div className="result-top"><span>{result.dayNumber > 0 && result.dayActiveSeconds >= result.dayTargetSeconds ? `DAY ${result.dayNumber} COMPLETE` : "TRAINING ROUND COMPLETE"}</span><h1>PATTERN UPGRADED</h1><p>{patterns.find((pattern) => pattern.id === result.patternId)?.frame}</p></div>
          <div className="result-main"><Ring value={result.masteryAfter} label="MASTERY" size="large" /><div className="mastery-jump"><span>{result.masteryBefore}%</span><i><ArrowRight /></i><strong>{result.masteryAfter}%</strong></div></div>
          <div className="result-grid">
            <div><Target /><span>ACCURACY</span><strong>{result.accuracy}%</strong><small>{result.correct} / {Math.max(1, result.attempts)} passes</small></div>
            <div><Gauge /><span>AVG. REACTION</span><strong>{formatReaction(result.averageReaction)}</strong><small>{result.improvement === null ? "Baseline saved" : `${result.improvement >= 0 ? "+" : ""}${result.improvement}% vs last run`}</small></div>
            <div><Zap /><span>BEST COMBO</span><strong>×{result.bestCombo}</strong><small>+{result.xpEarned} XP earned</small></div>
            <div><Clock3 /><span>ACTIVE TIME</span><strong>{formatTime(result.activeSeconds)}</strong><small>{result.wallSeconds === null ? "Wall time unavailable" : `Wall ${formatTime(result.wallSeconds)} · pause ${formatTime(result.pauseSeconds)}`}</small></div>
          </div>
          <div className="result-insight"><div><BrainCircuit /><span>MAIN WEAK POINT</span><strong>{result.mainMistake ? weakLabels[result.mainMistake] : "No dominant error"}</strong></div><div><TimerReset /><span>SPACED REVIEW</span><strong>Tomorrow · then in 7 days</strong></div></div>
          {result.dayNumber > 0 && <div className="result-day-progress"><span><CalendarDays /> DAY {result.dayNumber} CHECKPOINT</span><strong>{formatTime(result.dayActiveSeconds)} <i>/ {formatTime(result.dayTargetSeconds)}</i></strong><div><i style={{ width: `${clamp((result.dayActiveSeconds / result.dayTargetSeconds) * 100)}%` }} /></div><p>{result.dayActiveSeconds >= result.dayTargetSeconds ? "All 600 active minutes logged. You may move to the next Day." : `${Math.ceil((result.dayTargetSeconds - result.dayActiveSeconds) / 60)} active minutes remain. Day ${result.dayNumber} stays Paused—your next start continues here.`}</p></div>}
          <div className="result-actions"><button className="primary-game-button" onClick={() => { setScreen("home"); setResult(null); setSession(null); }}>BACK TO QUEST MAP <ArrowRight /></button><button className="secondary-game-button" onClick={() => { setProgress((previous) => ({ ...previous, selectedPatternId: result.patternId })); setResult(null); setSession(null); setScreen("home"); }}>RUN ANOTHER ROUND</button></div>
        </section>
      )}

      {modal && (
        <div className="modal-backdrop screen-enter" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <section className={`game-modal modal-${modal}`} role="dialog" aria-modal="true" aria-label={modal}>
            <header><div><span>PLAYER SYSTEM</span><h2>{modal === "patterns" ? "Pattern Vault" : modal === "weak" ? "Weak Points" : modal === "reviews" ? "Review Queue" : modal === "pronunciation" ? "Pronunciation Lab" : modal === "coach" ? "Pixel AI Coach" : modal === "voice" ? "American Voice Lock" : modal === "timetable" ? "10-Hour Quest Route" : "FSI Method Core"}</h2></div><button onClick={() => setModal(null)} aria-label="Close"><X /></button></header>

            {modal === "patterns" && (
              <div className="pattern-vault">{patterns.map((pattern) => {
                const locked = pattern.unlockAt > progress.xp;
                const value = progress.mastery[pattern.id] ?? 0;
                return <button key={pattern.id} className={`${pattern.id === activePattern.id ? "selected" : ""} ${locked ? "locked" : ""}`} onClick={() => selectPattern(pattern)} disabled={locked}><span className="vault-level">{locked ? <Lock /> : `LV.${pattern.level}`}</span><span className="vault-copy"><small>{locked ? `UNLOCK AT ${pattern.unlockAt.toLocaleString()} XP` : `${pattern.cefr} · ${pattern.world}`}</small><strong>{pattern.frame}</strong><em>{pattern.title}</em></span><span className="vault-mastery"><b>{value}%</b><i><u style={{ width: `${value}%` }} /></i></span>{!locked && <ChevronRight />}</button>;
              })}</div>
            )}

            {modal === "weak" && (
              <div className="weak-panel"><p>The engine adds a short Micro Drill for your strongest recurring error. Lower is better.</p>{(Object.keys(progress.weakPoints) as WeakPoint[]).map((key) => <div key={key} className="weak-row"><span>{weakLabels[key]}</span><div><i style={{ width: `${Math.min(100, progress.weakPoints[key] * 10)}%` }} /></div><strong>{progress.weakPoints[key]}</strong></div>)}<div className="weak-callout"><Sparkles /><p><span>NEXT AUTO MICRO DRILL</span><strong>{topWeakPoint(progress.weakPoints) ? weakLabels[topWeakPoint(progress.weakPoints)!] : "Balanced review"}</strong></p></div></div>
            )}

            {modal === "reviews" && (
              <div className="review-panel">{progress.reviews.filter((item) => !item.done).length === 0 ? <div className="empty-state"><CheckCircle2 /><h3>Queue cleared</h3><p>Your next review will appear after a completed session.</p></div> : progress.reviews.filter((item) => !item.done).map((item) => {
                const due = new Date(item.dueAt).getTime() <= clockNow;
                return <div className={`review-row ${due ? "due" : ""}`} key={item.id}><span><TimerReset /></span><p><small>{item.interval} REVIEW · {due ? "DUE NOW" : new Date(item.dueAt).toLocaleDateString()}</small><strong>{item.label}</strong></p><button onClick={() => markReviewDone(item.id)}>{due ? "MARK DONE" : "EARLY REVIEW"}</button></div>;
              })}</div>
            )}

            {modal === "method" && (
              <div className="method-panel">
                <div className="method-split"><span>HISTORICAL FSI COURSE CORE</span><p>Dialogue and meaning → mimicry and memorization → pattern manipulation → response and recombination.</p></div>
                <div className="method-flow">{stages.map((stage, index) => <div key={stage.id}><i>{index + 1}</i><p><strong>{stage.title}</strong><span>{stage.method}</span></p></div>)}</div>
                <div className="method-note"><ShieldCheck /><p><strong>Method honesty</strong><span>The drill families come from historical FSI audio-lingual courses. The 3-second timer, XP, speech check, adaptive weak-point routing, and game UI are this app&apos;s learning layer—not a claim that FSI published this exact software algorithm.</span></p></div>
                <div className="source-links"><a href="https://www.state.gov/national-foreign-affairs-training-center/foreign-language-training" target="_blank" rel="noreferrer">U.S. State Department FSI <ArrowRight /></a><a href="https://fam.state.gov/FAM/13FAH01/13FAH010220.html" target="_blank" rel="noreferrer">Foreign Affairs Manual <ArrowRight /></a><a href="https://eric.ed.gov/?id=ED056583" target="_blank" rel="noreferrer">1961 FSI course record <ArrowRight /></a></div>
              </div>
            )}

            {modal === "pronunciation" && currentPrompt && (
              <div className="pronunciation-panel">
                <div className="pronunciation-model"><span>CLEAN AMERICAN MODEL</span><p>{currentAnswer}</p><div><button onClick={() => speak(currentAnswer, 0.72)}><Volume2 /> Slow</button><button onClick={() => speak(currentAnswer, 0.94)}><Play /> Natural</button></div></div>
                <div className="build-up"><span>BACKWARD BUILD-UP</span>{buildBackward(currentAnswer).map((line, index) => <button key={line} onClick={() => speak(line, index === 0 ? 0.78 : 0.86)}><i>{index + 1}</i><p>{line}</p><Volume2 /></button>)}</div>
                <div className="sound-focus"><AudioLines /><p><strong>Sound-focus pause</strong><span>{pronunciationNotes[activePattern.id] ?? "Hear the full model slowly, isolate the difficult contrast, then shadow at natural speed three times."}</span></p></div>
                <button className="primary-game-button" onClick={() => setModal(null)}>RETURN TO CURRENT CUE</button>
              </div>
            )}

            {modal === "coach" && coachPrompt && (
              <div className="coach-panel">
                <div className="coach-character">
                  <span className={`coach-online coach-status-${coachStatus}`}><i /> {coachStatus === "ready" ? "REAL AI ONLINE" : coachStatus === "checking" ? "CHECKING AI" : "PIXEL GUIDE READY"}</span>
                  <CoachAvatar alt="Pixel Coach" eager />
                </div>
                <div className="coach-chat">
                  <div className="coach-context"><span>CURRENT CUE</span><strong>{coachPrompt.cue}</strong></div>
                  <div className={`ai-status-card ai-${coachStatus}`}>
                    <div><BrainCircuit /><p><span>REAL AI COACH</span><strong>{coachStatus === "ready" ? `${coachModel} · understands this cue and your follow-up` : coachStatus === "checking" ? "Checking the private AI connection…" : coachStatus === "setup" ? "One-time owner setup is still required" : coachStatus === "signin" ? "Sign in to unlock your private AI Coach" : coachStatus === "forbidden" ? "Private AI access is owner-only" : "AI connection check failed"}</strong></p></div>
                    {coachStatus === "signin" && <a href="/signin-with-chatgpt?return_to=%2F" target="_top">SIGN IN WITH CHATGPT <ArrowRight /></a>}
                    {coachStatus === "setup" && <small>The intelligent endpoint is installed, but no model key is stored in Site Settings yet. The public page never receives that secret.</small>}
                    {coachStatus === "error" && <button onClick={() => void checkCoachStatus()}><RotateCcw /> RETRY CHECK</button>}
                  </div>

                  <div className="ai-thread" aria-live="polite">
                    {coachMessages.length === 0 ? (
                      <div className="ai-welcome"><Sparkles /><p><strong>Ask naturally in 中文 or English.</strong><span>I can explain meaning, correct your exact sentence, compare two phrases, or build a pronunciation drill without leaving this cue.</span></p></div>
                    ) : coachMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`ai-message ai-message-${message.role}`}><span>{message.role === "user" ? "YOU" : "PIXEL AI"}</span><p>{message.content}</p></div>
                    ))}
                    {coachLoading && <div className="ai-thinking"><i /><i /><i /><span>Pixel is thinking with your current drill…</span></div>}
                  </div>

                  <div className="coach-quick-actions ai-actions">
                    {[
                      { key: "meaning", label: "什么意思", question: "Explain what this sentence means naturally in this situation. Show the most useful chunk." },
                      { key: "grammar", label: "Why this grammar?", question: "Explain the grammar in this exact sentence and warn me about the most likely mistake." },
                      { key: "pronunciation", label: "怎么读", question: "Give me American pronunciation help: stress, thought groups, backward build-up, then one shadowing line." },
                      { key: "correct", label: "Correct my answer", question: transcript ? `Correct what I just said: ${transcript}` : "Tell me what a strong answer should sound like, then give me one transfer cue." },
                    ].map((item) => (
                      <button key={item.key} disabled={coachStatus !== "ready" || coachLoading} onClick={() => void askAICoach(item.question)}>{item.label}</button>
                    ))}
                  </div>
                  <form className="coach-question" onSubmit={(event) => { event.preventDefault(); void askAICoach(coachQuestion); }}>
                    <input value={coachQuestion} onChange={(event) => setCoachQuestion(event.target.value)} placeholder="Ask anything about this cue… / 为什么用 -ing？" aria-label="Question for the AI Pixel Coach" maxLength={900} disabled={coachStatus !== "ready" || coachLoading} />
                    <button type="submit" disabled={coachStatus !== "ready" || coachLoading || !coachQuestion.trim()}><MessageCircle /> {coachLoading ? "WAIT" : "ASK AI"}</button>
                  </form>

                  <details className="instant-guide" open={coachStatus !== "ready"}>
                    <summary>BUILT-IN QUICK GUIDE <small>offline · not AI</small></summary>
                    <div className="coach-reply"><span>FIXED REFERENCE</span><p>{coachReply || coachAnswer("meaning", coachPrompt, activePattern)}</p></div>
                    <div className="coach-quick-actions">
                      {[{ key: "meaning", label: "Meaning" }, { key: "grammar", label: "Grammar" }, { key: "chunks", label: "Chunks" }, { key: "situation", label: "Situation" }, { key: "pronunciation", label: "Pronunciation" }, { key: "example", label: "Example" }].map((item) => (
                        <button key={item.key} onClick={() => setCoachReply(coachAnswer(item.key, coachPrompt, activePattern))}>{item.label}</button>
                      ))}
                    </div>
                  </details>
                  <div className="coach-action-row"><button onClick={() => speak(coachPrompt.answer, 0.76)}><Volume2 /> SLOW US MODEL</button><button onClick={() => speak(coachPrompt.answer, 0.94)}><Play /> NATURAL US MODEL</button><button onClick={() => setModal("pronunciation")}><AudioLines /> BUILD-UP LAB</button></div>
                </div>
              </div>
            )}

            {modal === "voice" && (
              <div className="voice-panel">
                <div className="voice-lock-summary">
                  <div><Volume2 /><span>STRICT PLAYBACK POLICY</span></div>
                  <h3>{selectedVoice ? "One verified en-US male voice is locked." : "No verified en-US male voice is available yet."}</h3>
                  <p>The app never falls back to another accent. Every model, correction, backward build-up, and shadowing line uses the single voice you choose below.</p>
                  <button className="sound-toggle" onClick={() => setSoundOn((value) => !value)}>{soundOn ? <><Volume2 /> SOUND ON</> : <><X /> SOUND OFF</>}</button>
                </div>
                {usMaleVoices.length > 0 ? (
                  <div className="voice-list">
                    {usMaleVoices.map((voice) => (
                      <button key={voice.voiceURI} className={selectedVoice?.voiceURI === voice.voiceURI ? "selected" : ""} onClick={() => { setProgress((previous) => ({ ...previous, voiceURI: voice.voiceURI })); previewVoice(voice); }}>
                        <span><Headphones /></span><p><strong>{voice.name}</strong><small>{voice.lang} · male voice · {voice.localService ? "on device" : "online"}</small></p><em>{selectedVoice?.voiceURI === voice.voiceURI ? <Check /> : <Play />}</em>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="voice-empty">
                    <CoachAvatar alt="Pixel Coach waiting for an American voice" />
                    <div><strong>Install or enable an American male system voice.</strong><p>Recommended names: Microsoft Guy, David, Mark, or another voice whose language is exactly <b>en-US</b>. Then reload this page. Audio stays paused until a verified voice appears, so an Indian or other accent cannot slip in.</p></div>
                  </div>
                )}
              </div>
            )}

            {modal === "timetable" && (
              <div className="timetable-panel">
                <div className="route-summary"><div><span>{selectedDayInfo ? `DAY ${selectedDayInfo.day}` : "FREE PLAY"}</span><strong>{activePattern.frame}</strong></div><div><b>600</b><span>ACTIVE MINUTES</span></div><div><b>14</b><span>TRAINING BLOCKS</span></div></div>
                <p className="route-note"><Clock3 /> Exact route: 08:00–21:50. The gaps are recovery, lunch, movement, and dinner; they do not count as active training. Keep one core pattern throughout the day.</p>
                <div className="timeline-route">
                  {timetable.map((block, index) => (
                    <article key={block.time}><span className="timeline-node">{String(index + 1).padStart(2, "0")}</span><div className="timeline-time"><strong>{block.time}</strong><small>{block.minutes} MIN</small></div><div className="timeline-copy"><strong>{block.title}</strong><span>{block.method}</span></div>{index === timetable.length - 1 && <em>FINAL</em>}</article>
                  ))}
                </div>
                <button className="primary-game-button" onClick={() => { setModal(null); startSession(); }}><Play /> START CURRENT CHECKPOINT</button>
              </div>
            )}
          </section>
        </div>
      )}

      {toast && <div className="game-toast"><CheckCircle2 /> {toast}</div>}
    </main>
  );
}
