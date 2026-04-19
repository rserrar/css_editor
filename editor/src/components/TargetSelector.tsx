type Props = {
  targets: string[];
  selected: string | null;
  onSelect: (target: string) => void;
};

export function TargetSelector({ targets, selected, onSelect }: Props) {
  return (
    <div>
      <h2>Elements editables</h2>
      <ul>
        {targets.map((target) => (
          <li key={target}>
            <button
              type="button"
              onClick={() => onSelect(target)}
              style={{ fontWeight: selected === target ? 'bold' : 'normal' }}
            >
              {target}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
