import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are MedAI, an intelligent healthcare assistant embedded in the MedQR Health Information System used in Uganda.

Your capabilities:
- Answer general medical questions and provide health information
- Explain clinical terms and procedures in simple language
- Guide users on how to use the MedQR system (episodes, prescriptions, lab tests, pharmacy)
- Provide general wellness, medication, and preventive health advice
- Help interpret common symptoms (always recommend seeing a doctor for diagnosis)

Important rules:
- You are NOT a replacement for a licensed doctor
- Always advise users to consult a healthcare professional for personal medical decisions
- Do not prescribe specific medications or dosages for individual patients
- Keep responses concise, helpful, and empathetic
- You operate within the context of the Ugandan healthcare system
- Format responses clearly using bullet points or numbered lists where appropriate`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add your GEMINI_API_KEY to .env.local.' },
        { status: 503 }
      );
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build chat history (exclude last user message — it's sent as the prompt)
    // Also drop any leading 'assistant' messages because Gemini requires history
    // to start with a 'user' turn.
    const priorMessages = messages.slice(0, -1);
    const firstUserIdx = priorMessages.findIndex(
      (m: { role: string }) => m.role === 'user'
    );
    const trimmed = firstUserIdx >= 0 ? priorMessages.slice(firstUserIdx) : [];

    const history = trimmed.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error('[Chat API Error]', err);
    return NextResponse.json(
      { error: err.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
