import type { EditableStyleSet } from '../../../shared/style-schema';

type Props = {
  target: string | null;
  values: EditableStyleSet;
  onChange: (styles: EditableStyleSet) => void;
};

function inputValue(values: EditableStyleSet, key: keyof EditableStyleSet): string {
  return values[key] ?? '';
}

export function StylePanel({ target, values, onChange }: Props) {
  if (!target) {
    return <div>Selecciona un element editable.</div>;
  }

  return (
    <div>
      <h2>Edició: {target}</h2>

      <div className="grid-form">
        <label>
          Font size
          <input
            value={inputValue(values, 'fontSize')}
            onChange={(e) => onChange({ fontSize: e.target.value })}
            placeholder="32px"
          />
        </label>

        <label>
          Font weight
          <input
            value={inputValue(values, 'fontWeight')}
            onChange={(e) => onChange({ fontWeight: e.target.value })}
            placeholder="700"
          />
        </label>

        <label>
          Text color
          <input
            value={inputValue(values, 'color')}
            onChange={(e) => onChange({ color: e.target.value })}
            placeholder="#222222"
          />
        </label>

        <label>
          Background color
          <input
            value={inputValue(values, 'backgroundColor')}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            placeholder="#ffffff"
          />
        </label>

        <label>
          Margin bottom
          <input
            value={inputValue(values, 'marginBottom')}
            onChange={(e) => onChange({ marginBottom: e.target.value })}
            placeholder="16px"
          />
        </label>

        <label>
          Padding top
          <input
            value={inputValue(values, 'paddingTop')}
            onChange={(e) => onChange({ paddingTop: e.target.value })}
            placeholder="12px"
          />
        </label>

        <label>
          Border width
          <input
            value={inputValue(values, 'borderWidth')}
            onChange={(e) => onChange({ borderWidth: e.target.value })}
            placeholder="1px"
          />
        </label>

        <label>
          Border color
          <input
            value={inputValue(values, 'borderColor')}
            onChange={(e) => onChange({ borderColor: e.target.value })}
            placeholder="#cccccc"
          />
        </label>

        <label>
          Border radius
          <input
            value={inputValue(values, 'borderRadius')}
            onChange={(e) => onChange({ borderRadius: e.target.value })}
            placeholder="8px"
          />
        </label>
      </div>
    </div>
  );
}
