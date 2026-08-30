/** Turns an indented bullet-outline string (2 spaces per level, "- " prefix) into rows. */
export function parseMindmap(value: string): { text: string; level: number }[] {
  return value
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const indent = line.match(/^ */)?.[0].length ?? 0;
      const level = Math.floor(indent / 2);
      const text = line.trim().replace(/^-\s*/, '');
      return { text, level };
    });
}
