app.post("/summarize", async (req, res) => {
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "videoId is required" });
  }

  try {
    const prompt = `Summarize the YouTube video with ID: ${videoId}`;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      videoData: {
        videoId,
        title: "Dummy Title",           
        thumbnail: "https://via.placeholder.com/150",
        channelTitle: "Dummy Channel",
        publishedAt: "2023-01-01",
      },
      summary: text,
      transcript: "Transcript not implemented", 
    });
  } catch (error) {
    console.error("Error summarizing video:", error);
    res.status(500).json({ error: "Failed to summarize video" });
  }
});
