import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ----------- ROUTES ----------- //

// Test route
app.get("/", (req, res) => {
  res.send("Backend running!");
});

// /generate route using Gemini
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

// /summarize route for YouTube video data
app.post("/summarize", async (req, res) => {
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "videoId is required" });
  }

  try {
    // Simulate fetching video metadata and summary
    const dummySummary = `This is a summary for video ID ${videoId}`;
    const dummyTranscript = `This is a transcript for video ID ${videoId}`;

    const videoData = {
      videoId,
      title: "Sample Video Title",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: "Sample Channel",
      publishedAt: new Date().toISOString(),
    };

    res.json({
      videoData,
      summary: dummySummary,
      transcript: dummyTranscript,
    });
  } catch (error) {
    console.error("Error in /summarize:", error);
    res.status(500).json({ error: "Failed to summarize video" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
