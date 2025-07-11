import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function parsePromptToFilters(prompt: string) {
  const systemPrompt = `Convert user housing search prompts into JSON with keys: location, minPrice, maxPrice, beds, propertyType, petFriendly`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });

  const json = response.choices[0].message?.content ?? "{}";
  return JSON.parse(json);
}
