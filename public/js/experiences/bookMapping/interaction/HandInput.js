export function createHandInput({ hands = [], pointer = null } = {}) {
  const normalizedHands = hands.map((hand) => ({
    source: "hand",
    index: {
      x: hand.indexTip?.x ?? 0,
      y: hand.indexTip?.y ?? 0,
      world: hand.indexWorld ?? null
    },
    palm: {
      x: hand.palmCenter?.x ?? 0,
      y: hand.palmCenter?.y ?? 0,
      world: hand.palmWorld ?? null
    }
  }));

  if (!normalizedHands.length && pointer) {
    normalizedHands.push({
      source: "mouse",
      index: {
        x: pointer.x,
        y: pointer.y,
        world: pointer.world ?? null
      },
      palm: {
        x: pointer.x,
        y: pointer.y,
        world: pointer.world ?? null
      }
    });
  }

  return {
    detected: normalizedHands.length > 0,
    source: normalizedHands[0]?.source ?? "none",
    primaryHand: normalizedHands[0] ?? null,
    hands: normalizedHands
  };
}
