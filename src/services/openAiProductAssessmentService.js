import fallbackGenerators from './fallbackAssessment.js';

/**
 * Handles orchestration of the multi-step OpenAI product assessment workflow.
 */
export class OpenAiProductAssessmentService {
  constructor({
    apiKey,
    apiUrl = 'https://api.openai.com/v1/chat/completions',
    model = 'gpt-4o-mini',
    maxCompletionTokens = 3000,
    temperature = 0.6,
    useFallback = true,
    requestTimeout = 30000,
    verifyConnectivity = false,
  } = {}) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
    this.maxTokens = maxCompletionTokens;
    this.temperature = temperature;
    this.useFallback = useFallback;
    this.requestTimeout = requestTimeout;
    this.verifyConnectivity = verifyConnectivity;
  }

  /**
   * Run the full assessment workflow.
   * @param {object} productData
   * @param {{ onStepStarted?: Function, onStepCompleted?: Function }} callbacks
   * @returns {Promise<object>}
   */
  async assessProduct(productData, callbacks = {}) {
    if (!productData?.name || !productData?.description) {
      throw new Error('Product name and description are required for assessment.');
    }

    await this.ensureConnectivity();

    const baseInfo = this.createBaseProductInfo(productData);
    const steps = this.buildSteps(productData, baseInfo);
    const results = {};

    for (const step of steps) {
      callbacks.onStepStarted?.(step.id);
      const context = { baseInfo, results };
      try {
        const prompt = step.promptBuilder(context);
        const sectionData = await this.requestSection(prompt);
        results[step.resultKey] = sectionData;
        callbacks.onStepCompleted?.(step.id, true);
      } catch (error) {
        console.error(`❌ ${step.label} failed:`, error);
        if (!this.useFallback) {
          callbacks.onStepCompleted?.(step.id, false, error);
          throw error;
        }
        console.warn(`🔄 Falling back to generated data for ${step.label}.`);
        results[step.resultKey] = step.fallback(productData, context);
        callbacks.onStepCompleted?.(step.id, false, error);
      }
    }

    return {
      productSummary: {
        title: productData.name,
        description: productData.description,
        sustainabilityHighlights: [
          'Reduced environmental impact',
          'Lower total cost of ownership',
          'Extended product lifetime',
        ],
      },
      ...results,
      step4_totalValue: {
        totalValueToCustomer: results.step3_willingnessToPay?.totalWillingnessToPay ?? 0,
        valueWithoutNBA:
          'Total value calculated from NBA analysis and value differentiators when available.',
        calculationMethod:
          'NBA value plus sustainability differentiators derived from OpenAI or fallback data.',
      },
      executiveSummary: this.buildExecutiveSummary(results),
      _source: 'openai_multi_call',
      _timestamp: new Date().toISOString(),
    };
  }

  /**
   * Prepare structured step metadata.
   * @param {object} productData
   * @param {object} baseInfo
   * @returns {Array}
   */
  buildSteps(productData, baseInfo) {
    return [
      {
        id: 'step-nba',
        label: 'NBA Analysis',
        resultKey: 'step1_nbaAnalysis',
        promptBuilder: () => this.prompts.nbaAnalysis({ baseInfo }),
        fallback: fallbackGenerators.nbaAnalysis.bind(fallbackGenerators),
      },
      {
        id: 'step-nba-value',
        label: 'NBA Value Estimation',
        resultKey: 'step1_nbaValue',
        promptBuilder: context =>
          this.prompts.nbaValueEstimation({
            baseInfo,
            nbaAnalysis: context.results.step1_nbaAnalysis,
          }),
        fallback: fallbackGenerators.nbaValueEstimation.bind(fallbackGenerators),
      },
      {
        id: 'step-value',
        label: 'Value Differentiators',
        resultKey: 'step2_valueDifferentiators',
        promptBuilder: context =>
          this.prompts.valueDifferentiators({
            baseInfo,
            nbaAnalysis: context.results.step1_nbaAnalysis,
            nbaValue: context.results.step1_nbaValue,
          }),
        fallback: fallbackGenerators.valueDifferentiators.bind(fallbackGenerators),
      },
      {
        id: 'step-willingness',
        label: 'Willingness to Pay',
        resultKey: 'step3_willingnessToPay',
        promptBuilder: context =>
          this.prompts.willingnessToPay({
            baseInfo,
            nbaAnalysis: context.results.step1_nbaAnalysis,
            nbaValue: context.results.step1_nbaValue,
            valueDifferentiators: context.results.step2_valueDifferentiators,
          }),
        fallback: fallbackGenerators.willingnessToPay.bind(fallbackGenerators),
      },
      {
        id: 'step-communication',
        label: 'Customer Communication',
        resultKey: 'step5_customerCommunication',
        promptBuilder: context =>
          this.prompts.customerCommunication({
            baseInfo,
            nbaAnalysis: context.results.step1_nbaAnalysis,
            nbaValue: context.results.step1_nbaValue,
            valueDifferentiators: context.results.step2_valueDifferentiators,
            willingnessToPay: context.results.step3_willingnessToPay,
          }),
        fallback: fallbackGenerators.customerCommunication.bind(fallbackGenerators),
      },
      {
        id: 'step-guidance',
        label: 'Company Guidance',
        resultKey: 'step6_companyGuidance',
        promptBuilder: context =>
          this.prompts.companyGuidance({
            baseInfo,
            nbaAnalysis: context.results.step1_nbaAnalysis,
            nbaValue: context.results.step1_nbaValue,
            valueDifferentiators: context.results.step2_valueDifferentiators,
            willingnessToPay: context.results.step3_willingnessToPay,
            communication: context.results.step5_customerCommunication,
          }),
        fallback: fallbackGenerators.companyGuidance.bind(fallbackGenerators),
      },
    ];
  }

  /**
   * Build an executive summary from step outputs.
   * @param {object} stepResults
   * @returns {object}
   */
  buildExecutiveSummary(stepResults) {

    const differentiatorValue = stepResults.step2_valueDifferentiators?.differentiators.reduce((acc, diff) => acc + (diff.value || 0), 0) ?? 0;
    const nbaValue = stepResults.step1_nbaValue?.nbaValue ?? 0;
    const willingness = nbaValue + differentiatorValue;
    const recommendedPrice = Math.round(willingness);

    return {
      keyFindings: [
        'Value differentiators justify premium pricing versus NBA alternatives.',
        'Customer willingness to pay exceeds the NBA market baseline.',
        'Value communication should focus on quantified ROI and incentive capture.',
      ],
      recommendedPrice: Number.isFinite(recommendedPrice) ? recommendedPrice : 0,
      confidenceLevel: 85,
      nextSteps: [
        'Implement value-based pricing strategy.',
        'Develop comprehensive value communication materials.',
        'Train the commercial team on the refreshed value proposition.',
      ],
      metrics: {
        nbaValue,
        differentiatorValue,
        totalWillingnessToPay: willingness,
      },
    };
  }

  /**
   * Verify API connectivity when enabled.
   * @returns {Promise<void>}
   */
  async ensureConnectivity() {
    if (!this.apiKey) {
      throw new Error('Missing OpenAI API key. Update config.js with a valid key.');
    }

    if (!this.verifyConnectivity) {
      return;
    }

    try {
      await this.requestSection('Return {"status":"ready"} to confirm API health.');
    } catch (error) {
      console.error('❌ OpenAI connectivity check failed:', error);
      throw new Error('OpenAI API connectivity check failed.');
    }
  }

  /**
   * Execute a single prompt request.
   * @param {string} prompt
   * @returns {Promise<any>}
   */
  async requestSection(prompt) {
    const response = await this.callOpenAi(prompt);
    return this.parseJsonResponse(response);
  }

  /**
   * Build a reusable base payload for AI prompts.
   * @param {object} productData
   * @returns {object}
   */
  createBaseProductInfo(productData) {
    return {
      name: productData.name,
      description: productData.description,
      alternatives: productData.nbaProducts || 'None specified',
      additionalInfo: productData.additionalInfo || 'None provided',
      docs:
        productData.extractedTexts?.length > 0
          ? productData.extractedTexts
              .map(doc => `${doc.filename}: ${doc.text.substring(0, 500)}...`)
              .join(' | ')
          : 'None',
    };
  }

  /**
   * Execute request against OpenAI API.
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async callOpenAi(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a sustainability and pricing expert. Always respond with strictly valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          // max_tokens: this.maxTokens,
          // temperature: this.temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response content from OpenAI API.');
      }

      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse JSON produced by OpenAI, stripping Markdown wrappers when necessary.
   * @param {string} responseText
   * @returns {object}
   */
  parseJsonResponse(responseText) {
    if (typeof responseText !== 'string') {
      throw new Error('OpenAI response must be a string.');
    }

    const cleaned = responseText.replace(/```json\s?|\```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error('OpenAI response did not contain valid JSON.');
    }

    const jsonText = cleaned.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonText);
  }

  formatContextForPrompt(label, data, maxLength = 2000) {
    if (!data) {
      return `${label}: None available.`;
    }

    let serialized;
    try {
      serialized = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (error) {
      serialized = String(data);
    }

    if (serialized.length > maxLength) {
      serialized = `${serialized.slice(0, maxLength)}... (truncated)`;
    }

    return `${label}:\n${serialized}`;
  }

  prompts = {
    nbaAnalysis: ({ baseInfo }) => {
      const productSnapshot = {
        name: baseInfo.name,
        description: baseInfo.description,
        knownAlternatives: baseInfo.alternatives,
        additionalInfo: baseInfo.additionalInfo,
        extractedDocuments: baseInfo.docs,
      };

      return `STEP 1 – NEXT BEST ALTERNATIVES (NBA) ANALYSIS

Use the product information below to identify the most relevant next best alternatives, including sourcing evidence and realistic pricing. Focus on real-world competitors, traditional substitutes, and price/performance adjacencies. Do not calculate an aggregate NBA value in this step.

${this.formatContextForPrompt('PRODUCT_INPUT', productSnapshot)}

Return strictly valid JSON with this structure:
{
  "searchMethodology": "How you researched alternatives",
  "identifiedAlternatives": [
    {
      "name": "Alternative name",
      "reasoning": "Why customers consider this alternative",
      "estimatedPrice": 0,
      "priceRange": "low/medium/high",
      "keyDifferences": ["difference list"],
      "marketShare": "Market position overview",
      "proofPoints": {
        "priceSources": [
          {
            "source": "Source name",
            "url": "https://example.com",
            "price": "$1,140",
            "reliability": "Reason source is credible"
          }
        ],
        "marketData": [
          {
            "source": "Report name",
            "url": "https://example.com/report",
            "data": "Market data referenced",
            "reliability": "Why this data is trustworthy"
          }
        ]
      }
    }
  ],
  "marketPositioning": "Summary of positioning vs alternatives",
  "confidenceLevel": "High / Medium / Low"
}`;
    },

    nbaValueEstimation: ({ baseInfo, nbaAnalysis }) => {
      const productSnapshot = {
        name: baseInfo.name,
        description: baseInfo.description,
        additionalInfo: baseInfo.additionalInfo,
      };

      return `STEP 1B – NBA VALUE ESTIMATION

Derive a representative NBA value using the alternatives identified in the previous step. Reference specific alternative prices, weighting logic, and any relevant assumptions. This step should produce a single monetary value and clearly explain how it was calculated.

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 2200)}

