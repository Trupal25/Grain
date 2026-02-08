import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found in .env.local');
        return;
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        console.log('--- REFETCHING MODELS WITH NEW API KEY ---');
        const response = await (genAI as any).models.list();

        const models = (response as any).pageInternal || [];
        if (models.length > 0) {
            models.forEach((m: any) => {
                console.log(`- ${m.name}`);
            });
        } else {
            console.log('No models found or different response structure.');
            console.log('Raw Response:', JSON.stringify(response, null, 2));
        }
        console.log('-----------------------------------------');
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
