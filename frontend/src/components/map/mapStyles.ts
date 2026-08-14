import type { StyleSpecification } from 'maplibre-gl'

export type MapStyleId = 'cyber' | 'satellite' | 'mono'

const CARTO_GLYPHS = 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf'

/** Esri World Imagery — free for attribution-credited use, no token. */
const satellite: StyleSpecification = {
  version: 8,
  glyphs: CARTO_GLYPHS,
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'esri' },
    // subtle dark scrim keeps neon overlays legible on bright imagery
    {
      id: 'satellite-scrim',
      type: 'background',
      paint: { 'background-color': 'rgba(4,8,18,0.25)' },
    },
  ],
}

/** CARTO dark raster, desaturated and contrast-boosted → night-ops monochrome. */
const mono: StyleSpecification = {
  version: 8,
  glyphs: CARTO_GLYPHS,
  sources: {
    'carto-raster': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    {
      id: 'mono',
      type: 'raster',
      source: 'carto-raster',
      paint: {
        'raster-saturation': -1,
        'raster-contrast': 0.35,
        'raster-brightness-min': 0.02,
      },
    },
  ],
}

export const MAP_STYLES: Record<
  MapStyleId,
  { label: string; spec: string | StyleSpecification }
> = {
  cyber: {
    label: 'Cyber Dark',
    spec: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  satellite: { label: 'Satellite', spec: satellite },
  mono: { label: 'Night Ops', spec: mono },
}
