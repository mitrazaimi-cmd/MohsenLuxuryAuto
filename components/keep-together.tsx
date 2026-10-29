/**
 * Keeps "Mercedes-Benz" on one line in a heading: browsers may otherwise wrap at its hyphen
 * ("Mercedes- / Benz").
 */
export function keepTogether(text: string) {
  return text.split(/(Mercedes-Benz)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
