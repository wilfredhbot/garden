import { evalSnippet } from "./api";
import { createGardenEditor, setEditorContent } from "./editor";
import { celebrate } from "./tour-celebration";

const lessons = [
  {
    id: "hello",
    title: "Hello, Garden",
    filename: "hello.gdn",
    description:
      "A Garden file can run expressions directly. Change the program to print “Hello, sunflower!”.",
    expected: { stdout: "Hello, sunflower!\n" },
    source: 'println("Hello, Garden!")\n',
  },
  {
    id: "bindings",
    title: "Names and values",
    filename: "bindings.gdn",
    description:
      "Use let to give a value a name. Change the value of name so the program prints “Sunflower”.",
    expected: { stdout: "Sunflower\n" },
    source: 'let name = "Garden"\n\nprintln(name)\n',
  },
  {
    id: "functions",
    title: "Write a function",
    filename: "functions.gdn",
    description:
      "Use fun to define a function. The final expression in the body is its result. Change the call so the result is 42.",
    source: "fun add_one(i: Int): Int {\n  i + 1\n}\n\nadd_one(1)\n",
    expected: { value: "42", type: "Int" },
  },
];

export function setupTour(): void {
  const tour = document.querySelector<HTMLElement>(".tour");
  if (!tour) return;

  const trail = tour.querySelector(".tour-trail")!;
  const title = tour.querySelector("#tour-title")!;
  const description = tour.querySelector("#tour-description")!;
  const filename = tour.querySelector("#tour-filename")!;
  const editorHost = tour.querySelector("#tour-editor")!;
  const output = tour.querySelector("#tour-output")!;
  const effect = tour.querySelector<HTMLSelectElement>("#tour-effect")!;
  const previous = tour.querySelector<HTMLButtonElement>("#tour-previous")!;
  const next = tour.querySelector<HTMLButtonElement>("#tour-next")!;
  const drafts = new Map<string, string>();
  let currentIndex = -1;
  let editor: ReturnType<typeof createGardenEditor> | undefined;

  const buttons = lessons.map((lesson, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${index + 1}. ${lesson.title}`;
    button.addEventListener("click", () => {
      location.hash = lesson.id;
    });
    trail.append(button);
    return button;
  });

  function showLesson(): void {
    const index = Math.max(0, lessons.findIndex((lesson) => `#${lesson.id}` === location.hash));
    const lesson = lessons[index];
    if (!lesson || index === currentIndex) return;
    currentIndex = index;

    title.textContent = lesson.title;
    description.textContent = lesson.description;
    filename.textContent = lesson.filename;
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    previous.disabled = index === 0;
    next.disabled = index === lessons.length - 1;

    editor?.destroy();
    editor = createGardenEditor(drafts.get(lesson.id) ?? lesson.source, (source) => {
      drafts.set(lesson.id, source);
    });
    editor.contentDOM.setAttribute("aria-labelledby", "tour-filename");
    editorHost.replaceChildren(editor.dom);
    output.textContent = "Run the program to see its output.";
  }

  function run(): void {
    const lesson = lessons[currentIndex];
    if (!editor || !lesson) return;
    const source = editor.state.sliceDoc();
    const result = document.createElement("div");
    output.replaceChildren(result);

    evalSnippet(source, result, (results) => {
      if (
        source === lesson.source ||
        editor?.state.sliceDoc() !== source ||
        !result.isConnected
      ) return;

      const { expected } = lesson;
      const printed = results.map((item) => "printed" in item ? item.printed.s : "").join("");
      const values = results.filter((item) => "value" in item);
      const last = values[values.length - 1];
      const solved = expected.stdout !== undefined
        ? printed === expected.stdout
        : last?.value === expected.value && last?.type === expected.type;
      if (!solved) return;

      const feedback = document.createElement("div");
      feedback.className = "tour-solved";
      feedback.textContent = "You got it!";
      output.append(feedback);
      if (effect.value !== "off") celebrate(effect.value, feedback);
    });
  }

  tour.querySelector("#tour-run")!.addEventListener("click", run);
  editorHost.addEventListener("keydown", (event) => {
    if (event instanceof KeyboardEvent && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      run();
    }
  });
  tour.querySelector("#tour-reset")!.addEventListener("click", () => {
    const lesson = lessons[currentIndex];
    if (!lesson || !editor) return;
    setEditorContent(editor, lesson.source);
    output.textContent = "Run the program to see its output.";
    editor.focus();
  });
  previous.addEventListener("click", () => {
    const lesson = lessons[currentIndex - 1];
    if (lesson) location.hash = lesson.id;
  });
  next.addEventListener("click", () => {
    const lesson = lessons[currentIndex + 1];
    if (lesson) location.hash = lesson.id;
  });
  window.addEventListener("hashchange", showLesson);
  showLesson();
  tour.hidden = false;
}
