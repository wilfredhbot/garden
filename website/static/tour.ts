import { evalSnippet } from "./api";
import { createGardenEditor, setEditorContent } from "./editor";

const lessons = [
  {
    id: "hello",
    title: "Hello, Garden",
    filename: "hello.gdn",
    description:
      "A Garden file can run expressions directly. Change the greeting in the editor and run the program to see it printed.",
    source: 'println("Hello, Garden!")\n',
  },
  {
    id: "bindings",
    title: "Names and values",
    filename: "bindings.gdn",
    description:
      "Use let to give a value a name. Try changing the value of name and running the program again.",
    source: 'let name = "Garden"\n\nprintln(name)\n',
  },
  {
    id: "functions",
    title: "Write a function",
    filename: "functions.gdn",
    description:
      "Use fun to define a function. The final expression in the body is its result. Try calling add_one with a different number.",
    source: "fun add_one(i: Int): Int {\n  i + 1\n}\n\nadd_one(41)\n",
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
  const previous = tour.querySelector<HTMLButtonElement>("#tour-previous")!;
  const next = tour.querySelector<HTMLButtonElement>("#tour-next")!;
  const drafts = new Map<string, string>();
  let currentIndex = -1;
  let editor: ReturnType<typeof createGardenEditor> | undefined;

  const links = lessons.map((lesson, index) => {
    const link = document.createElement("a");
    link.href = `#${lesson.id}`;
    link.textContent = `${index + 1}. ${lesson.title}`;
    trail.append(link);
    return link;
  });

  function showLesson(): void {
    const index = Math.max(0, links.findIndex((link) => link.hash === location.hash));
    const lesson = lessons[index];
    if (!lesson || index === currentIndex) return;
    currentIndex = index;

    title.textContent = lesson.title;
    description.textContent = lesson.description;
    filename.textContent = lesson.filename;
    links.forEach((link, i) => {
      if (i === index) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
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
    if (!editor) return;
    const result = document.createElement("div");
    output.replaceChildren(result);
    evalSnippet(editor.state.sliceDoc(), result);
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
    const link = links[currentIndex - 1];
    if (link) location.hash = link.hash;
  });
  next.addEventListener("click", () => {
    const link = links[currentIndex + 1];
    if (link) location.hash = link.hash;
  });
  window.addEventListener("hashchange", showLesson);
  showLesson();
  tour.hidden = false;
}
