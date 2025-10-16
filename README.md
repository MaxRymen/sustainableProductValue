# Sustainability Value Assessment Tool

A web application that helps companies assess the value of their sustainable products by analyzing market positioning, value differentiators, and customer willingness to pay.

## 🌱 Features

- **Product Analysis**: Comprehensive assessment of sustainable products
- **NBA (Next Best Alternatives) Research**: Automated market research and competitor analysis
- **Value Differentiators**: TCO analysis, CO₂ credits, extended lifetime calculations
- **Customer Insights**: Willingness to pay analysis across different customer segments
- **Communication Strategy**: Guidance on how to communicate value to customers
- **Performance Guidance**: Areas for improvement and optimization

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key (for AI-powered analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sustainability-value-assessment.git
   cd sustainability-value-assessment
   ```

2. **Configure API access**
   - Copy `config.example.js` to `config.js`
   - Add your OpenAI API key to `config.js`

3. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local server for better performance

## 📖 How to Use

1. **Enter Product Information**
   - Product name and description
   - Upload relevant documentation (PDFs, text files)

2. **Optional: Add NBA Information**
   - Known competitors or alternatives
   - Additional market context

3. **Run Analysis**
   - Click "Assess Product Value"
   - AI will analyze your product and provide comprehensive insights

4. **Review Results**
   - Step-by-step analysis breakdown
   - Market positioning insights
   - Value differentiator calculations
   - Customer communication strategies

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with glass morphism effects
- **AI Integration**: OpenAI GPT API
- **File Processing**: PDF.js for document analysis

## 📁 Project Structure

```
sustainability-value-assessment/
├── index.html              # Main application page
├── styles.css              # Styling and responsive design
├── script.js               # Main application logic
├── api-service.js          # OpenAI API integration
├── config.js               # API configuration (not in repo)
├── config.example.js       # Example configuration
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── Icons/                  # Application icons
    └── eco-tag_6556784.png
```

## 🔧 Configuration

Create a `config.js` file with your API settings:

```javascript
const CONFIG = {
    OPENAI_API_KEY: 'your-api-key-here',
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 3000,
    TEMPERATURE: 0.8,
    USE_FALLBACK: true,
    API_TIMEOUT: 30000
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI analysis capabilities
- PDF.js for client-side PDF processing
- The sustainability community for inspiration and feedback

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/YOUR_USERNAME/sustainability-value-assessment/issues) page
2. Create a new issue with detailed information
3. Include browser console logs if reporting bugs

---

**Built with ❤️ for sustainable business growth**