Return strictly valid JSON with this structure:
{
  "nbaValue": 0,
  "valuationMethodology": "How you calculated the representative NBA value",
  "justification": "Narrative summary referencing alternative data and assumptions",
  "assumptions": ["Key assumption list"],
  "confidenceLevel": "High / Medium / Low"
}`;
    },

    valueDifferentiators: ({ baseInfo, nbaAnalysis, nbaValue }) => {
      const productSnapshot = {
        name: baseInfo.name,
        description: baseInfo.description,
        additionalInfo: baseInfo.additionalInfo,
      };

      return `STEP 2 – VALUE DIFFERENTIATORS

Using the NBA analysis and NBA value estimation you just created, calculate the incremental economic value of the sustainable product versus those alternatives. Ground every calculation in the NBA pricing, positioning data, and consolidated NBA value figure.

${this.formatContextForPrompt('PRODUCT_INPUT', productSnapshot, 1200)}

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 2200)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1600)}

Return strictly valid JSON with this structure:
{
  "differentiators": [
    {
      "name": "Value driver name",
      "value": 0,
      "calculation": {
        "methodology": "How the value was calculated",
        "substeps": [
          {
            "step": "Sub-step label",
            "calculation": "Equation used",
            "assumptions": "Key assumptions"
          }
        ],
        "totalCalculation": "Summary of the calculation"
      },
      "economicRationale": "Why customers value this differentiator",
      "evidence": "Supporting data or references"
    }
  ]
}`;
    },

    willingnessToPay: ({ baseInfo, nbaAnalysis, nbaValue, valueDifferentiators }) => {
      return `STEP 3 – CUSTOMER WILLINGNESS TO PAY

