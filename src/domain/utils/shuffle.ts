export type RandomSource = () => number;

const defaultRandom: RandomSource = () => Math.random();

/** In-place Fisher–Yates shuffle; returns the same array reference. */
export function shuffleInPlace<T>(items: T[], random: RandomSource = defaultRandom): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}

export function shuffle<T>(items: T[], random: RandomSource = defaultRandom): T[] {
  return shuffleInPlace([...items], random);
}
