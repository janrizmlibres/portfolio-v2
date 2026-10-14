"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { setAnswering } from "@/lib/chat/answering";
import { onAsk, type AskHow } from "@/lib/chat/ask";
import * as convo from "@/lib/chat/conversation";
import { GREETING, OPEN_LOG, READING, STARTERS, WELCOME_BACK } from "@/lib/chat/lines";
import { offered } from "@/lib/chat/log";
import { parseReply } from "@/lib/chat/reply";
import { PACE } from "@/lib/chat/reveal";
import { announce, opened } from "@/lib/chat/sentences";
import { say } from "@/lib/chat/talk";
import type { TychoRig } from "@/lib/tycho/rig";
import { placeCard, type CardPlace } from "@/lib/tycho/card";
import { createRoam } from "@/lib/tycho/roam";
import { onReplayWake } from "@/lib/wake/replay";
import { setCurrentRig, setCurrentRoam } from "@/lib/tycho/current";
import { onTier } from "@/lib/film/tier";
import { onWarp } from "@/lib/film/warp";
import { currentSound } from "@/lib/audio/current";
import { useTychoChat } from "@/components/chat/use-tycho-chat";
import { Bubble } from "./Bubble";
import { FlatTycho } from "./FlatTycho";
import { Log } from "./Log";
import { linkVoice } from "./voice-link";
import "./bubble.css";

/** 3D that hasn't drawn him by now gives way to the flat Tycho. */
const FLAT_AFTER_MS = 10_000;
const phoneQuery = "(max-width: 700px)";
const never = () => () => {};
const media = (q: string) => ({
  subscribe: (fn: () => void) => {
    const mq = matchMedia(q);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  },
  get: () => matchMedia(q).matches,
});
const isPhone = media(phoneQuery), isReduced = media("(prefers-reduced-motion: reduce)");
const noWebGL = () => document.documentElement.dataset.film === "plain";
// Whether the visitor last moved about by keyboard. Focus handed back on a close (to where it came from, or the "Ask
// Tycho" key) is given back only then: after a pointer, a programmatic focus still matches :focus-visible, and would
// show the key to someone who never pressed Tab. Otherwise focus is let go, to the page.
let byKey = false;
const KEYS = new Set(["Tab", "Enter", " ", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => { if (KEYS.has(e.key)) byKey = true; }, true);
  document.addEventListener("pointerdown", () => { byKey = false; }, true);
}
const giveBack = (to: HTMLElement | null | undefined) => {
  if (byKey) to?.focus({ preventScroll: true });
  else (document.activeElement as HTMLElement | null)?.blur();
};
// the tier can turn plain after first paint (3D that failed, or the wake-up giving up on it at about 10 s)
const onTierChange = (fn: () => void) => onTier(fn);

/**
 * Tycho and his bubble: the one conversation surface, and the log behind it.
 * - **The bubble** is a square card on a hairline, its tail a leader line out of his head. It opens where he is
 *   (above him, beside him or below him; on a phone it spans the width), drawing the line, then unfolding the card
 *   from its edge nearest him; it folds back the same way. It holds only the current exchange and grows to half the
 *   frame, then scrolls, following the newest words unless the visitor scrolls it back.
 * - **The reveal:** the reply is read as it streams and its words rise into place at PACE, never ahead of the stream;
 *   a tap shows the rest. While he waits, the question shows and he plays his thinking emote.
 * - **One question at a time** (`lib/chat/conversation.ts`): asking is held off everywhere while he answers
 *   (`lib/chat/answering.ts`); the input stays typable. Closing mid-reply lets the reply finish into the log.
 * - **The fold:** once nothing is appearing, scrolling on about a screen folds the bubble into him. Clicking him
 *   reopens the same exchange. He holds still while it's open.
 * - **The log** is a sheet over the page with the whole conversation and Clear.
 * - **Keyboard and screen readers:** an "Ask Tycho" button early in the tab order, shown when focused, beside "Move
 *   Tycho". The bubble is a dialog that doesn't trap focus: focus goes in when it opens, Esc closes it and returns
 *   focus. "Tycho is reading his notes" is announced once, then each finished sentence.
 * - **Tiers:** without 3D (no WebGL, or 3D that failed or took more than 10 s) the flat Tycho sits parked and still
 *   and opens the same bubble. Under reduced motion the card and the log fade and words fade in place, at the same
 *   pace. On phones the keyboard never covers the input.
 * His talking is told to anything that follows it through `lib/chat/talk.ts` (his voice listens there).
 */
