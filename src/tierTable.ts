export function calculateTierColumnOffset(
  currentTierIndex: number,
  columnWidth: number,
  columnCount: number,
  viewportWidth: number
) {
  if (viewportWidth <= 0 || columnWidth <= 0 || columnCount <= 0) {
    return 0;
  }

  const contentWidth = columnWidth * columnCount;
  const centeredOffset =
    currentTierIndex * columnWidth - (viewportWidth - columnWidth) / 2;
  const maximumOffset = Math.max(0, contentWidth - viewportWidth);

  return Math.min(maximumOffset, Math.max(0, centeredOffset));
}
