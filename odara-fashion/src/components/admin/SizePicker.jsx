import { useState } from 'react'
import { sortSizes } from '../../utils/sizes'

// Tap preset sizes, or type any size of your own ("50 ml", "One size"…) and press Enter / Add.
// Sizes you typed show up as chips you can tap again to remove.
export default function SizePicker({ value = [], onChange, groups, small = false, placeholder = 'e.g. 75 ml' }) {
  const [text, setText] = useState('')
  const preset = new Set(groups.flat())
  const customs = value.filter(v => !preset.has(v))

  const toggle = (s) => onChange(value.includes(s) ? value.filter(x => x !== s) : sortSizes([...value, s]))

  const add = () => {
    const t = text.trim().replace(/\s+/g, ' ').slice(0, 20)
    if (!t) return
    if (!value.some(v => v.toLowerCase() === t.toLowerCase())) onChange(sortSizes([...value, t]))
    setText('')
  }

  const chip = (s, custom = false) => (
    <button
      key={s}
      type="button"
      className={`admin-size-chip ${small ? 'admin-size-chip-sm' : ''} ${value.includes(s) ? 'is-selected' : ''}`}
      onClick={() => toggle(s)}
      title={custom ? 'Tap to remove' : undefined}
    >
      {s}{custom ? ' ×' : ''}
    </button>
  )

  return (
    <div className="size-picker">
      {groups.map((g, gi) => (
        <div key={gi} className={`admin-size-group ${gi ? 'mt-1.5' : ''}`}>{g.map(s => chip(s))}</div>
      ))}
      {customs.length > 0 && <div className="admin-size-group mt-1.5">{customs.map(s => chip(s, true))}</div>}
      <div className="size-picker-add">
        <input
          className="admin-input"
          value={text}
          maxLength={20}
          placeholder={placeholder}
          aria-label="Add your own size"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="admin-btn-secondary" onClick={add}>Add size</button>
      </div>
    </div>
  )
}