export function Tycho() {
  // in the browser only: it renders nothing on the server
  const here = useSyncExternalStore(never, () => true, () => false);
  const phone = useSyncExternalStore(isPhone.subscribe, isPhone.get, () => false);
  const reduced = useSyncExternalStore(isReduced.subscribe, isReduced.get, () => false);
  // the exchange as last shown; `c` holds it as of now, ahead of the render, for the ticker and the handlers
  const [view, setView] = useState(convo.start);
  const [logOpen, setLogOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [said, setSaid] = useState("");
  // without 3D: no WebGL at all, or 3D that failed or was late
  const plain = useSyncExternalStore(onTierChange, noWebGL, () => false);
  const [failed, setFailed] = useState(false);
  const flat = plain || failed;

  const c = useRef<convo.Conversation>(convo.start());
  const shownCount = useRef(0); // word units shown, as last told
  const announced = useRef(0); // sentences announced
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const body = useRef<HTMLButtonElement | null>(null);
  const askKey = useRef<HTMLButtonElement | null>(null);
  const card = useRef<HTMLElement | null>(null);
  const sheet = useRef<HTMLElement | null>(null);
  const leader = useRef<SVGSVGElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const logButton = useRef<HTMLButtonElement | null>(null);
  const logClose = useRef<HTMLButtonElement | null>(null);
  const rig = useRef<TychoRig | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  // where he is on the screen, and how he moves round its edges
  const roam = useRef<ReturnType<typeof createRoam> | null>(null);
  // what his moving does to his bubble (it follows him while it's open), set once the bubble's place is known
  const follow = useRef(() => {});
  // where his bubble last opened from him: above, beside or below
  const side = useRef<CardPlace["side"]>("above");

  /**
   * Every change to the exchange goes through here: it keeps the rest of the page told (answering, the score, his
   * rig, his talking, the announcements) and re-renders only when something shown changed.
   */
  const commit = useCallback((next: convo.Conversation) => {
    const prev = c.current;
    if (next === prev) return;
    c.current = next;
    const wasAnswering = convo.answering(prev), isAnswering = convo.answering(next);
    if (wasAnswering !== isAnswering) {
      setAnswering(isAnswering ? next.question : null);
      if (isAnswering) document.documentElement.dataset.answering = "";
      else delete document.documentElement.dataset.answering;
    }
    if (prev.phase !== next.phase) {
      // the score follows the chat: a dip and the thinking layer while he thinks, a lighter dip while he answers
      currentSound()?.setChat(next.phase === "thinking" ? "submitted" : next.phase === "streaming" ? "streaming" : "ready");
      if (prev.phase === "thinking" && next.phase === "streaming") rig.current?.relax();
    }
    // a hush: the rest shows at once, so whatever follows the words falls silent
    if (isAnswering && next.reveal.all && !prev.reveal.all) say({ type: "hush" });
    // a new question starts its count again
    if (next.phase === "thinking" && prev.phase !== "thinking") shownCount.current = 0;
    const before = shownCount.current, now = convo.visible(next);
    if (now > shownCount.current) {
      const blocks = parseReply(next.arrived);
      if (shownCount.current === 0) say({ type: "open" });
      for (const span of opened(blocks, shownCount.current, now)) say({ type: "sentence", span });
      say({ type: "show", blocks, visible: now });
      rig.current?.talkBeat();
      shownCount.current = now;
    }
    if (next.phase === "done" && prev.phase !== "done") say({ type: "done" });
    if (next.question && (now > before || next.ended !== prev.ended || next.phase !== prev.phase)) {
      const a = announce(parseReply(next.arrived), now, announced.current, next.phase === "done");
      if (a.say) {
        setSaid(a.say);
        announced.current = a.upTo;
      }
    }
    if (prev.phase !== next.phase || prev.open !== next.open || prev.away !== next.away || prev.question !== next.question || now !== before) setView(next);
  }, []);

  const chat = useTychoChat({ onText: (text, ended) => commit(convo.arrive(c.current, text, ended)) });
  const chatNow = useRef(chat);
  useLayoutEffect(() => {
    chatNow.current = chat;
  });

  // his voice follows his talking (Voice verdict)
  useEffect(() => (here ? linkVoice() : undefined), [here]);

  // his body, after first paint; the flat Tycho without 3D
  useEffect(() => {
    if (!here || plain || !canvas.current) return;
    let gone = false;
    const late = setTimeout(() => !gone && setFailed(true), FLAT_AFTER_MS);
    import("@/lib/tycho/rig")
      .then(({ createTychoRig }) => {
        if (gone || !canvas.current) return;
        const r = createTychoRig(canvas.current, { reduced });
        rig.current = r;
        if (process.env.NODE_ENV !== "production") Object.assign(window, { __tycho: r });
        setCurrentRig(r);
        return r.ready.then(() => clearTimeout(late));
      })
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
      clearTimeout(late);
      rig.current?.destroy();
      rig.current = null;
      setCurrentRig(null);
    };
  }, [here, plain, reduced]);
  // without 3D, the drawing takes his place, parked
  useEffect(() => {
    if (!flat) return;
    rig.current?.destroy();
    rig.current = null;
    setCurrentRig(null);
  }, [flat]);

  // where he is on the screen, and how he moves round it; the flat Tycho stays parked
  useEffect(() => {
    if (!here || flat || !body.current) return;
    const r = createRoam({
      body: body.current,
      rig: () => rig.current,
      phone: () => matchMedia(phoneQuery).matches,
      reduced,
      talking: () => c.current.open,
      announce: setSaid,
      moved: () => follow.current(),
    });
    roam.current = r;
    setCurrentRoam(r);
    return () => {
      setCurrentRoam(null);
      r.destroy();
      roam.current = null;
    };
  }, [here, reduced, flat]);

  // the reveal, on GSAP's ticker
  useEffect(() => {
    const tick = (_t: number, dtMs: number) => {
      if (c.current.phase === "streaming") commit(convo.tick(c.current, dtMs / 1000, PACE));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [commit]);

  // ---------------------------------------------------------------- opening, asking and closing
  // where focus was before the bubble opened, to go back to when it closes
  const noteOpener = useCallback(() => {
    const a = document.activeElement as HTMLElement | null;
    if (!a || a === document.body || card.current?.contains(a) || sheet.current?.contains(a)) return;
    opener.current = a;
  }, []);
  const openBubble = useCallback(() => {
    if (!c.current.open) noteOpener();
    commit(convo.open(c.current));
  }, [commit, noteOpener]);
  const closeBubble = useCallback(() => commit(convo.close(c.current)), [commit]);
  const tapText = useCallback(() => commit(convo.tap(c.current)), [commit]);

  const ask = useCallback(
    (q: string, how?: AskHow) => {
      const next = convo.ask(c.current, q);
      if (next === c.current) return false;
      if (!c.current.open) noteOpener();
      // in the asking gesture: his voice may start
      say({ type: "ask", question: next.question! });
      announced.current = 0;
      setSaid(READING);
      rig.current?.think();
      commit(next);
      chatNow.current.send(next.question!, how);
      return true;
    },
    [commit, noteOpener],
  );

  // asking from the page (a block's "Ask Tycho about …" button, a star, a chip)
  useEffect(() => onAsk(ask), [ask]);

  // the wake-up's greeting (or welcome back) opens the bubble on it
  useEffect(() => {
    addEventListener("tycho:greet", openBubble);
    return () => removeEventListener("tycho:greet", openBubble);
  }, [openBubble]);

  // "Replay experience" brings the wake-up back: his bubble and log close, and he's back on his corner, from where the
  // wake-up takes him to its stage
  useEffect(
    () =>
      onReplayWake(() => {
        setLogOpen(false);
        closeBubble();
        roam.current?.reset();
      }),
    [closeBubble],
  );

  // a warp puts the bubble away while he flies, and it comes back to him as it was once he's landed
  useEffect(
    () =>
      onWarp(({ phase }) => {
        if (phase === "start") commit(convo.away(c.current, true));
        else if (phase === "end") commit(convo.away(c.current, false));
      }),
    [commit],
  );

  // the fold: scrolling on with nothing appearing
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      const dy = scrollY - last;
      last = scrollY;
      commit(convo.scrolled(c.current, dy, innerHeight));
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, [commit]);

  // Esc: the log back to the bubble, the bubble back to Tycho
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (logOpen) setLogOpen(false);
      else if (c.current.open) closeBubble();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [logOpen, closeBubble]);

  // the page's "Ask Tycho about …" buttons wait while he answers, as the stars and chips do
  const isAnswering = convo.answering(view);
  useEffect(() => {
    document.querySelectorAll(".askb").forEach((b) => (isAnswering ? b.setAttribute("aria-disabled", "true") : b.removeAttribute("aria-disabled")));
  }, [isAnswering]);

  // ---------------------------------------------------------------- the card's place and its leader
  const placeBubble = useCallback(() => {
    const el = card.current, me = body.current;
    if (!el || !me) return;
    const r = me.getBoundingClientRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const p = placeCard({ me: { l: r.left, t: r.top, r: r.right, b: r.bottom }, w: 26 * rem, h: el.scrollHeight, vw: innerWidth, vh: innerHeight, phone: matchMedia(phoneQuery).matches });
    side.current = p.side;
    Object.assign(el.style, {
      left: `${p.left}px`, right: "auto", width: `${p.width}px`, maxHeight: `${p.maxH}px`,
      top: p.top === undefined ? "auto" : `${p.top}px`, bottom: p.bottom === undefined ? "auto" : `${p.bottom}px`,
    });
  }, []);

  // out of his head to the card's nearest edge (out of his base to a card below him)
  const layLeader = useCallback(() => {
    const svg = leader.current, el = card.current, me = body.current;
    if (!svg || !el || !me) return;
    const p = me.getBoundingClientRect(), b = el.getBoundingClientRect();
    const hx = p.left + p.width * 0.5, below = side.current === "below", hy = p.top + p.height * (below ? 0.92 : 0.2);
    const along = Math.min(b.right - 24, Math.max(b.left + 24, hx));
    const [ex, ey] =
      side.current === "beside" ? [b.left > hx ? b.left : b.right, Math.min(b.bottom - 16, Math.max(b.top + 16, hy))] : below ? [along, b.top] : [along, b.bottom];
    const line = svg.querySelector("line")!, dot = svg.querySelector("circle")!;
    line.setAttribute("x1", String(hx));
    line.setAttribute("y1", String(hy));
    line.setAttribute("x2", String(ex));
    line.setAttribute("y2", String(ey));
    dot.setAttribute("cx", String(hx));
    dot.setAttribute("cy", String(hy));
    const len = Math.hypot(ex - hx, ey - hy);
    line.style.strokeDasharray = `${len}`;
    return len;
  }, []);

  // wherever he's drawn while it's open (a move under way as it opened, a resize), the card and its leader come along
  useEffect(() => {
    follow.current = () => {
      if (!c.current.open) return;
      placeBubble();
      layLeader();
    };
  }, [placeBubble, layLeader]);

  // shown: open, and not put away for a warp
  const isOpen = view.open && !view.away, isAway = view.away;
  useEffect(() => {
    if (!isOpen) return;
    const ro = new ResizeObserver(() => layLeader());
    if (card.current) ro.observe(card.current);
    const onResize = () => {
      placeBubble();
      layLeader();
    };
    addEventListener("resize", onResize);
    // a phone's keyboard: the card sits on it, so it never covers the input; his leader waits behind it
    const vv = window.visualViewport;
    const onViewport = () => {
      const el = card.current;
      if (!vv || !el || !matchMedia(phoneQuery).matches) return;
      const kb = innerHeight - vv.height - vv.offsetTop;
      if (kb > 80) {
        Object.assign(el.style, { top: "auto", bottom: `${kb + 8}px`, maxHeight: `${Math.max(160, vv.height - 24)}px` });
        leader.current?.style.setProperty("visibility", "hidden");
      } else {
        leader.current?.style.removeProperty("visibility");
        onResize();
      }
    };
    vv?.addEventListener("resize", onViewport);
    return () => {
      ro.disconnect();
      removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onViewport);
    };
  }, [isOpen, layLeader, placeBubble]);

  // open: the leader draws out of his head, then the card unfolds from its edge nearest him, and focus goes in; the
  // fold is the same backwards, and focus that was in the card goes back where it came from. Under reduced motion,
  // the card fades.
  const shown = useRef(false);
  // the last change was the warp putting it away (its return is quiet too)
  const awayed = useRef(false);
  useLayoutEffect(() => {
    const el = card.current, svg = leader.current;
    if (!el) return;
    // closed from the start: out of reach until it opens
    if (!isOpen && !shown.current) el.setAttribute("inert", "");
    if (isOpen === shown.current) return;
    shown.current = isOpen;
    if (isOpen) placeBubble();
    const len = layLeader() ?? 0;
    const line = svg?.querySelector("line"), dot = svg?.querySelector("circle");
    if (!line || !dot) return;
    // folded to its edge nearest him, in px: GSAP tweens between insets of the same shape, never from a calc()
    const h = el.offsetHeight, w = el.offsetWidth, s = side.current, mine = body.current?.getBoundingClientRect();
    const fromLeft = s === "beside" && !!mine && el.getBoundingClientRect().left > mine.left;
    const shut = s === "above" ? `inset(${h - 1}px 0px 0px 0px)` : s === "below" ? `inset(0px 0px ${h - 1}px 0px)`
      : fromLeft ? `inset(0px ${w - 1}px 0px 0px)` : `inset(0px 0px 0px ${w - 1}px)`;
    const whole = "inset(0px 0px 0px 0px)";
    gsap.killTweensOf([el, line, dot]);
    const tl = gsap.timeline();
    // put away for a warp, or back after it: the warp has its own sound
    if (!isAway && !awayed.current) currentSound()?.play(isOpen ? "ui-open" : "ui-fold");
    awayed.current = isAway;
    if (isOpen) {
      gsap.set(el, { visibility: "visible" });
      el.removeAttribute("inert");
      tl.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0).fromTo(line, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: reduced ? 0 : 0.45, ease: "power2.out" }, 0);
      if (reduced) tl.fromTo(el, { opacity: 0, clipPath: whole }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
      else tl.fromTo(el, { clipPath: shut, opacity: 1 }, { clipPath: whole, duration: 0.5, ease: "power3.out" }, 0.3);
      // desktop: the input; phones: the card, so the keyboard waits for a tap on the input
      if (phone) el.focus({ preventScroll: true });
      else input.current?.focus({ preventScroll: true });
    } else {
      const had = el.contains(document.activeElement);
      el.setAttribute("inert", "");
      if (had) giveBack(opener.current?.isConnected ? opener.current : askKey.current);
      if (reduced) tl.to(el, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0);
      else tl.fromTo(el, { clipPath: whole }, { clipPath: shut, duration: 0.35, ease: "power2.in" }, 0);
      tl.to(line, { strokeDashoffset: len, duration: reduced ? 0 : 0.35, ease: "power2.in" }, reduced ? 0.1 : 0.3).to(dot, { opacity: 0, duration: 0.15 }, ">-0.05");
      tl.set(el, { visibility: "hidden" });
    }
  }, [isOpen, isAway, reduced, phone, layLeader, placeBubble]);

  // words just shown rise into place (under reduced motion, fade in place), and the card follows the newest words
  // unless the visitor has scrolled it back
  const shownWords = convo.visible(view);
  const risen = useRef(0);
  useLayoutEffect(() => {
    const from = risen.current;
    risen.current = shownWords;
    if (shownWords <= from || !card.current) return;
    const els = [...card.current.querySelectorAll<HTMLElement>(".pb-a .w")].filter((el) => Number(el.dataset.i) >= from);
    if (reduced) gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" });
    else gsap.fromTo(els, { opacity: 0, y: "0.45em" }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    const sc = card.current.querySelector<HTMLElement>(".pb-scroll");
    if (sc && sc.scrollHeight - sc.scrollTop - sc.clientHeight < 80) sc.scrollTop = sc.scrollHeight;
  }, [shownWords, reduced]);

  // the log's sheet: from the right on desktop, from the bottom on phones; focus goes to its Close, and back to the
  // bubble's Log button when it closes
  const sheetShown = useRef(false);
  useLayoutEffect(() => {
    const el = sheet.current;
    if (!el) return;
    if (!logOpen && !sheetShown.current) el.setAttribute("inert", "");
    if (logOpen === sheetShown.current) return;
    sheetShown.current = logOpen;
    const off = phone ? { yPercent: 100, xPercent: 0 } : { xPercent: 100, yPercent: 0 };
    gsap.killTweensOf(el);
    if (logOpen) {
      gsap.set(el, { visibility: "visible" });
      el.removeAttribute("inert");
      if (reduced) gsap.fromTo(el, { opacity: 0, xPercent: 0, yPercent: 0 }, { opacity: 1, duration: 0.3 });
      else gsap.fromTo(el, { ...off, opacity: 1 }, { xPercent: 0, yPercent: 0, duration: 0.55, ease: "power3.out" });
      logClose.current?.focus({ preventScroll: true });
    } else {
      const had = el.contains(document.activeElement);
      el.setAttribute("inert", "");
      if (had) giveBack(isOpen ? logButton.current : opener.current?.isConnected ? opener.current : askKey.current);
      gsap.to(el, { ...(reduced ? { opacity: 0 } : off), duration: reduced ? 0.35 : 0.4, ease: "power2.in", onComplete: () => void gsap.set(el, { visibility: "hidden" }) });
    }
  }, [logOpen, phone, reduced, isOpen]);

  const clearLog = useCallback(() => {
    chatNow.current.clear();
    commit({ ...convo.start(), open: c.current.open });
  }, [commit]);
  const closeLog = useCallback(() => setLogOpen(false), []);

  if (!here) return null;

  const now = view;
  const exchanges = chat.exchanges;
  const opening = exchanges.length ? { line: WELCOME_BACK, openLog: OPEN_LOG } : { line: GREETING };
  const onBody = () => (now.open ? closeBubble() : openBubble());

  return (
    <div id="tycho" data-phase={now.phase} className={[phone && "is-phone", flat && "is-flat"].filter(Boolean).join(" ") || undefined}>
      {/* the keyboard's way in, early in the tab order and seen only when focused; a moving Tycho is never a tab stop */}
      <button ref={askKey} type="button" className="tycho-key tycho-ask" aria-expanded={now.open} onClick={onBody}>
        Ask Tycho
      </button>
      {!flat && (
        <button type="button" className="tycho-key tycho-move" onClick={() => roam.current?.moveByKey()}>
          Move Tycho
        </button>
      )}
      <button
        ref={body}
        type="button"
        className="tycho-body"
        tabIndex={-1}
        aria-label="Ask Tycho"
        aria-expanded={now.open}
        onClick={onBody}
        onPointerEnter={() => rig.current?.perk(true)}
        onPointerLeave={() => rig.current?.perk(false)}
      >
        {flat ? <FlatTycho /> : <canvas ref={canvas} aria-hidden="true" />}
      </button>

      <svg ref={leader} className="tycho-leader" aria-hidden="true">
        <line />
        <circle r="2.5" />
      </svg>

      <Bubble
        cardRef={card}
        inputRef={input}
        logRef={logButton}
        question={now.question}
        blocks={parseReply(now.arrived)}
        visible={shownWords}
        opening={opening}
        starters={offered(STARTERS, exchanges, now.question)}
        answering={convo.answering(now)}
        draft={draft}
        canSend={convo.canSend(now, draft)}
        logCount={exchanges.length}
        onDraft={setDraft}
        onAsk={(q) => {
          if (ask(q) && q === draft) setDraft("");
        }}
        onTap={tapText}
        onClose={closeBubble}
        onLog={() => setLogOpen(true)}
      />

      <Log
        sheetRef={sheet}
        closeRef={logClose}
        entries={exchanges}
        live={convo.answering(now) ? now.arrived : null}
        canClear={!convo.answering(now)}
        onClear={clearLog}
        onClose={closeLog}
      />

      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
}
