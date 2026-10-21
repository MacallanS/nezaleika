/**
 * Safe-area fillers (html.app-rr-shell::before/::after) при app-overlay-open.
 * Любой dimmer / bottom sheet / drawer — строго выше.
 */
export const APP_SAFE_AREA_FILLER_Z_INDEX = 9999;

/** Overlay BaseModal и аналогов (Teleport to body). */
export const MODAL_OVERLAY_Z_INDEX = 10000;

/** Bottom sheet / RrBottomSheet — выше app-overlay safe-area fillers. */
export const BOTTOM_SHEET_Z_INDEX = 10050;

/** Sidebar drawer + immersive fullscreen (camera, preview). */
export const NAV_DRAWER_Z_INDEX = 10050;

/** Teleport-выпадашки, календари и bottom-sheet селектов поверх модалок. */
export const FLOATING_LAYER_Z_INDEX = 100000;
