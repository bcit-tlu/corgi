/**
 * Type augmentations for OpenSeadragon 6.x APIs not yet covered by
 * @types/openseadragon (currently pinned to 5.x).
 *
 * Remove this file once @types/openseadragon ships a 6.x release.
 */
import 'openseadragon'

declare module 'openseadragon' {
  interface Options {
    /** Show rotate-left / rotate-right buttons in the toolbar. */
    showRotationControl?: boolean
  }

  interface GestureSettings {
    /** Enable pinch-rotate gesture on touch devices. */
    pinchRotate?: boolean
  }
}