Estimate customer willingness to pay using the NBA baseline, the consolidated NBA value, and the quantified differentiator value calculated in the prior step. Segment customers where relevant.

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 1800)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1600)}

VALUE DIFFERENTIATOR CONTEXT:
${this.formatContextForPrompt('VALUE_DIFFERENTIATORS', valueDifferentiators, 2200)}

Return strictly valid JSON:
{
  "customerSegments": [
    {
      "segment": "Segment name",
      "willingnessToPay": 0,
      "reasoning": "Why this segment pays this amount"
    }
  ]
}`;
    },

    customerCommunication: ({
      baseInfo,
      nbaAnalysis,
      nbaValue,
      valueDifferentiators,
      willingnessToPay,
    }) => {
      return `STEP 4 – CUSTOMER COMMUNICATION PLAN

Design the communication strategy using the quantified NBA, NBA value estimate, differentiator, and willingness-to-pay outputs. Emphasize how to translate the numbers into customer-facing messaging and tools.

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 1600)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1400)}

VALUE DIFFERENTIATOR CONTEXT:
${this.formatContextForPrompt('VALUE_DIFFERENTIATORS', valueDifferentiators, 1800)}

WILLINGNESS TO PAY CONTEXT:
${this.formatContextForPrompt('WILLINGNESS_TO_PAY', willingnessToPay, 1600)}

