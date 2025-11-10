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

export interface ImageToModelInput {
  imageBase64: string;
  mimeType: string;
  additionalPrompt?: string;
  dimensions?: PrintDimensions;
  colors?: string[];
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

    if (!response.text) {
      throw new Error('No response text from API');
    }
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

    if (!response.text) {
      throw new Error('No response text from API');
    }
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
      const imageData = response.generatedImages[0]?.image?.imageBytes;
      if (!imageData) {
        throw new Error('No image data in response');
      }
      const imageUrl = `data:image/png;base64,${imageData}`;

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

// Image-to-3D conversion function
export async function generateModelFromImage(
  input: ImageToModelInput
): Promise<GeneratedData> {
  const cacheKey = generateCacheKey('image-to-model', {
    image: input.imageBase64.substring(0, 100), // Use first 100 chars for cache key
    prompt: input.additionalPrompt,
    dimensions: input.dimensions,
  });

  // Check cache
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log('✅ Returning cached image-to-model result');
    return cached;
  }

  console.log('🖼️  Generating 3D model from image...');

  const model = 'gemini-2.0-flash-exp';

  // Build the prompt
  let promptText = `Analyze this image and create a 3D model in OpenSCAD code.

Instructions:
1. Carefully examine the image to understand the object's shape, proportions, and features
2. Generate OpenSCAD code that recreates this object as a 3D printable model
3. Make reasonable assumptions about depth/thickness if not visible in the image
4. Ensure the model is printable (no floating parts, proper support)
5. Add appropriate details and features visible in the image`;

  if (input.additionalPrompt) {
    promptText += `\n6. Additional instructions: ${input.additionalPrompt}`;
  }

  if (input.dimensions) {
    promptText += `\n7. Target dimensions: ${input.dimensions.width}mm × ${input.dimensions.height}mm`;
  }

  // Create the schema for structured output
  const schema = {
    type: Type.OBJECT,
    properties: {
      scadCode: {
        type: Type.STRING,
        description: 'Complete OpenSCAD code for the 3D model',
      },
      imagePrompt: {
        type: Type.STRING,
        description: 'Detailed prompt for generating a realistic preview image',
      },
      svgCode: {
        type: Type.STRING,
        description: 'SVG code for laser cutting profile (if applicable)',
        nullable: true,
      },
      analysis: {
        type: Type.STRING,
        description: 'Brief analysis of what was detected in the image',
      },
    },
    required: ['scadCode', 'imagePrompt', 'analysis'],
  };

  try {
    // Generate the model using vision capabilities
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
            { text: promptText },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.3,
      },
    });

    if (!response.text) {
      throw new Error('No response text from API');
    }

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (!parsed.scadCode || !parsed.imagePrompt) {
      throw new Error('Invalid response structure from API');
    }

    console.log(`📊 Image Analysis: ${parsed.analysis}`);

    // Generate preview image
    const imageUrl = await generateImageFromPrompt(parsed.imagePrompt);

    const result: GeneratedData = {
      scadCode: parsed.scadCode,
      imageUrl: imageUrl,
      svgCode: parsed.svgCode || null,
    };

    // Cache the result
    setToCache(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error generating model from image:', error);
    throw new Error('Failed to generate 3D model from image. Please try again.');
  }
}

