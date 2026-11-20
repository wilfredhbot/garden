const colors = ["#2b702b", "#589c45", "#f3ba38", "#ea8054", "#8536a8"];

export function celebrate(effect: string, origin: HTMLElement): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const bounds = origin.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "tour-celebration";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);

  const petal = effect === "petals";
  const spark = effect === "fireworks";
  const count = petal ? 24 : 48;
  const animations: Animation[] = [];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = spark ? "tour-spark" : petal ? "tour-petal" : "tour-confetti";
    if (petal) piece.textContent = ["🌻", "🌸", "🍃"][i % 3] ?? "";
    else piece.style.background = colors[i % colors.length] ?? "";
    layer.append(piece);

    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 130;
    const x = spark ? Math.cos(angle) * distance : (Math.random() - 0.5) * 380;
    const y = spark ? Math.sin(angle) * distance : 170 + Math.random() * 120;
    const left = petal
      ? bounds.left + Math.random() * bounds.width
      : bounds.left + bounds.width / 2;
    const top = bounds.top + (petal ? -16 : bounds.height / 2);
    piece.style.left = `${left}px`;
    piece.style.top = `${top}px`;

    const frames = spark
      ? [
          { transform: "scale(0.1)", opacity: 1 },
          { transform: `translate(${x}px, ${y}px) scale(0.4)`, opacity: 0 },
        ]
      : [
          { transform: "translate(0, 0)", opacity: 1 },
          { transform: `translate(${x * 0.45}px, ${petal ? 45 : -115}px) rotate(160deg)`, offset: 0.36 },
          { transform: `translate(${x}px, ${y}px) rotate(420deg)`, opacity: 0 },
        ];
    animations.push(
      piece.animate(frames, {
        duration: (spark ? 650 : 1150) + Math.random() * 450,
        delay: petal ? Math.random() * 330 : 0,
        easing: spark ? "ease-out" : "ease-in-out",
        fill: "both",
      }),
    );
  }

  void Promise.all(animations.map((animation) => animation.finished.catch(() => {})))
    .then(() => layer.remove());
}
