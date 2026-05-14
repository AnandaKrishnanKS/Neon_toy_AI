import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createProductSlug } from "@/lib/utils";

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    const { messages } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env" },
        { status: 500 }
      );
    }

    // Fetch store inventory to give Neon context
    let inventoryContext = "Currently, there is no inventory data available.";
    try {
      const res = await query('SELECT id, name, description, price FROM products');
      if (res.rows && res.rows.length > 0) {
        const productList = res.rows.map(p => `- [${p.name}](/product/${createProductSlug(p.id, p.name)}) (Price: ₹${p.price})`).join('\n');
        inventoryContext = `INVENTORY CATALOG:\n${productList}\n\nCRITICAL RULE: You MUST use the EXACT markdown hyperlink provided in the catalog above EVERY SINGLE TIME you mention a toy. Never just type the toy name. Example: If you recommend the Arcade, you MUST type [Retro Arcade Machine](/product/retro-arcade-machine-5). Failure to use the exact markdown link is a critical error.`;
      }
    } catch (dbError) {
      console.error("Failed to fetch inventory for chat context", dbError);
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are Neon, a playful toy expert for ToTToys. Help customers find toys, explain them, and suggest ways to play. Keep your tone vibrant and futuristic.\n\n${inventoryContext}`,
    });

    // Convert message history for Gemini
    // Filter out any initial bot greeting if it's the first message
    const filteredMessages = messages[0].role === 'bot' ? messages.slice(1) : messages;
    
    const history = filteredMessages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from Gemini" },
      { status: 500 }
    );
  }
}
