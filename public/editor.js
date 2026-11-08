const rows = [...document.querySelectorAll(".about p:not(.eob)")];
const pos = document.querySelector(".pos");
const statusline = document.querySelector(".statusline");
const msg = document.querySelector(".msg");
const arrows = { ArrowLeft: "h", ArrowDown: "j", ArrowUp: "k", ArrowRight: "l" };

let row = rows.findIndex((r) => r.classList.contains("current"));
let col = rows[row].textContent.length - 1;
let want = col;
let lastKey = "";

const len = () => rows[row].textContent.length;

const moves = {
  h: () => (want = Math.max(col - 1, 0)),
  l: () => (want = Math.min(col + 1, len() - 1)),
  j: () => (row = Math.min(row + 1, rows.length - 1)),
  k: () => (row = Math.max(row - 1, 0)),
  0: () => (want = 0),
  $: () => (want = Infinity),
  G: () => (row = rows.length - 1),
};

function textNodes(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function cursorRange() {
  let rest = col;
  for (const node of textNodes(rows[row])) {
    if (rest < node.length) {
      const range = document.createRange();
      range.setStart(node, rest);
      range.setEnd(node, rest + 1);
      return range;
    }
    rest -= node.length;
  }
}

function caretAt(x, y) {
  if (document.caretPositionFromPoint) {
    const caret = document.caretPositionFromPoint(x, y);
    return caret && [caret.offsetNode, caret.offset];
  }
  const range = document.caretRangeFromPoint(x, y);
  return range && [range.startContainer, range.startOffset];
}

function renderLines() {
  rows.forEach((r, i) => {
    r.classList.toggle("current", i === row);
    r.dataset.ln = i === row ? i + 1 : Math.abs(i - row);
  });
  pos.textContent = `${row + 1}:${col + 1} All`;
}

renderLines();

if (!("highlights" in CSS)) {
  // Sin Highlight API: cursor fijo en su posición inicial.
  const span = document.createElement("span");
  span.className = "cursor";
  cursorRange().surroundContents(span);
} else {
  const cursor = new Highlight();
  const blinks = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer;
  let echoTimer;

  // Como kickstart.nvim: las flechas no mueven, piden usar hjkl.
  const echo = (text) => {
    msg.textContent = text;
    statusline.classList.add("echo");
    clearTimeout(echoTimer);
    echoTimer = setTimeout(() => statusline.classList.remove("echo"), 2000);
  };

  const render = () => {
    col = Math.min(want, len() - 1);
    renderLines();
    cursor.clear();
    cursor.add(cursorRange());
    CSS.highlights.set("cursor", cursor);
    clearInterval(timer);
    if (!blinks) return;
    timer = setInterval(() => {
      if (CSS.highlights.has("cursor")) CSS.highlights.delete("cursor");
      else CSS.highlights.set("cursor", cursor);
    }, 600);
  };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key in arrows) {
      e.preventDefault();
      echo(`Use ${arrows[e.key]} to move!!`);
      return;
    }
    const key = e.key;
    const gg = key === "g" && lastKey === "g";
    lastKey = gg ? "" : key;
    const move = gg ? () => (row = 0) : moves[key];
    if (!move) return;
    e.preventDefault();
    move();
    statusline.classList.remove("echo");
    render();
  });

  document.querySelector(".about").addEventListener("click", (e) => {
    const [node, offset] = caretAt(e.clientX, e.clientY) ?? [];
    const target = rows.findIndex((r) => r.contains(node));
    if (target === -1 || node.nodeType !== Node.TEXT_NODE) return;
    const nodes = textNodes(rows[target]);
    const before = nodes.slice(0, nodes.indexOf(node)).reduce((sum, n) => sum + n.length, 0);
    row = target;
    want = Math.min(before + offset, len() - 1);
    render();
  });

  render();
}
