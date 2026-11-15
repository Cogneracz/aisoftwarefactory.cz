/**
 * The questions' stage (src/components/faq.mjs): shows the part of the factory the open answer is about and, while a
 * question is pointed at, that question's part. Without this script the stage shows the first question's part.
 */

/** The part to show: the pointed-at question's, else the open one's, else the one shown before. */
export function stagePart(pointed, open, shown) {
  for (const mark of [pointed, open, shown]) if (typeof mark === "string" && mark !== "") return mark;
  return null;
}

export function initFaq() {
  const stage = document.querySelector(".faq__stage");
  const items = [...document.querySelectorAll(".faq__item")];
  if (!stage || items.length === 0) return;
  const layers = [...stage.querySelectorAll(".faq__layer")];
  let pointed = null;
  let shown = layers.find((l) => l.classList.contains("is-current"))?.dataset.mark ?? null;
  const open = () => items.find((d) => d.open)?.dataset.mark ?? null;
  const show = () => {
    const mark = stagePart(pointed, open(), shown);
    if (!mark || mark === shown) return;
    shown = mark;
    for (const layer of layers) layer.classList.toggle("is-current", layer.dataset.mark === mark);
  };
  for (const item of items) {
    item.addEventListener("toggle", show);
    const question = item.querySelector("summary");
    // A fine pointer previews a question's part; touch only opens.
    question?.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      pointed = item.dataset.mark;
      show();
    });
    question?.addEventListener("pointerleave", () => {
      pointed = null;
      show();
    });
  }
}
