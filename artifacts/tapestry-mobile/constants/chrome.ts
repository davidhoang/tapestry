/**
 * Layout dimensions for the Tapestry mobile navigation chrome.
 *
 * These constants are used by both the tab layout (to size and position
 * the floating glass pill) and individual screens (to pad their scroll
 * content so it isn't hidden behind the bar).
 */
export const TAB_BAR = {
  /** Visible height of the floating pill (excludes safe-area bottom inset). */
  height: 60,
  /** Gap between the bottom of the pill and the safe-area bottom inset. */
  marginBottom: 14,
  /** Gap between the pill's left/right edges and the screen edges. */
  marginHorizontal: 16,
  /** Pill corner radius. */
  radius: 28,
};

/**
 * Total vertical space the floating tab bar occupies above the safe-area.
 * Add `insets.bottom + TAB_BAR_OFFSET` (plus your own breathing room) to
 * a screen's `paddingBottom` so content can fully scroll past the bar.
 */
export const TAB_BAR_OFFSET = TAB_BAR.height + TAB_BAR.marginBottom;
