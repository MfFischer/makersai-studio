const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export async function generateScadImageAndSvg(
  userPrompt: string,
  dimensions?: PrintDimensions,
  colors?: string[]
): Promise<GeneratedData> {
  const response = await fetch(`${API_URL}/api/generate/model`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: userPrompt,
      dimensions,
      colors,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate model');
  }

  const result = await response.json();
  return result.data;
}

export async function generateConstructionPlan(
  userPrompt: string,
  availableColors: string[]
): Promise<ConstructionPartPlan[]> {
  const response = await fetch(`${API_URL}/api/generate/construction-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: userPrompt,
      availableColors,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate construction plan');
  }

  const result = await response.json();
  return result.data;
}

