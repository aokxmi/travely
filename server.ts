import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Fallback generator if AI service is temporarily unavailable
function generateMockPlan(destination: string, days: number, budget: number, interest: string): string {
  const dailyBudget = Math.floor(budget / days);
  const stayCost = Math.floor(dailyBudget * 0.4);
  const transportCost = Math.floor(dailyBudget * 0.15);
  const rem = dailyBudget - stayCost - transportCost;
  const morningCost = Math.floor(rem * 0.3);
  const afternoonCost = Math.floor(rem * 0.4);
  const eveningCost = rem - morningCost - afternoonCost;

  let out = '';
  for (let d = 1; d <= days; d++) {
    out += `Day ${d}\n`;
    out += `- Morning: Explore top landmarks and breakfast in ${destination} focusing on ${interest || 'culture'} (Rs ${morningCost})\n`;
    out += `- Afternoon: Guided excursion and local tasting lunch (Rs ${afternoonCost})\n`;
    out += `- Evening: Sunset viewpoint, stroll and dinner (Rs ${eveningCost})\n`;
    out += `- Stay: Boutique guest stay near city centre (Rs ${stayCost})\n`;
    out += `- Transport: Local auto / metro pass for day ${d} (Rs ${transportCost})\n\n`;
  }
  const calcTotal = days * dailyBudget;
  out += `Total: Rs ${calcTotal}`;
  return out;
}

app.post('/api/plan', async (req: Request, res: Response) => {
  const { destination, days, budget, interest } = req.body;

  if (!destination || !days || !budget) {
    res.status(400).json({ error: 'Please provide destination, days, and budget.' });
    return;
  }

  const prompt = `You are my travel planner.
Destination: ${destination}
Days: ${days}
Budget: Rs ${budget} total
Interests: ${interest || 'general sightseeing and food'}

Rules:
- Plan 3 activities per day: morning, afternoon, evening.
- Give an estimated cost for each activity, plus a stay and local transport for each day.
- Write every cost as Rs and a plain number with no commas, like Rs 1300.
- Keep the total under the budget.
- End with one line: Total: Rs <number>

Format:
Day 1
- Morning: <activity> (Rs <cost>)
- Afternoon: <activity> (Rs <cost>)
- Evening: <activity> (Rs <cost>)
- Stay: <place, area> (Rs <cost>)
- Transport: <how> (Rs <cost>)

Total: Rs <number>

Output only the itinerary.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Use structured fallback planner
      const fallbackText = generateMockPlan(destination, Number(days), Number(budget), String(interest || ''));
      res.json({ text: fallbackText });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let text = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemma-4-26b-a4b-it',
        contents: prompt,
      });
      text = response.text || '';
    } catch (gemmaErr) {
      console.warn('Gemma 4 call error, falling back to gemini-3.8-flash:', gemmaErr);
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      text = response.text || '';
    }

    if (!text.trim()) {
      throw new Error('Empty response from model');
    }

    res.json({ text });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('AI plan error:', errorMsg);

    // Fallback gracefully so the applet keeps working
    try {
      const fallbackText = generateMockPlan(destination, Number(days), Number(budget), String(interest || ''));
      res.json({ text: fallbackText });
    } catch {
      res.status(500).json({ error: `Something went wrong: ${errorMsg}. Try again.` });
    }
  }
});

async function startServer() {
  const distDir = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distDir, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trip planner server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
