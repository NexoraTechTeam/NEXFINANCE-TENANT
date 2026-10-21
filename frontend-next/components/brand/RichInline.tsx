import { Fragment, type ReactNode } from 'react';

const TAGS = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u' } as const;
type Tag = (typeof TAGS)[keyof typeof TAGS];
const DROP = new Set(['script', 'style', 'template', 'noscript']);
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_, e: string) => ENTITIES[e]);

interface Node { tag?: Tag; children: Array<Node | string> }

/** Builds a tree from inline HTML; only b/i/u become elements, everything else is text or dropped. */
export function parseInline(html: string): Array<Node | string> {
  const root: Node = { children: [] };
  const stack: Node[] = [root];
  let dropping: string | null = null;
  for (const token of String(html ?? '').split(/(<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>)/)) {
    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/.exec(token);
    if (!m) {
      if (token && !dropping) stack[stack.length - 1].children.push(decode(token));
      continue;
    }
    const name = m[2].toLowerCase();
    if (DROP.has(name)) { dropping = m[1] ? null : name; continue; }
    if (dropping) continue;
    const tag = TAGS[name as keyof typeof TAGS];
    if (!tag) continue;
    if (!m[1]) {
      const node: Node = { tag, children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    } else if (stack.length > 1 && stack.some((n) => n.tag === tag)) {
      while (stack.length > 1 && stack.pop()!.tag !== tag) { /* close inner tags */ }
    }
  }
  return root.children;
}

const renderNodes = (nodes: Array<Node | string>): ReactNode[] => nodes.map((n, i) => {
  if (typeof n === 'string') return <Fragment key={i}>{n}</Fragment>;
  const Tag = n.tag!;
  return <Tag key={i}>{renderNodes(n.children)}</Tag>;
});

/** Renders the Console's inline rich text (bold/italic/underline) without innerHTML. */
export default function RichInline({ html }: { html: string }) {
  return <>{renderNodes(parseInline(html))}</>;
}
