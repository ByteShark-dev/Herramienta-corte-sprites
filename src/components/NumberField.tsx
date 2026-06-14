interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  min?: number
  step?: number
  hint?: string
}

export const NumberField = ({
  label,
  value,
  onChange,
  disabled = false,
  min = 0,
  step = 1,
  hint,
}: NumberFieldProps) => (
  <label className="field">
    <span className="field__label">{label}</span>
    <input
      className="field__input"
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
      disabled={disabled}
      min={min}
      step={step}
    />
    {hint ? <span className="field__hint">{hint}</span> : null}
  </label>
)
