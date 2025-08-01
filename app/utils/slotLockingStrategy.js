export function slotLockingStrategy(items, activeId, overId, lockedIndexes) {
  const oldIndex = items.indexOf(activeId);
  const newIndex = items.indexOf(overId);

  // If either the dragged item or the target position is locked, cancel the move
  if (lockedIndexes.includes(oldIndex) || lockedIndexes.includes(newIndex)) {
    return items;
  }

  const unlockedItems = items.filter((_, i) => !lockedIndexes.includes(i));
  const lockedMap = items.reduce((acc, item, i) => {
    if (lockedIndexes.includes(i)) acc[i] = item;
    return acc;
  }, {});

  const unlockedOldIndex = unlockedItems.indexOf(activeId);
  const unlockedNewIndex = unlockedItems.indexOf(overId);

  const reordered = [...unlockedItems];
  const [moved] = reordered.splice(unlockedOldIndex, 1);
  reordered.splice(unlockedNewIndex, 0, moved);

  const final = [];
  let u = 0;

  for (let i = 0; i < items.length; i++) {
    final[i] = lockedIndexes.includes(i) ? lockedMap[i] : reordered[u++];
  }

  return final;
}
