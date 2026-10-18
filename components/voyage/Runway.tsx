import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { Block, Line } from "@/lib/film/block";
import type { Runway as RunwayLayout } from "@/lib/film/spots";

/**
 * The page's text, in page order: one section per part of the page (`sec-*`), one article per block of the film.
 * Each article is as tall as the scroll from its reading spot to the next, so its top is its reading spot. Inside
 * it, the block's shot is what the visitor sees: in the film it's fixed in the frame and placed by the film; in the
 * plain reading layout it flows as the page. Every word is its own span, so the scroll can write it in, and a title
 * that arrives letter by letter has a span per letter too (its heading names it whole, for screen readers).
 * A section's `data-spot` is where landing on it lands, its first entry (past an intro), and `data-top` where it starts.
 */
export function Runway({ runway, clock }: { runway: RunwayLayout<Block>; clock: string }) {
  const first = runway.blocks[0]?.id;
  return (
    <div id="runway">
      {runway.sections.map((s) => (
        <section key={s.id} id={s.id} data-spot={s.land} data-top={s.top}>
          {s.blocks.map((b) => (
            <BlockArticle key={b.id} b={b} height={b.height} spot={b.spot} h1={b.id === first} clock={clock} />
          ))}
        </section>
      ))}
    </div>
  );
}

// a run of text as word spans, with `{time}` as his live clock; a no-break space keeps the words either side of it in
// one span, so they never break apart. Each word carries its text (`data-t`) for its halo's layer on a touch screen
// (voyage.css)
function Words({ text, clock, twin }: { text: string; clock?: string; twin?: boolean }) {
  return text.split(/([^\S\u00a0]+)/).map((part, i) => {
    if (!part || /^[^\S\u00a0]+$/.test(part)) return part;
    if (clock !== undefined && part.includes("{time}"))
      return (
        <time key={i} className="w clock" data-t={part.replace("{time}", clock)} suppressHydrationWarning>
          {part.replace("{time}", clock)}
        </time>
      );
    return (
      <span key={i} className="w" data-t={part} {...(twin ? { "data-w": part } : {})}>
        {part}
      </span>
    );
  });
}

function Row({ line, row, clock, twin }: { line: Line; row: number; clock: string; twin: boolean }) {
  return (
    <p className={line.kind === "data" ? "data" : "line"} data-row={row}>
      <Words text={line.text} clock={line.clock ? clock : undefined} twin={twin} />
    </p>
  );
}

function BlockArticle({ b, height, spot, h1, clock }: { b: Block; height: number; spot: number; h1: boolean; clock: string }) {
  const twin = b.mode === "twin";
  const short = b.body.short ?? b.body.land;
  const style = {
    "--tw": b.tint,
    "--hue": b.hue,
    "--lx": b.body.land.x, "--ly": b.body.land.y, "--lw": b.body.land.w, "--lm": b.body.land.mid ? 1 : 0,
    "--px": b.body.port.x, "--py": b.body.port.y, "--pw": b.body.port.w, "--pm": b.body.port.mid ? 1 : 0,
    "--sx": short.x, "--sy": short.y, "--sw": short.w, "--sm": short.mid ? 1 : 0,
  } as CSSProperties;
  const Heading = h1 ? "h1" : b.kind === "sign" ? "h3" : "h2";
  const first = b.title ? 1 : 0;
  const title = b.title ? (
    <Heading className="title" data-row={0}>
      <span className="in">
        <Words text={b.title} twin={twin} />
      </span>
      {b.sub ? (
        <span className="sub">
          <Words text={b.sub} twin={twin} />
        </span>
      ) : null}
    </Heading>
  ) : null;
  const rows = b.lines.map((l, j) => <Row key={j} line={l} row={first + j} clock={clock} twin={twin} />);
  const ask = b.ask ? (
    <button type="button" className="askb" data-q={b.ask.q}>
      Ask Tycho about {b.ask.label}
    </button>
  ) : null;

  let shot: ReactNode;
  if (b.kind === "sign") {
    // a breakthrough's card, its leader on its craft: its date, then its name, then why it mattered
    shot = (
      <div className={`shot sign m-${b.mode}`} style={style}>
        <div className="face">
          {rows[0]}
          {title}
          {rows.slice(1)}
        </div>
        {ask}
      </div>
    );
  } else {
    const labels = b.labels ?? [];
    shot = (
      <div className={`shot col m-${b.mode}${h1 ? " on" : ""}${b.cls ? ` ${b.cls}` : ""}${b.anchor && b.side !== "column" ? " rides" : ""}${b.phoneRide ? " phone-ride" : ""}`} style={style}>
        {b.cls === "hero" ? null : title}
        <div className="body">
          {/* the hero's lockup is one box: the name heads it */}
          {b.cls === "hero" ? title : null}
          {rows}
          {b.caption ? (
            <p className="cap" data-extra>
              <Words text={b.caption} />
            </p>
          ) : null}
          {labels.length ? (
            // the labels as a list: what a screen reader hears, and what a phone shows under the lines
            <ul className="lablist" data-extra>
              {labels.map((l, k) => (
                <li key={k} className={l.photo ? "has-photo" : undefined}>
                  {l.photo ? <Image src={l.photo.src} alt="" width={l.photo.width} height={l.photo.height} sizes="72px" /> : null}
                  {l.text}
                  {l.sub ? <small> {l.sub}</small> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {b.links ? (
            <p className="links" data-extra>
              {b.links.map((l) => (
                <a key={l.href} href={l.href} {...(l.back ? { "data-back": "" } : {})} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener me" } : {})}>
                  {l.label}
                  {l.back ? " ↑" : ""}
                </a>
              ))}
            </p>
          ) : null}
          {ask}
        </div>
        {labels.map((l, k) => (
          // the same labels riding their objects on leader lines; the list above already says them
          <span key={k} className={`label${l.photo ? " has-photo" : ""}`} data-k={k} aria-hidden="true">
            {l.photo ? <Image src={l.photo.src} alt="" width={l.photo.width} height={l.photo.height} sizes="120px" /> : null}
            {l.text}
            {l.sub ? <small>{l.sub}</small> : null}
          </span>
        ))}
      </div>
    );
  }

  return (
    <article id={b.projId ? `project-${b.projId}` : b.id} data-block={b.id} data-spot={spot} style={{ "--h": height } as CSSProperties}>
      {shot}
    </article>
  );
}
