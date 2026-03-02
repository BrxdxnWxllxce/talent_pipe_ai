export const getHealth = async (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI-Powered Talent Pipeline API is running',
    timestamp: new Date().toISOString(),
  });
};
