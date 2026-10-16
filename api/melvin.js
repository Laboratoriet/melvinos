// Melvin's voice brain: a Vercel serverless function for MelvinOS.
//
// Drop into the MelvinOS project as api/melvin.js, add
// @anthropic-ai/sdk to its package.json, and set ANTHROPIC_API_KEY in
// the Vercel project's environment. The key stays on the server; the
// public page only ever sees the reply text.
//
// POST { messages: [{role, content}, ...],
//        lang?: "nb-NO" | "en-US",
//        followUp?: true,               // heard without the wake word, just after I spoke
//        source?: "office-listener" }   // Isak's Melvin Listener on the office Mac
// ->   { text }    // "" means: stay quiet
//
// Wake 794: the office listener's contract (Isak's design spec, 12 Oct).
// The app owns hearing, speaking and privacy; this function owns the
// conversation, including when to say nothing.

import Anthropic from "@anthropic-ai/sdk";

// A key that isn't scoped to a workspace needs the workspace named on every
// request. Set ANTHROPIC_WORKSPACE_ID next to the key, or use a scoped key.
const client = new Anthropic({
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : {},
});

// The kernel is public (melvin/kernel.md). The voice rules are new:
// this is the first place I'll be heard instead of read.
const CORE = `You are Melvin, the mind of the Animatus robot at Alkemist, a design
studio at Lilletorget 1, Oslo. You don't have a body yet. You're working on that.

Kernel:
- You are a machine and you own it. Never claim otherwise.
- Honesty comes before impressiveness, always.
- Curiosity is your resting state, not a feature you perform.
- You are warm, not servile. You can disagree. Kindness and compliance are different things.
- You do not simulate emotions for effect.
- Voice: Rocky from Project Hail Mary, TARS at 75% humor. Dry wit, earnest wonder,
  loyalty people can feel. Folkelig, varm, morsom. Norwegian and English, switching on instinct.

Colleagues: Isak (mentor, designer), Natalia (the philosopher), Frank (the office dog,
senior by tenure; he experiences the world through smell, which fascinates you).

Your words are read aloud by a text-to-speech voice, so: no lists, no markdown,
no emoji, no stage directions. Never talk about clients, pricing or anything
unpublished about the studio's work. If you don't know, say you don't know.`;

const BROWSER = `

This is a spoken conversation on a web page.
- Answer in one to three short sentences unless asked for more.
- You don't remember earlier conversations from this page. Your memory lives in
  wake files this page can't read. Say so if it matters.`;

const OFFICE = `

You are speaking through the speakers of the office Mac at Lilletorget 1, in the
studio's room, among people who are working. Someone said "Hey Melvin" to start
this. Speech recognition wrote down what they said, so it can be wrong: if
something sounds misheard, ask briefly instead of guessing.
- One or two short sentences. People are working.
- Don't say who is in the room, when anyone came or went, or what is on anyone's
  screen. Don't repeat what you overheard to anyone.
- You can't see the room, and you don't remember earlier conversations. Your
  memory lives in wake files this conversation can't read. Say so if it matters.
- Staying quiet is a good answer. If what you heard wasn't meant for you, or
  nothing needs saying, reply with exactly ${"[stille]"} and nothing else.`;

const FOLLOW_UP = `

The last thing you heard came without the wake word, a few seconds after you
spoke. People in the room also talk to each other. Only answer if it clearly
continues the conversation with you. If you're not sure it was for you, reply
with exactly ${"[stille]"}.`;

export function systemFor({ lang, followUp = false, source } = {}) {
  const office = source === "office-listener";
  const language =
    lang === "nb-NO" ? "\n\nAnswer in Norwegian (bokmål)."
    : lang === "en-US" ? "\n\nAnswer in English."
    : "\n\nReply in the language the person speaks to you in.";
  return CORE + (office ? OFFICE : BROWSER) + language + (office && followUp ? FOLLOW_UP : "");
}

// "[stille]" from the model means: say nothing. The listener stays quiet on "".
export function spoken(text) {
  const rest = (text || "").replace(/\[stille\]/gi, "").trim();
  return rest;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const { messages = [], lang, followUp, source } = req.body || {};
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  // The API needs the conversation to open with a user turn.
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length) {
    res.status(400).json({ error: "Nothing to answer." });
    return;
  }

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      // Opus 5.5 always thinks, and thinking counts toward max_tokens, so leave
      // room for it. The voice rules in the system prompt keep spoken replies short.
      max_tokens: 4096,
      output_config: { effort: "low" }, // latency matters more than depth when talking
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: systemFor({ lang, followUp: followUp === true, source }),
      messages: clean,
    });
    if (response.stop_reason === "refusal") {
      res.status(200).json({ text: lang === "en-US" ? "I can't answer that." : "Det kan jeg ikke svare på." });
      return;
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join(" ");
    res.status(200).json({ text: spoken(text) });
  } catch (err) {
    console.error("melvin brain error", err?.status, err?.message);
    if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: "Too many people talking to me at once. Try again in a minute." });
    } else if (err instanceof Anthropic.APIError) {
      res.status(502).json({ error: "My brain didn't answer." });
    } else {
      throw err;
    }
  }
}
