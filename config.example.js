// Example configuration file
// Copy this to config.js and add your actual API key

const CONFIG = {
    // Your OpenAI API key - get it from https://platform.openai.com/api-keys
    OPENAI_API_KEY: 'your-openai-api-key-here',
    
    // OpenAI API endpoint
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    
    // AI model to use
    MODEL: 'gpt-3.5-turbo',
    
    // Maximum tokens for AI response
    MAX_TOKENS: 3000,
    
    // AI creativity level (0.0 = deterministic, 1.0 = very creative)
    TEMPERATURE: 0.8,
    
    // Whether to use fallback mock data if API fails
    USE_FALLBACK: true,
    
    // API request timeout in milliseconds
    API_TIMEOUT: 30000
};
