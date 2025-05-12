// index.js - Backend for summarization service
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a summary using Gemini API
 * @param {string} content - The content to summarize
 * @param {string} type - The type of summary (short, medium, long)
 * @returns {Promise<string>} - The generated summary
 */
async function generateSummary(content, type = 'medium') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    let lengthInstruction = '';
    switch(type) {
      case 'short':
        lengthInstruction = 'Create a very concise summary in 2-3 sentences.';
        break;
      case 'medium': 
        lengthInstruction = 'Create a comprehensive summary in 4-6 sentences.';
        break;
      case 'long':
        lengthInstruction = 'Create a detailed summary covering all main points.';
        break;
      default:
        lengthInstruction = 'Create a comprehensive summary in 4-6 sentences.';
    }
    
    const prompt = `
      ${lengthInstruction}
      Focus on the key ideas, concepts, and conclusions.
      Maintain the original tone and perspective.
      Provide a coherent and readable summary.
      
      Here is the content to summarize:
      ${content}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}

// API endpoint for summarization
app.post('/api/summarize', async (req, res) => {
  try {
    const { content, type } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const summary = await generateSummary(content, type);
    
    res.json({ summary });
  } catch (error) {
    console.error('Error in summarize endpoint:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// API endpoint for transcript summarization
app.post('/api/summarize-transcript', async (req, res) => {
  try {
    const { transcript, type } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    const summary = await generateSummary(transcript, type);
    
    res.json({ summary });
  } catch (error) {
    console.error('Error in summarize-transcript endpoint:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
