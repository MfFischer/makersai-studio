import {
  getPrinterProfile,
  validateDimensions,
  validateLaserDimensions,
  getOptimizationSuggestions,
  PRINTER_PROFILES,
} from '../config/printerProfiles';

describe('Printer Profiles', () => {
  describe('getPrinterProfile', () => {
    it('should return Kobra 3 Combo profile', () => {
      const profile = getPrinterProfile('anycubic-kobra-3-combo');
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('Anycubic Kobra 3 Combo');
      expect(profile?.buildVolume.width).toBe(250);
    });

    it('should return null for invalid profile', () => {
      const profile = getPrinterProfile('invalid-profile');
      expect(profile).toBeNull();
    });

    it('should have laser area for Kobra 3 Combo', () => {
      const profile = getPrinterProfile('anycubic-kobra-3-combo');
      expect(profile?.laserArea).toBeDefined();
      expect(profile?.laserArea?.width).toBe(400);
      expect(profile?.laserArea?.height).toBe(400);
    });
  });

  describe('validateDimensions', () => {
    it('should validate dimensions within build volume', () => {
      const result = validateDimensions(200, 200, 200, 'anycubic-kobra-3-combo');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject dimensions exceeding width', () => {
      const result = validateDimensions(300, 200, 200, 'anycubic-kobra-3-combo');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Width 300mm exceeds printer build volume (250mm)');
    });

    it('should reject dimensions exceeding height', () => {
      const result = validateDimensions(200, 200, 300, 'anycubic-kobra-3-combo');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Height 300mm exceeds printer build volume (260mm)');
    });

    it('should reject invalid profile', () => {
      const result = validateDimensions(200, 200, 200, 'invalid-profile');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid printer profile');
    });
  });

  describe('validateLaserDimensions', () => {
    it('should validate laser dimensions within area', () => {
      const result = validateLaserDimensions(350, 350, 'anycubic-kobra-3-combo');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject dimensions exceeding laser area', () => {
      const result = validateLaserDimensions(450, 350, 'anycubic-kobra-3-combo');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Width 450mm exceeds laser area (400mm)');
    });

    it('should reject for printer without laser', () => {
      const result = validateLaserDimensions(200, 200, 'generic-fdm');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Printer does not support laser engraving');
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should suggest caution for large designs', () => {
      const suggestions = getOptimizationSuggestions(
        { width: 240, height: 240, depth: 240 },
        'anycubic-kobra-3-combo'
      );
      expect(suggestions).toContain(
        'Design is close to printer limits. Consider adding supports or splitting into parts.'
      );
    });

    it('should suggest base for tall designs', () => {
      const suggestions = getOptimizationSuggestions(
        { width: 50, height: 50, depth: 200 },
        'anycubic-kobra-3-combo'
      );
      expect(suggestions).toContain(
        'Tall narrow design detected. Consider adding a wider base for stability.'
      );
    });

    it('should mention auto-leveling', () => {
      const suggestions = getOptimizationSuggestions(
        { width: 100, height: 100, depth: 100 },
        'anycubic-kobra-3-combo'
      );
      expect(suggestions).toContain(
        'Auto-leveling enabled. First layer adhesion should be optimal.'
      );
    });

    it('should return empty array for invalid profile', () => {
      const suggestions = getOptimizationSuggestions(
        { width: 100, height: 100, depth: 100 },
        'invalid-profile'
      );
      expect(suggestions).toEqual([]);
    });
  });

  describe('PRINTER_PROFILES', () => {
    it('should have all required profiles', () => {
      expect(PRINTER_PROFILES['anycubic-kobra-3-combo']).toBeDefined();
      expect(PRINTER_PROFILES['anycubic-kobra-2']).toBeDefined();
      expect(PRINTER_PROFILES['generic-fdm']).toBeDefined();
    });

    it('should have consistent structure', () => {
      Object.values(PRINTER_PROFILES).forEach((profile) => {
        expect(profile.id).toBeDefined();
        expect(profile.name).toBeDefined();
        expect(profile.buildVolume).toBeDefined();
        expect(profile.buildVolume.width).toBeGreaterThan(0);
        expect(profile.buildVolume.depth).toBeGreaterThan(0);
        expect(profile.buildVolume.height).toBeGreaterThan(0);
        expect(profile.features).toBeDefined();
      });
    });
  });
});

