import { site } from "@/config/site";

/** `boxed` turns each figure into a gold box (homepage). */
export function Stats({ boxed = false }: { boxed?: boolean }) {
  return (
    <ul className={`stats${boxed ? " boxed" : ""} reveal`} aria-label="Track record" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {site.stats.map((s) => (
        <li className={boxed ? "stat gold-hover" : "stat"} key={s.label}>
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
