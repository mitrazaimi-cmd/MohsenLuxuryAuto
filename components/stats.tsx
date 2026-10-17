import { site } from "@/config/site";

export function Stats() {
  return (
    <ul className="stats reveal" aria-label="Track record" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {site.stats.map((s) => (
        <li className="stat" key={s.label}>
          <div className="v">
            {s.value}
            {s.unit ? <small>{s.unit}</small> : null}
          </div>
          <div className="bar" />
          <div className="l">{s.label}</div>
        </li>
      ))}
    </ul>
  );
}