Return strictly valid JSON in this format:
{
  "communicationStrategy": "High-level approach",
  "tcoGuidance": {
    "message": "Message to convey",
    "tools": ["tool list"],
    "objectives": "Objectives summary",
    "actionableSteps": [
      {
        "step": "Action name",
        "description": "Action description",
        "implementation": "How to implement"
      }
    ]
  },
  "incentiveGuidance": { ... },
  "lifetimeGuidance": { ... }
}`;
    },

    companyGuidance: ({
      baseInfo,
      nbaAnalysis,
      nbaValue,
      valueDifferentiators,
      willingnessToPay,
      communication,
    }) => {
      return `STEP 5 – COMPANY ENABLEMENT GUIDANCE

Assess organisational strengths, weaknesses, and next steps required to deliver the quantified value. Anchor recommendations in the NBA findings, differentiator insights, willingness-to-pay outcomes, and communication plan.

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 1400)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1200)}

VALUE DIFFERENTIATOR CONTEXT:
${this.formatContextForPrompt('VALUE_DIFFERENTIATORS', valueDifferentiators, 1600)}

WILLINGNESS TO PAY CONTEXT:
${this.formatContextForPrompt('WILLINGNESS_TO_PAY', willingnessToPay, 1400)}

COMMUNICATION PLAN CONTEXT:
${this.formatContextForPrompt('COMMUNICATION_PLAN', communication, 1400)}

Return strictly valid JSON:
{
  "valueDriverStrengths": [
    {
      "driver": "Capability name",
      "currentStrength": "Current performance summary",
      "strengthLevel": "low/medium/high",
      "evidence": "Supporting evidence",
      "enhancementOpportunities": [
        {
          "opportunity": "Opportunity name",
          "action": "Recommended action",
          "expectedImpact": "Expected impact"
        }
      ]
    }
  ],
  "valueDriverWeaknesses": [
    {
      "driver": "Capability name",
      "currentWeakness": "Weakness summary",
      "weaknessLevel": "low/medium/high",
      "rootCause": "Underlying cause",
      "improvementPlan": [
        {
          "improvement": "Improvement name",
          "action": "Action to take",
          "expectedImpact": "Impact description"
        }
      ]
    }
  ],
  "competitivePositioning": {
    "currentPosition": "Current market position",
    "positioningGaps": "Where positioning falls short",
    "positioningOpportunities": [
      {
        "opportunity": "Opportunity name",
        "action": "Recommended action",
        "expectedImpact": "Impact description"
      }
    ]
  }
}`;
    },
  };
}

export default OpenAiProductAssessmentService;
