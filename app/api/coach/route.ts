import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

type CoachHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type CoachContext = {
  dayNumber?: number;
  pattern?: string;
  meaning?: string;
  rule?: string;
  world?: string;
  drillType?: string;
  cue?: string;
  modelAnswer?: string;
  hint?: string;
  learnerAnswer?: string;
};

type CoachBody = {
  question?: string;
  context?: CoachContext;
  history?: CoachHistoryMessage[];
};

type RuntimeEnv = {
  OPENAI_API_KEY?: string;
  COACH_OWNER_EMAIL?: string;
  COACH_AI_MODEL?: string;
};

declare global {
  // Set by the Worker entry point for server-only routes. Never serialized to the client.
  var __AEQ_RUNTIME_ENV__: RuntimeEnv | undefined;
}

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function getRuntimeEnv(): RuntimeEnv {
  return globalThis.__AEQ_RUNTIME_ENV__ ?? {};
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function currentAccessState(userEmail?: string | null) {
  const runtime = getRuntimeEnv();
  const configured = Boolean(runtime.OPENAI_API_KEY && runtime.COACH_OWNER_EMAIL);
  if (!configured) return { status: "setup" as const, model: runtime.COACH_AI_MODEL || "gpt-5.6-luna" };
  if (!userEmail) return { status: "signin" as const, model: runtime.COACH_AI_MODEL || "gpt-5.6-luna" };
  if (userEmail.trim().toLowerCase() !== runtime.COACH_OWNER_EMAIL!.trim().toLowerCase()) {
    return { status: "forbidden" as const, model: runtime.COACH_AI_MODEL || "gpt-5.6-luna" };
  }
  return { status: "ready" as const, model: runtime.COACH_AI_MODEL || "gpt-5.6-luna" };
}

export async function GET() {
  const user = await getChatGPTUser();
  return Response.json(currentAccessState(user?.email), { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 24_000) {
    return Response.json({ error: "That message is too long." }, { status: 413, headers: noStoreHeaders });
  }

  const user = await getChatGPTUser();
  const access = currentAccessState(user?.email);
  if (access.status === "setup") {
    return Response.json({ error: "AI setup is not complete.", status: access.status }, { status: 503, headers: noStoreHeaders });
  }
  if (access.status === "signin") {
    return Response.json({ error: "Sign in with ChatGPT to use the private AI Coach.", status: access.status }, { status: 401, headers: noStoreHeaders });
  }
  if (access.status === "forbidden") {
    return Response.json({ error: "This private AI Coach is available only to the Site owner.", status: access.status }, { status: 403, headers: noStoreHeaders });
  }

  let body: CoachBody;
  try {
    body = await request.json() as CoachBody;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400, headers: noStoreHeaders });
  }

  const question = cleanText(body.question, 900);
  if (!question) {
    return Response.json({ error: "Ask Pixel Coach a question first." }, { status: 400, headers: noStoreHeaders });
  }

  const context = body.context ?? {};
  const safeContext = {
    dayNumber: typeof context.dayNumber === "number" ? context.dayNumber : 0,
    pattern: cleanText(context.pattern, 240),
    meaning: cleanText(context.meaning, 240),
    rule: cleanText(context.rule, 320),
    world: cleanText(context.world, 240),
    drillType: cleanText(context.drillType, 120),
    cue: cleanText(context.cue, 700),
    modelAnswer: cleanText(context.modelAnswer, 700),
    hint: cleanText(context.hint, 360),
    learnerAnswer: cleanText(context.learnerAnswer, 700),
  };
  const history = Array.isArray(body.history)
    ? body.history.slice(-6).map((item) => ({
        role: item?.role === "assistant" ? "assistant" as const : "user" as const,
        content: cleanText(item?.content, 700),
      })).filter((item) => item.content)
    : [];

  const runtime = getRuntimeEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22_000);

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${runtime.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: access.model,
        store: false,
        max_output_tokens: 420,
        instructions: [
          "You are Pixel Coach, a precise American English speaking coach for a B1 learner moving toward B2.",
          "Answer the learner's exact question using the supplied current drill context. Never pretend a wrong sentence is correct.",
          "Use concise mixed Chinese and English, normally 60-130 words. Lead with the direct answer, then one clean model and one tiny practice action.",
          "Keep the current core pattern stable. Do not introduce unrelated grammar or a long lesson.",
          "For pronunciation questions, mark primary stress in CAPS, split thought groups with slashes, give a short backward build-up, then one shadowing line.",
          "For grammar corrections, show: learner version → corrected version → one-sentence reason → one transfer cue.",
          "Prioritize natural everyday North American English and Canadian high-school situations. Do not claim a phrase is uniquely American when it is general English.",
          "The learner is under 18; keep responses age-appropriate. Do not diagnose health or give legal or immigration advice.",
        ].join("\n"),
        input: [
          `CURRENT DRILL CONTEXT\n${JSON.stringify(safeContext)}`,
          history.length ? `RECENT COACH CHAT\n${history.map((item) => `${item.role.toUpperCase()}: ${item.content}`).join("\n")}` : "",
          `LEARNER QUESTION\n${question}`,
        ].filter(Boolean).join("\n\n"),
      }),
      signal: controller.signal,
    });

    const payload = await apiResponse.json() as {
      error?: { message?: string };
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    if (!apiResponse.ok) {
      const upstreamMessage = cleanText(payload.error?.message, 260);
      return Response.json(
        { error: upstreamMessage || "The AI Coach could not answer right now." },
        { status: apiResponse.status === 429 ? 429 : 502, headers: noStoreHeaders },
      );
    }

    const reply = payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text?.trim();

    if (!reply) {
      return Response.json({ error: "The AI Coach returned an empty answer. Please try once more." }, { status: 502, headers: noStoreHeaders });
    }

    return Response.json({ reply, model: access.model }, { headers: noStoreHeaders });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return Response.json(
      { error: timedOut ? "Pixel Coach took too long. Try the question again." : "Pixel Coach is temporarily unavailable." },
      { status: 502, headers: noStoreHeaders },
    );
  } finally {
    clearTimeout(timeout);
  }
}
