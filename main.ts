// painfully-honest-out-of-office — one brutally honest but still polite
// out-of-office auto-reply.
//
// The program does exactly one thing: it writes the chosen reply to
// /output/entry.txt (or to $MAKEFUN_OUTPUT_DIR/entry.txt when that
// variable is set, so the entry can be checked locally). The reply is a
// single sentence of English, at most 200 characters, with no trailing
// newline — the gate scorer reads the file as-is, so any extra byte
// would count against the 200-character cap. Running the program prints
// the reply itself and nothing else.
//
// The reply itself lives in CHOSEN_REPLY below.

import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The hard cap from the bounty rules: entry.txt must hold 1-200 chars.
const CHAR_LIMIT = 200;

// The chosen reply. Revised from the first draft: "ignoring my inbox"
// sounded like a complaint, and "just as behind as I left" stated the
// backlog without admitting the part no employee says out loud. This
// version confesses the private truth instead — the sender will not
// read email at all, the note joins 400 unread messages, and the
// catch-up on return will be pretended, cheerfully — while staying
// warm throughout ("Thank you for writing"), so a manager reading it
// forwarded would find nothing to object to. One sentence, and the
// quotable turn lands at the end: "cheerfully pretend to catch up".
const CHOSEN_REPLY =
  "Thank you for writing — I'm away until Monday and won't be reading email, so your note joins 400 unread messages I'll cheerfully pretend to catch up on when I'm back.";

// Where the entry goes. The harness mounts /output; a local run can
// point somewhere else with MAKEFUN_OUTPUT_DIR instead.
function outputFolder(): string {
  const override = process.env.MAKEFUN_OUTPUT_DIR;
  if (override !== undefined && override.trim() !== "") {
    return override;
  }
  return "/output";
}

// Count characters the way a reader counts them: one code point each,
// so an em dash or an apostrophe never inflates the total.
function charCount(text: string): number {
  return [...text].length;
}

// Refuse to write anything the gate would reject, rather than writing
// a bad file and hoping nobody notices.
function guardReply(text: string): void {
  if (text.trim().length === 0) {
    throw new Error("reply is empty or only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("reply must be exactly one line");
  }
  // The brief asks for a single sentence: one terminal full stop, and
  // no other sentence-ending punctuation inside it.
  const stops = (text.match(/[.!?]/g) ?? []).length;
  if (stops !== 1 || !text.endsWith(".")) {
    throw new Error("reply must be exactly one sentence");
  }
  const size = charCount(text);
  if (size > CHAR_LIMIT) {
    throw new Error(`reply is ${size} characters, over the ${CHAR_LIMIT} limit`);
  }
}

function main(): void {
  guardReply(CHOSEN_REPLY);

  const folder = outputFolder();
  mkdirSync(folder, { recursive: true });

  const target = join(folder, "entry.txt");
  writeFileSync(target, CHOSEN_REPLY, "utf8");

  // The grader collects the output as a different user, so the file
  // must be world-readable: 0644, never the 0600 a temp file gets.
  chmodSync(target, 0o644);

  // Read the file back and confirm it holds exactly the reply — no
  // trailing newline, no encoding surprise, nothing appended.
  const written = readFileSync(target, "utf8");
  if (written !== CHOSEN_REPLY) {
    throw new Error("entry.txt does not match the reply after writing");
  }
  guardReply(written);

  // The program prints the reply itself and nothing else.
  console.log(CHOSEN_REPLY);
}

main();
