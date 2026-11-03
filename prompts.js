(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  if (!$("nextPrompt")) return;
  const prompts = {
    self: [
      "What does being fully yourself feel like today?",
      "Which parts of yourself are asking to be heard?",
      "When do you feel most at home in your body?",
      "What are three things your younger self would love about you?",
      "What do you need to forgive yourself for?",
      "How can you listen to your intuition more closely?",
      "What would you say to yourself as a beloved friend?",
      "What are you ready to stop apologizing for?",
    ],
    feminine: [
      "What does feminine energy mean to you, in your own words?",
      "Where can you invite more softness without losing your power?",
      "What makes you feel radiant from within?",
      "How can you practice receiving care and support?",
      "What rituals help you feel connected to your sensuality and creativity?",
      "What does your authentic expression of femininity look like?",
      "Where can you choose flow instead of force?",
      "How do you honor your body's changing needs?",
    ],
    confidence: [
      "What boundary would make your life feel lighter?",
      "When did you last feel quietly confident?",
      "Where are you shrinking yourself to fit expectations?",
      "What would you try if you trusted your own judgment?",
      "What does a loving no make room for?",
      "Which strengths have you overlooked?",
      "What belief about your worth are you ready to release?",
      "How can you speak to yourself with more respect?",
    ],
    softness: [
      "What would true rest look like today?",
      "Which small comfort can you give yourself without earning it?",
      "What can wait until tomorrow?",
      "Where in your day can you create a moment of stillness?",
      "What helps your nervous system feel safe?",
      "How might you replace self-criticism with tenderness?",
      "What sensory details make you feel grounded?",
      "What would a slower morning give you?",
    ],
    growth: [
      "What dream deserves more space in your life?",
      "What does your next chapter feel like?",
      "Which habit supports the woman you are becoming?",
      "What have you learned about yourself this season?",
      "Where could you be a beginner again?",
      "What would progress look like without perfection?",
      "What are you ready to welcome into your life?",
      "What is one tiny step toward something meaningful?",
    ],
  };
  let current = "",
    last = "";
  const entriesKey = "beautyjournal-private-prompts-v1";
  function choose() {
    let cat = $("promptCategory").value,
      options =
        cat === "all"
          ? Object.entries(prompts).flatMap(([k, v]) =>
              v.map((q) => ({ q, k })),
            )
          : prompts[cat].map((q) => ({ q, k: cat }));
    let pick = options[Math.floor(Math.random() * options.length)];
    if (pick.q === last && options.length > 1)
      pick =
        options[(options.findIndex((x) => x.q === last) + 1) % options.length];
    current = last = pick.q;
    $("promptText").textContent = current;
    $("promptTag").textContent = pick.k
      .replace(/^./, (x) => x.toUpperCase())
      .replace(/-/g, " ");
    $("promptAnswer").value = "";
    $("promptSaveStatus").textContent = "";
  }
  let writable = true;
  function read() {
    try {
      const entries = JSON.parse(localStorage.getItem(entriesKey) || "[]");
      if (
        !Array.isArray(entries) ||
        entries.some(
          (e) =>
            !e ||
            !["date", "prompt", "answer"].every(
              (k) => typeof e[k] === "string",
            ),
        )
      )
        throw Error("Invalid reflections");
      return entries;
    } catch {
      writable = false;
      $("promptSaveStatus").textContent =
        "Saved reflections could not be read and have been retained. Restore a valid backup before saving.";
      return [];
    }
  }
  function render() {
    const root = $("promptEntries");
    root.replaceChildren();
    read()
      .slice(0, 20)
      .forEach((e) => {
        const a = document.createElement("article");
        a.className = "prompt-entry";
        const h = document.createElement("strong");
        h.textContent = e.prompt;
        const d = document.createElement("small");
        d.textContent = e.date;
        const p = document.createElement("p");
        p.textContent = e.answer;
        a.append(d, h, p);
        root.append(a);
      });
  }
  function save() {
    const answer = $("promptAnswer").value.trim();
    if (!answer) {
      $("promptSaveStatus").textContent = "Write a reflection before saving.";
      return;
    }
    const previous = read();
    if (!writable) return;
    try {
      localStorage.setItem(
        entriesKey,
        JSON.stringify(
          [
            {
              date: new Date().toLocaleDateString("en-US"),
              prompt: current,
              answer,
            },
            ...previous,
          ].slice(0, 200),
        ),
      );
      $("promptSaveStatus").textContent = "Saved on this device ✧";
      render();
    } catch {
      $("promptSaveStatus").textContent =
        "Could not save. Check available storage.";
    }
  }
  $("nextPrompt").addEventListener("click", choose);
  $("promptCategory").addEventListener("change", choose);
  $("savePromptEntry").addEventListener("click", save);
  $("copyPrompt").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(current);
      $("promptSaveStatus").textContent = "Prompt copied.";
    } catch {
      $("promptSaveStatus").textContent =
        "Copy unavailable. Select the prompt text to copy it manually.";
    }
  });
  choose();
  render();
})();
