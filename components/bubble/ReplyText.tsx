import type { Block } from "@/lib/chat/reply";

/**
 * A reply's blocks, its first `visible` word units shown. Each unit is a `.w` span numbered in reading order, so the
 * reveal can find the ones just shown and move them in. Links are real links, and lists are lists.
 */
export function ReplyText({ blocks, visible = Infinity }: { blocks: Block[]; visible?: number }) {
  let i = 0;
  const out: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  const flush = () => {
    if (list.length) out.push(<ul key={`ul${out.length}`}>{list}</ul>);
    list = [];
  };
  for (const [bi, b] of blocks.entries()) {
    if (i >= visible) break;
    const words: React.ReactNode[] = [];
    for (const u of b.units) {
      if (i >= visible) break;
      const inner = u.href ? (
        <a href={u.href} {...(/^https?:/.test(u.href) ? { target: "_blank", rel: "noopener" } : {})}>
          {u.text}
        </a>
      ) : u.bold ? (
        <strong>{u.text}</strong>
      ) : (
        u.text
      );
      // the space sits outside the word, so a word moving in (an inline block) keeps it
      if (!u.glue && words.length) words.push(" ");
      words.push(
        <span key={i} className="w" data-i={i}>
          {inner}
        </span>,
      );
      i++;
    }
    if (b.kind === "li") list.push(<li key={bi}>{words}</li>);
    else {
      flush();
      out.push(<p key={bi}>{words}</p>);
    }
  }
  flush();
  return <>{out}</>;
}
