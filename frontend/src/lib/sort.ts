const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

export const byName = (a: string, b: string): number => collator.compare(a, b);

export const byCategoryThenName = (
  a: { category: string; name: string },
  b: { category: string; name: string },
): number => collator.compare(a.category, b.category) || collator.compare(a.name, b.name);
