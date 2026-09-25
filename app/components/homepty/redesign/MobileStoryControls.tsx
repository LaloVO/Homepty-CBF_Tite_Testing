export default function MobileStoryControls({
  active,
  selectStory,
}: {
  active: number;
  selectStory: (index: number) => void;
}) {
  return (
    <div className="mobile-story-controls">
      <p>{"Explora las cinco vistas"}</p>
      <div>
        <button
          type="button"
          onClick={() => selectStory(active - 1)}
          disabled={active === 0}
          aria-label="Vista anterior"
        >
          {"← Anterior"}
        </button>
        <span aria-live="polite">{`${active + 1} / 5`}</span>
        <button
          type="button"
          onClick={() => selectStory(active + 1)}
          disabled={active === 4}
          aria-label="Vista siguiente"
        >
          {"Siguiente →"}
        </button>
      </div>
    </div>
  );
}
