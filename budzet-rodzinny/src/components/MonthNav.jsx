export default function MonthNav({ label, onChange }) {
  return (
    <div className="mnav">
      <button className="mnav-btn" onClick={() => onChange(-1)}>‹</button>
      <h2>{label}</h2>
      <button className="mnav-btn" onClick={() => onChange(1)}>›</button>
    </div>
  )
}
