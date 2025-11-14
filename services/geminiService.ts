
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PosturePrompt } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated. The response may have been blocked.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image. Please check the prompt or try again later.");
  }
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No edited image was generated. The response may have been blocked.");

  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit image. Please check the prompt or try again later.");
  }
};


export const getPosturePrompts = async (): Promise<PosturePrompt[]> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Generate 8 detailed, creative image editing prompts for a generative AI model like 'nano banana' (gemini-2.5-flash-image).
      These prompts should focus on changing a person's posture in an existing photo. For example, 'Make the person stand up straight' or 'Change their pose to be sitting cross-legged'.
      Each prompt should include a short, catchy title and the detailed prompt text.
      Ensure the output is a valid JSON array of objects, where each object has 'title' and 'prompt' keys.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'The short, catchy title of the prompt.',
              },
              prompt: {
                type: Type.STRING,
                description: 'The detailed prompt for editing an image posture.',
              },
            },
            required: ["title", "prompt"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const prompts = JSON.parse(jsonString);
    return prompts as PosturePrompt[];
  } catch (error) {
    console.error("Error fetching posture prompts:", error);
    throw new Error("Failed to fetch posture prompt ideas.");
  }
};