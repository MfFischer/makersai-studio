export interface PrinterProfile {
  id: string;
  name: string;
  manufacturer: string;
  buildVolume: {
    width: number;
    depth: number;
    height: number;
  };
  laserArea?: {
    width: number;
    height: number;
  };
  nozzleDiameter: number;
  maxPrintSpeed: number;
  supportedMaterials: string[];
  recommendedLayerHeight: {
    min: number;
    max: number;
    default: number;
  };
  recommendedWallThickness: {
    min: number;
    default: number;
  };
  features: {
    autoLeveling: boolean;
    dualExtruder: boolean;
    heatedBed: boolean;
    enclosure: boolean;
    laserEngraving: boolean;
  };
}

export const PRINTER_PROFILES: Record<string, PrinterProfile> = {
  'anycubic-kobra-3-combo': {
    id: 'anycubic-kobra-3-combo',
    name: 'Anycubic Kobra 3 Combo',
    manufacturer: 'Anycubic',
    buildVolume: {
      width: 250,
      depth: 250,
      height: 260,
    },
    laserArea: {
      width: 400,
      height: 400,
    },
    nozzleDiameter: 0.4,
    maxPrintSpeed: 500,
    supportedMaterials: ['PLA', 'PETG', 'TPU', 'ABS'],
    recommendedLayerHeight: {
      min: 0.1,
      max: 0.3,
      default: 0.2,
    },
    recommendedWallThickness: {
      min: 0.8,
      default: 1.2,
    },
    features: {
      autoLeveling: true,
      dualExtruder: false,
      heatedBed: true,
      enclosure: false,
      laserEngraving: true,
    },
  },
  'anycubic-kobra-2': {
    id: 'anycubic-kobra-2',
    name: 'Anycubic Kobra 2',
    manufacturer: 'Anycubic',
    buildVolume: {
      width: 250,
      depth: 220,
      height: 220,
    },
    nozzleDiameter: 0.4,
    maxPrintSpeed: 300,
    supportedMaterials: ['PLA', 'PETG', 'TPU'],
    recommendedLayerHeight: {
      min: 0.1,
      max: 0.3,
      default: 0.2,
    },
    recommendedWallThickness: {
      min: 0.8,
      default: 1.2,
    },
    features: {
      autoLeveling: true,
      dualExtruder: false,
      heatedBed: true,
      enclosure: false,
      laserEngraving: false,
    },
  },
  'generic-fdm': {
    id: 'generic-fdm',
    name: 'Generic FDM Printer',
    manufacturer: 'Generic',
    buildVolume: {
      width: 200,
      depth: 200,
      height: 200,
    },
    nozzleDiameter: 0.4,
    maxPrintSpeed: 200,
    supportedMaterials: ['PLA', 'PETG'],
    recommendedLayerHeight: {
      min: 0.1,
      max: 0.3,
      default: 0.2,
    },
    recommendedWallThickness: {
      min: 0.8,
      default: 1.2,
    },
    features: {
      autoLeveling: false,
      dualExtruder: false,
      heatedBed: true,
      enclosure: false,
      laserEngraving: false,
    },
  },
};

export function getPrinterProfile(profileId: string): PrinterProfile | null {
  return PRINTER_PROFILES[profileId] || null;
}

export function validateDimensions(
  width: number,
  depth: number,
  height: number,
  profileId: string
): { valid: boolean; errors: string[] } {
  const profile = getPrinterProfile(profileId);
  if (!profile) {
    return { valid: false, errors: ['Invalid printer profile'] };
  }

  const errors: string[] = [];

  if (width > profile.buildVolume.width) {
    errors.push(
      `Width ${width}mm exceeds printer build volume (${profile.buildVolume.width}mm)`
    );
  }

  if (depth > profile.buildVolume.depth) {
    errors.push(
      `Depth ${depth}mm exceeds printer build volume (${profile.buildVolume.depth}mm)`
    );
  }

  if (height > profile.buildVolume.height) {
    errors.push(
      `Height ${height}mm exceeds printer build volume (${profile.buildVolume.height}mm)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLaserDimensions(
  width: number,
  height: number,
  profileId: string
): { valid: boolean; errors: string[] } {
  const profile = getPrinterProfile(profileId);
  if (!profile) {
    return { valid: false, errors: ['Invalid printer profile'] };
  }

  if (!profile.laserArea) {
    return { valid: false, errors: ['Printer does not support laser engraving'] };
  }

  const errors: string[] = [];

  if (width > profile.laserArea.width) {
    errors.push(
      `Width ${width}mm exceeds laser area (${profile.laserArea.width}mm)`
    );
  }

  if (height > profile.laserArea.height) {
    errors.push(
      `Height ${height}mm exceeds laser area (${profile.laserArea.height}mm)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getOptimizationSuggestions(
  dimensions: { width: number; height: number; depth: number },
  profileId: string
): string[] {
  const profile = getPrinterProfile(profileId);
  if (!profile) return [];

  const suggestions: string[] = [];

  // Check if dimensions are close to limits
  const widthUsage = (dimensions.width / profile.buildVolume.width) * 100;
  const depthUsage = (dimensions.depth / profile.buildVolume.depth) * 100;
  const heightUsage = (dimensions.height / profile.buildVolume.height) * 100;

  if (widthUsage > 90 || depthUsage > 90 || heightUsage > 90) {
    suggestions.push(
      'Design is close to printer limits. Consider adding supports or splitting into parts.'
    );
  }

  // Check if any dimension is significantly larger than the others (tall/narrow design)
  const dims = [dimensions.width, dimensions.height, dimensions.depth];
  const maxDim = Math.max(...dims);
  const minDim = Math.min(...dims);

  if (maxDim > minDim * 3) {
    suggestions.push(
      'Tall narrow design detected. Consider adding a wider base for stability.'
    );
  }

  if (profile.features.autoLeveling) {
    suggestions.push('Auto-leveling enabled. First layer adhesion should be optimal.');
  }

  return suggestions;
}

