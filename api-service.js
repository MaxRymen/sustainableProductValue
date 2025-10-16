// OpenAI API Service for Product Value Assessment

class OpenAIService {
    constructor() {
        this.apiKey = CONFIG.OPENAI_API_KEY;
        this.apiUrl = CONFIG.OPENAI_API_URL;
        this.model = CONFIG.MODEL;
        this.maxTokens = CONFIG.MAX_TOKENS;
        this.temperature = CONFIG.TEMPERATURE;
    }

    async assessProduct(productData) {
        try {
            console.log('🚀 Starting OpenAI assessment...');
            console.log('📊 Product Data:', productData);
            
            // Create the assessment prompt
            const prompt = this.createAssessmentPrompt(productData);
            console.log('📝 Generated Prompt Length:', prompt.length);
            console.log('📝 Prompt Preview:', prompt.substring(0, 200) + '...');
            
            // Make API call
            console.log('🌐 Making API call to OpenAI...');
            const response = await this.callOpenAI(prompt);
            console.log('✅ Raw API Response:', response);
            
            // Parse the response
            const assessment = this.parseAssessmentResponse(response);
            console.log('🎯 Parsed Assessment:', assessment);
            console.log('✅ OpenAI assessment completed successfully!');
            
            // Add source indicator
            assessment._source = 'openai';
            assessment._timestamp = new Date().toISOString();
            
            return assessment;
            
        } catch (error) {
            console.error('❌ OpenAI API error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack
            });
            
            // Check if it's a token limit issue
            if (error.message.includes('Failed to parse AI assessment response')) {
                console.log('🔄 Attempting to retry with higher token limit...');
                try {
                    // Temporarily increase token limit and retry
                    const originalMaxTokens = this.maxTokens;
                    this.maxTokens = 4000;
                    
                    const retryResponse = await this.callOpenAI(this.createAssessmentPrompt(productData));
                    const retryAssessment = this.parseAssessmentResponse(retryResponse);
                    
                    // Restore original token limit
                    this.maxTokens = originalMaxTokens;
                    
                    retryAssessment._source = 'openai_retry';
                    retryAssessment._timestamp = new Date().toISOString();
                    console.log('✅ Retry successful with higher token limit');
                    return retryAssessment;
                } catch (retryError) {
                    console.error('❌ Retry also failed:', retryError);
                    // Restore original token limit
                    this.maxTokens = originalMaxTokens;
                }
            }
            
            if (CONFIG.USE_FALLBACK) {
                console.log('🔄 Using fallback mock data...');
                const fallbackAssessment = this.generateFallbackAssessment(productData);
                fallbackAssessment._source = 'fallback';
                fallbackAssessment._timestamp = new Date().toISOString();
                console.log('🔄 Fallback assessment generated:', fallbackAssessment);
                return fallbackAssessment;
            } else {
                throw error;
            }
        }
    }

    createAssessmentPrompt(productData) {
        return `You are a sustainability and pricing expert. Analyze this product and provide a comprehensive value assessment with realistic market-based calculations.

PRODUCT INFORMATION:
- Name: ${productData.name}
- Description: ${productData.description}
- Known Alternatives: ${productData.nbaProducts || 'None specified'}
- Additional Info: ${productData.additionalInfo || 'None provided'}

UPLOADED DOCUMENTATION:
${productData.extractedTexts && productData.extractedTexts.length > 0 ? 
    productData.extractedTexts.map(doc => 
        `\n--- ${doc.filename} (${doc.type.toUpperCase()}) ---\n${doc.text}\n`
    ).join('\n') : 
    'No documentation uploaded'
}

Based on this product information, research the market and calculate realistic values. Consider:
- Current market prices for similar products
- Sustainability premiums in the market
- Total cost of ownership savings
- Government incentives and carbon credits
- Product lifetime and durability benefits
- Customer willingness to pay for sustainable products

Provide your analysis in this structured JSON format following the step-by-step analysis flow:

{
  "productSummary": {
    "title": "Brief product title/summary",
    "description": "2-3 sentence summary of the key product features and value proposition",
    "sustainabilityHighlights": ["key sustainability benefit 1", "key sustainability benefit 2", "key sustainability benefit 3"]
  },
  "step1_nbaAnalysis": {
    "searchMethodology": "How NBA alternatives were identified and researched",
    "identifiedAlternatives": [
      {
        "name": "Alternative product name",
        "reasoning": "Why this is a relevant alternative",
        "estimatedPrice": [calculate realistic market price],
        "priceRange": "low/medium/high",
        "keyDifferences": ["difference 1", "difference 2", "difference 3"],
        "marketShare": "estimated market share or popularity"
      }
    ],
    "marketPositioning": "How this product compares to alternatives",
    "nbaValue": [calculate weighted average of NBA prices]
  },
  "step2_valueDifferentiators": {
    "differentiators": [
      {
        "name": "Total Cost of Ownership (TCO)",
        "value": [calculate TCO savings vs alternatives],
        "calculation": "Detailed breakdown of how TCO savings are calculated",
        "economicRationale": "Why customers value TCO savings and how it translates to economic value",
        "evidence": "Supporting data or examples for this differentiator"
      },
      {
        "name": "CO₂ Credits & Government Incentives",
        "value": [calculate government incentives and carbon credits],
        "calculation": "Breakdown of available incentives, tax credits, and carbon pricing",
        "economicRationale": "How government incentives create direct economic value for customers",
        "evidence": "Specific programs, rates, and eligibility criteria"
      },
      {
        "name": "Extended Product Lifetime",
        "value": [calculate extended lifetime value],
        "calculation": "How longer lifetime translates to cost savings and value",
        "economicRationale": "Economic benefits of reduced replacement costs and downtime",
        "evidence": "Lifetime comparisons and maintenance cost analysis"
      }
    ],
    "totalDifferentiatorValue": [sum of all differentiator values]
  },
  "step3_willingnessToPay": {
    "calculation": "NBA Value + Value Differentiators = Willingness to Pay",
    "nbaValue": [from step 1],
    "differentiatorValue": [from step 2],
    "totalWillingnessToPay": [NBA value + differentiator value],
    "calculationBreakdown": "Detailed explanation of how willingness to pay is calculated",
    "customerSegments": [
      {
        "segment": "Early adopters/sustainability focused",
        "willingnessToPay": [higher value],
        "reasoning": "Why this segment pays premium"
      },
      {
        "segment": "Price sensitive/mainstream",
        "willingnessToPay": [lower value],
        "reasoning": "Why this segment has lower willingness to pay"
      }
    ]
  },
  "step4_totalValue": {
    "totalValueToCustomer": [calculate comprehensive value if no NBA exists],
    "valueWithoutNBA": "What the total value would be if no direct NBA exists",
    "calculationMethod": "How total value is calculated when no NBA is available"
  },
  "step5_customerCommunication": {
    "communicationStrategy": "How to help customers realize the value of differentiators",
    "tcoGuidance": {
      "message": "How to communicate TCO benefits to customers",
      "tools": ["TCO calculator", "ROI analysis", "comparison charts"],
      "objectives": "Help customers understand long-term cost savings"
    },
    "incentiveGuidance": {
      "message": "How to help customers access government incentives",
      "tools": ["incentive finder", "application assistance", "timeline guidance"],
      "objectives": "Maximize customer access to available incentives"
    },
    "lifetimeGuidance": {
      "message": "How to demonstrate extended lifetime value",
      "tools": ["warranty comparisons", "maintenance schedules", "durability testing"],
      "objectives": "Show customers the value of longer product life"
    }
  },
  "step6_companyGuidance": {
    "performanceGaps": [
      {
        "area": "Pricing strategy",
        "currentPerformance": "How current pricing compares to willingness to pay",
        "recommendation": "Specific actions to improve pricing",
        "impact": "Expected impact of changes"
      },
      {
        "area": "Value communication",
        "currentPerformance": "How well value differentiators are communicated",
        "recommendation": "Actions to improve value communication",
        "impact": "Expected impact on customer understanding"
      },
      {
        "area": "Market positioning",
        "currentPerformance": "How product is positioned vs NBA",
        "recommendation": "Positioning improvements",
        "impact": "Expected market impact"
      }
    ],
    "underperformanceAreas": "Where the company is underperforming compared to customer willingness to pay",
    "improvementPlan": "Specific steps to capture more value from customers"
  },
  "executiveSummary": {
    "keyFindings": ["finding 1", "finding 2", "finding 3"],
    "recommendedPrice": [optimal price recommendation],
    "confidenceLevel": [confidence in assessment 0-100],
    "nextSteps": ["action 1", "action 2", "action 3"]
  }
}

CRITICAL REQUIREMENTS:
- Calculate REAL market-based values, not example numbers
- Research actual market prices for similar products
- Consider current sustainability market trends and premiums
- Base calculations on real market data and customer behavior
- Provide detailed explanations for how each value was calculated
- Return ONLY valid JSON, no additional text`;
    }

    async callOpenAI(prompt) {
        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: "You are a sustainability and pricing expert specializing in product value assessment. Always respond with valid JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature
        };

        console.log('🔧 API Request Details:', {
            url: this.apiUrl,
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            promptLength: prompt.length
        });

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 API Response Status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📦 Full API Response Data:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Invalid API response structure:', data);
            throw new Error('Invalid API response structure');
        }

        const content = data.choices[0].message.content;
        console.log('📄 API Response Content:', content);
        
        return content;
    }

    parseAssessmentResponse(responseText) {
        try {
            console.log('🔍 Raw response text length:', responseText.length);
            console.log('🔍 Raw response text preview:', responseText.substring(0, 200) + '...');
            
            // Check if response appears truncated
            if (responseText.length > 2900) { // Close to token limit
                console.warn('⚠️ Response may be truncated - length:', responseText.length);
            }
            
            // Clean the response text (remove any markdown formatting)
            let cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            // Try to find JSON object boundaries
            const jsonStart = cleanText.indexOf('{');
            const jsonEnd = cleanText.lastIndexOf('}');
            
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
            } else {
                console.error('❌ Could not find valid JSON boundaries');
                throw new Error('Invalid JSON structure in response');
            }
            
            console.log('🧹 Cleaned text length:', cleanText.length);
            console.log('🧹 Cleaned text preview:', cleanText.substring(0, 500) + '...');
            
            // Check if JSON appears complete
            const openBraces = (cleanText.match(/\{/g) || []).length;
            const closeBraces = (cleanText.match(/\}/g) || []).length;
            
            if (openBraces !== closeBraces) {
                console.error('❌ Unbalanced braces - Open:', openBraces, 'Close:', closeBraces);
                throw new Error('Incomplete JSON response - braces not balanced');
            }
            
            // Parse JSON
            const assessment = JSON.parse(cleanText);
            
            // Validate required fields
            this.validateAssessment(assessment);
            
            console.log('✅ Successfully parsed and validated assessment');
            return assessment;
        } catch (error) {
            console.error('❌ Error parsing OpenAI response:', error);
            console.error('❌ Response text that failed:', responseText);
            console.error('❌ Response length:', responseText.length);
            throw new Error('Failed to parse AI assessment response');
        }
    }

    validateAssessment(assessment) {
        const requiredFields = [
            'productSummary',
            'step1_nbaAnalysis', 
            'step2_valueDifferentiators',
            'step3_willingnessToPay',
            'step4_totalValue',
            'step5_customerCommunication',
            'step6_companyGuidance',
            'executiveSummary'
        ];

        for (const field of requiredFields) {
            if (!assessment[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    generateFallbackAssessment(productData) {
        // Fallback to the original mock data generation
        const baseValue = Math.random() * 50000 + 10000;
        const nbaValue = baseValue * (0.7 + Math.random() * 0.3);
        const willingnessToPay = baseValue * (1.1 + Math.random() * 0.4);
        const costBaseline = baseValue * (0.5 + Math.random() * 0.3);
        
        const tcoDifference = Math.random() * 15000 + 5000;
        const co2Credits = Math.random() * 8000 + 2000;
        const lifetimeValue = Math.random() * 12000 + 3000;
        
        const totalValueDifferentiators = tcoDifference + co2Credits + lifetimeValue;
        const gapValue = willingnessToPay - nbaValue;

        return {
            productSummary: {
                title: productData.name,
                description: `A sustainable ${productData.name} with environmental benefits and cost savings.`,
                sustainabilityHighlights: [
                    "Reduced environmental impact",
                    "Lower total cost of ownership", 
                    "Extended product lifetime"
                ]
            },
            step1_nbaAnalysis: {
                searchMethodology: "Market research and competitive analysis based on product specifications",
                identifiedAlternatives: [
                    {
                        name: "Traditional Alternative",
                        reasoning: "Standard market alternative with similar functionality",
                        estimatedPrice: Math.round(nbaValue),
                        priceRange: "medium",
                        keyDifferences: ["Lower sustainability", "Higher maintenance costs", "Shorter lifetime"],
                        marketShare: "Market leader with 60% share"
                    }
                ],
                marketPositioning: "Premium sustainable option with long-term value",
                nbaValue: Math.round(nbaValue)
            },
            step2_valueDifferentiators: {
                differentiators: [
                    {
                        name: "Total Cost of Ownership (TCO)",
                        value: Math.round(tcoDifference),
                        calculation: "Savings from reduced maintenance, energy efficiency, and operational costs over 10-year period",
                        economicRationale: "Customers value long-term cost savings and reduced operational complexity",
                        evidence: "Industry studies show 20-30% TCO reduction for sustainable products"
                    },
                    {
                        name: "CO₂ Credits & Government Incentives",
                        value: Math.round(co2Credits),
                        calculation: "Federal tax credits, state rebates, and carbon credit programs",
                        economicRationale: "Direct financial incentives reduce customer's net cost and improve ROI",
                        evidence: "Current federal incentives provide up to 30% tax credit for qualifying products"
                    },
                    {
                        name: "Extended Product Lifetime",
                        value: Math.round(lifetimeValue),
                        calculation: "Extended warranty period and reduced replacement frequency",
                        economicRationale: "Longer product life reduces capital expenditure and downtime costs",
                        evidence: "Sustainable products typically last 25-40% longer than conventional alternatives"
                    }
                ],
                totalDifferentiatorValue: Math.round(totalValueDifferentiators)
            },
            step3_willingnessToPay: {
                calculation: "NBA Value + Value Differentiators = Willingness to Pay",
                nbaValue: Math.round(nbaValue),
                differentiatorValue: Math.round(totalValueDifferentiators),
                totalWillingnessToPay: Math.round(willingnessToPay),
                calculationBreakdown: "Customer willingness to pay is based on NBA market price plus the economic value of sustainability differentiators",
                customerSegments: [
                    {
                        segment: "Early adopters/sustainability focused",
                        willingnessToPay: Math.round(willingnessToPay * 1.2),
                        reasoning: "Higher willingness to pay for environmental benefits and innovation"
                    },
                    {
                        segment: "Price sensitive/mainstream",
                        willingnessToPay: Math.round(willingnessToPay * 0.8),
                        reasoning: "Focus on cost savings and proven ROI rather than sustainability premium"
                    }
                ]
            },
            step4_totalValue: {
                totalValueToCustomer: Math.round(baseValue),
                valueWithoutNBA: "When no direct NBA exists, total value is calculated based on functional benefits and market demand",
                calculationMethod: "Comprehensive value assessment based on product features, market research, and customer willingness to pay"
            },
            step5_customerCommunication: {
                communicationStrategy: "Focus on economic benefits and ROI to help customers understand the value proposition",
                tcoGuidance: {
                    message: "Use TCO calculators and 10-year cost comparisons to demonstrate long-term savings",
                    tools: ["TCO calculator", "ROI analysis", "comparison charts"],
                    objectives: "Help customers understand long-term cost savings"
                },
                incentiveGuidance: {
                    message: "Provide guidance on accessing government incentives and tax credits",
                    tools: ["incentive finder", "application assistance", "timeline guidance"],
                    objectives: "Maximize customer access to available incentives"
                },
                lifetimeGuidance: {
                    message: "Showcase extended warranty and durability benefits",
                    tools: ["warranty comparisons", "maintenance schedules", "durability testing"],
                    objectives: "Show customers the value of longer product life"
                }
            },
            step6_companyGuidance: {
                performanceGaps: [
                    {
                        area: "Pricing strategy",
                        currentPerformance: "Current pricing may not capture full value potential",
                        recommendation: "Implement value-based pricing aligned with customer willingness to pay",
                        impact: "Potential 15-25% revenue increase"
                    },
                    {
                        area: "Value communication",
                        currentPerformance: "Value differentiators not effectively communicated",
                        recommendation: "Develop comprehensive value communication tools and training",
                        impact: "Improved customer understanding and conversion rates"
                    },
                    {
                        area: "Market positioning",
                        currentPerformance: "Positioning as premium without clear value justification",
                        recommendation: "Reposition as high-value, cost-effective solution",
                        impact: "Expanded market reach and customer acceptance"
                    }
                ],
                underperformanceAreas: "Company is underperforming in capturing customer willingness to pay due to pricing and communication gaps",
                improvementPlan: "Implement value-based pricing, enhance value communication, and reposition product in market"
            },
            executiveSummary: {
                keyFindings: [
                    "Strong value differentiators justify premium pricing",
                    "Customer willingness to pay exceeds current pricing",
                    "Value communication needs improvement"
                ],
                recommendedPrice: Math.round(willingnessToPay * 0.9), // 90% of willingness to pay
                confidenceLevel: Math.round(Math.random() * 20 + 80),
                nextSteps: [
                    "Implement value-based pricing strategy",
                    "Develop comprehensive value communication materials",
                    "Train sales team on value proposition delivery"
                ]
            }
        };
    }
}

// Create global instance
const openAIService = new OpenAIService();
