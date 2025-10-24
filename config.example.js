export const CONFIG = {
  openAI: {
    apiKey: 'your-openai-api-key-here',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-5-nano',
    useFallback: true,
    requestTimeout: 30000,
    verifyConnectivity: false,
  },
};

export default CONFIG;
