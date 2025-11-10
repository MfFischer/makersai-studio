import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config/env.js';
import { cache } from '../config/redis.js';
import crypto from 'crypto';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

export interface GeneratedData {
  scadCode: string;
  imageUrl: string;
  svgCode: string | null;
}

export interface ConstructionPartPlan {
  partName: string;
  prompt: string;
  color: string;
}

interface PrintDimensions {
  width: number;
  height: number;
}

// Generate cache key from input parameters
const generateCacheKey = (prefix: string, data: any): string => {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  return `${prefix}:${hash}`;
};

// Get from cache
const getFromCache = (key: string): any | null => {
  if (!config.features.caching) {
    return null;
  }

  try {
    return cache.get(key) || null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

// Set to cache
const setToCache = (key: string, value: any, ttl?: number): void => {
  if (!config.features.caching) {
    return;
  }

  try {
    cache.set(key, value, ttl || config.cache.ttl);
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

// Generate construction plan
export async function generateConstructionPlan(
  userPrompt: string,
  availableColors: string[]
): Promise<ConstructionPartPlan[]> {
  const cacheKey = generateCacheKey('construction-plan', { userPrompt, availableColors });

  // Check cache
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('✅ Construction plan served from cache');
    return cached;
  }

  const model = 'gemini-2.5-pro';
  const schema = {
    type: Type.OBJECT,
    properties: {
      parts: {
        type: Type.ARRAY,
        description: 'An array of all the individual parts needed to build the object.',
        items: {
          type: Type.OBJECT,
          properties: {
            partName: {
              type: Type.STRING,
              description: "A short, descriptive name for this specific part (e.g., 'Chair Leg', 'Tabletop').",
            },
            prompt: {
              type: Type.STRING,
              description: 'A detailed and specific prompt for another AI to generate just this one part as an OpenSCAD 3D model. Include precise dimensions if possible.',
            },
            color: {
              type: Type.STRING,
              description: 'The color to assign to this part from the available colors.',
            },
          },
          required: ['partName', 'prompt', 'color'],
        },
      },
    },
    required: ['parts'],
  };

  const systemInstruction = `You are an expert at breaking down complex 3D objects into individual, manufacturable parts for construction kits.
Given a high-level description of an object, decompose it into separate parts that can be 3D printed individually and assembled.
Each part should be simple enough to print on its own. Assign a color from the available colors: ${availableColors.join(', ')}.
If there are more parts than colors, reuse colors intelligently.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (!parsed.parts || !Array.isArray(parsed.parts)) {
      throw new Error('Invalid response structure from API.');
    }

    const result = parsed.parts as ConstructionPartPlan[];

    // Cache the result
    setToCache(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error generating construction plan:', error);
    throw new Error('Failed to generate the construction plan. The model may have returned an invalid response.');
  }
}

// Generate OpenSCAD, SVG, and image prompt
async function generateOutputs(
  userPrompt: string,
  dimensions?: PrintDimensions,
  colors?: string[]
): Promise<{ scadCode: string; imagePrompt: string; svgCode: string | null }> {
  const cacheKey = generateCacheKey('outputs', { userPrompt, dimensions, colors });

  // Check cache
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('✅ Outputs served from cache');
    return cached;
  }

  const model = 'gemini-2.5-pro';

  const schema = {
    type: Type.OBJECT,
    properties: {
      scadCode: {
        type: Type.STRING,
        description: 'The complete and valid OpenSCAD code for the 3D model.',
      },
      imagePrompt: {
        type: Type.STRING,
        description: 'A detailed text prompt for an image generation model to create a photorealistic 3D render of the object.',
      },
      svgCode: {
        type: Type.STRING,
        description: "The complete and valid SVG code for a 2D laser cutting profile. This should be a projection of the 3D model onto the XY plane. If a 2D representation is not possible or doesn't make sense, this should be an empty string.",
      },
    },
    required: ['scadCode', 'imagePrompt', 'svgCode'],
  };

  let systemInstruction = `You are an expert OpenSCAD programmer and 3D modeling assistant.
Generate valid, well-commented OpenSCAD code based on the user's description.
Also generate an SVG for laser cutting if applicable (2D projection).
Provide a detailed image prompt for visualization.`;

  if (dimensions) {
    systemInstruction += `\n\nThe laser cutting area is ${dimensions.width}mm x ${dimensions.height}mm. Ensure the design fits within these bounds.`;
  }

  if (colors && colors.length > 0) {
    systemInstruction += `\n\nUse these colors in the OpenSCAD code: ${colors.join(', ')}. Apply them using the color() module.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (
      typeof parsed.scadCode === 'undefined' ||
      typeof parsed.imagePrompt === 'undefined' ||
      typeof parsed.svgCode === 'undefined'
    ) {
      throw new Error('Invalid JSON structure received from API. Missing required keys.');
    }

    const result = {
      scadCode: parsed.scadCode,
      imagePrompt: parsed.imagePrompt,
      svgCode: parsed.svgCode.trim() ? parsed.svgCode : null,
    };

    // Cache the result
    setToCache(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error generating outputs:', error);
    throw new Error('Failed to generate OpenSCAD code and outputs.');
  }
}

// Generate image from prompt
async function generateImageFromPrompt(imagePrompt: string): Promise<string> {
  const cacheKey = generateCacheKey('image', { imagePrompt });

  // Check cache
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('✅ Image served from cache');
    return cached;
  }

  const model = 'imagen-4.0';
  const fullPrompt = `${imagePrompt} High quality 3D render, professional lighting, clean background.`;

  try {
    const response = await ai.models.generateImages({
      model: model,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/png;base64,${base64ImageBytes}`;

      // Cache the result
      setToCache(cacheKey, imageUrl);

      return imageUrl;
    } else {
      throw new Error('No image was generated.');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error("Failed to generate the model's image visualization.");
  }
}

// Main orchestrated function
export async function generateScadImageAndSvg(
  userPrompt: string,
  dimensions?: PrintDimensions,
  colors?: string[]
): Promise<GeneratedData> {
  const { scadCode, imagePrompt, svgCode } = await generateOutputs(userPrompt, dimensions, colors);
  const imageUrl = await generateImageFromPrompt(imagePrompt);

  return {
    scadCode,
    imageUrl,
    svgCode,
  };
}

