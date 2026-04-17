// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Groq Chatbot Microservice Running",
  });
});

// Chatbot Route
app.post("/api/chat", async (req, res) => {
  try {
    const { question, product, history = [] } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const productContext = product
      ? `
Product Name: ${product.name || "N/A"}
Category: ${product.category || "N/A"}
Price: ${product.price || "N/A"}
Description: ${product.description || "N/A"}
`
      : "";

    const systemPrompt = `
You are a helpful e-commerce AI assistant.

Your job is to answer customer questions about products in a simple, short, and friendly way.

${productContext}
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },

      // Previous chat history
      ...history,

      // Current user question
      {
        role: "user",
        content: question,
      },
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.4,
      max_tokens: 300,
    });

    const reply = chatCompletion.choices[0].message.content;

    res.status(200).json({
      success: true,
      question,
      reply,
    });
  } catch (error) {
    console.error("Groq AI Error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Failed to generate chatbot response",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 