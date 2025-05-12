// index.js - Backend server with YouTube and summarization functionality
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory storage for history (replace with database in production)
let summaryHistory = [];

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
        lengthInstruction = 'Create a detailed summary covering all main points in about 8-10 sentences.';
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

/**
 * Get YouTube video transcript
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<string>} - Video transcript
 */
async function getYouTubeTranscript(videoId) {
  try {
    // Using YouTubeTranscriptAPI or similar service
    // This is a placeholder - implement actual transcript retrieval
    const response = await axios.get(`https://some-transcript-api.com/api?videoId=${videoId}`);
    return response.data.transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch video transcript');
  }
}

/**
 * Get YouTube video details
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} - Video details
 */
async function getVideoDetails(videoId) {
  try {
    // Use YouTube Data API to get video details
    const apiKey = process.env.YOUTUBE_API_KEY;
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
      params: {
        part: 'snippet',
        id: videoId,
        key: apiKey
      }
    });

    const videoData = response.data.items[0].snippet;
    
    return {
      videoId,
      title: videoData.title,
      thumbnail: videoData.thumbnails.high.url,
      channelTitle: videoData.channelTitle,
      publishedAt: videoData.publishedAt
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
}

// API endpoint for summarizing text content
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

// API endpoint for summarizing transcript
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

// Original YouTube summary endpoint (for backward compatibility)
app.post('/summarize', async (req, res) => {
  try {
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    // Get video details and transcript
    const videoData = await getVideoDetails(videoId);
    const transcript = await getYouTubeTranscript(videoId);
    
    // Generate summary from transcript
    const summary = await generateSummary(transcript, 'medium');
    
    res.json({
      videoData,
      summary,
      transcript
    });
  } catch (error) {
    console.error('Error in YouTube summarize endpoint:', error);
    res.status(500).json({ error: 'Failed to summarize YouTube video' });
  }
});

// New enhanced API endpoint for YouTube summarization
app.post('/api/summarize-youtube', async (req, res) => {
  try {
    const { videoId, type } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    // Get video details and transcript
    const videoData = await getVideoDetails(videoId);
    const transcript = await getYouTubeTranscript(videoId);
    
    // Generate summary from transcript
    const summary = await generateSummary(transcript, type || 'medium');
    
    res.json({
      videoData,
      summary,
      transcript
    });
  } catch (error) {
    console.error('Error in enhanced YouTube summarize endpoint:', error);
    res.status(500).json({ error: 'Failed to summarize YouTube video' });
  }
});

// History endpoints
app.get('/api/history', (req, res) => {
  res.json({ history: summaryHistory });
});

app.post('/api/history/save', (req, res) => {
  try {
    const summaryData = req.body;
    const historyItem = {
      ...summaryData,
      id: uuidv4(),
      createdAt: Date.now()
    };
    
    summaryHistory.push(historyItem);
    
    res.json({ item: historyItem });
  } catch (error) {
    console.error('Error saving to history:', error);
    res.status(500).json({ error: 'Failed to save to history' });
  }
});

app.delete('/api/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    summaryHistory = summaryHistory.filter(item => item.id !== id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting from history:', error);
    res.status(500).json({ error: 'Failed to delete from history' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
