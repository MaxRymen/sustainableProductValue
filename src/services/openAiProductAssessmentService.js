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
    const segmentationStep = this.buildSegmentationStep(baseInfo);

    callbacks.onStepStarted?.(segmentationStep.id);

    let segmentationResult;
    let segmentationError;

    try {
      const prompt = segmentationStep.promptBuilder({ baseInfo });
      segmentationResult = await this.requestSection(prompt);
      callbacks.onStepCompleted?.(segmentationStep.id, true);
    } catch (error) {
      segmentationError = error;
      console.error(`❌ ${segmentationStep.label} failed:`, error);
      if (!this.useFallback) {
        callbacks.onStepCompleted?.(segmentationStep.id, false, error);
        throw error;
      }

      console.warn(`🔄 Falling back to generated data for ${segmentationStep.label}.`);
      segmentationResult = segmentationStep.fallback(productData, { baseInfo });
      callbacks.onStepCompleted?.(segmentationStep.id, false, error);
    }

    const { segmentation, segmentStates } = this.prepareSegments({
      segmentationResult,
      productData,
      baseInfo,
      priorError: segmentationError,
    });

    callbacks.onPartialResult?.(
      this.composeResults({ productData, segmentation, segmentStates }),
    );

    const segmentSteps = this.buildSegmentSteps(baseInfo);

    for (const step of segmentSteps) {
      const progressId = step.progressId ?? step.id;
      callbacks.onStepStarted?.(progressId);

      let stageSuccess = true;
      let stageError = null;

      for (const segmentState of segmentStates) {
        const context = this.createSegmentContext(baseInfo, segmentState);

        try {
          const prompt = step.promptBuilder({
            baseInfo,
            segment: context.segment,
            segmentResults: context.segmentResults,
          });
          const sectionData = await this.requestSection(prompt);
          segmentState.results[step.resultKey] = sectionData;
          callbacks.onPartialResult?.(
            this.composeResults({ productData, segmentation, segmentStates }),
          );
        } catch (error) {
          stageSuccess = false;
          stageError = error;
          console.error(`❌ ${step.label} failed for ${segmentState.name}:`, error);

          if (!this.useFallback) {
            callbacks.onStepCompleted?.(progressId, false, error);
            throw error;
          }

          console.warn(
            `🔄 Falling back to generated data for ${step.label} (${segmentState.name}).`,
          );
          segmentState.results[step.resultKey] = step.fallback(productData, context);
          callbacks.onPartialResult?.(
            this.composeResults({ productData, segmentation, segmentStates }),
          );
        }
      }

      callbacks.onStepCompleted?.(progressId, stageSuccess, stageError ?? undefined);
    }

    return this.composeResults({ productData, segmentation, segmentStates });
  }

  buildSegmentationStep(baseInfo) {
    return {
      id: 'step-segmentation',
      label: 'Customer Segmentation',
      resultKey: 'segmentation',
      promptBuilder: () => this.prompts.customerSegmentation({ baseInfo }),
      fallback: fallbackGenerators.customerSegmentation.bind(fallbackGenerators),
    };
  }

  buildSegmentSteps(baseInfo) {
    return [
      {
        id: 'step-nba',
        progressId: 'step-nba',
        label: 'NBA Analysis',
        resultKey: 'step1_nbaAnalysis',
        promptBuilder: ({ segment }) =>
          this.prompts.nbaAnalysis({
            baseInfo,
            segment,
          }),
        fallback: fallbackGenerators.nbaAnalysis.bind(fallbackGenerators),
      },
      {
        id: 'step-nba-value',
        progressId: 'step-nba-value',
        label: 'NBA Value Estimation',
        resultKey: 'step1_nbaValue',
        promptBuilder: ({ segment, segmentResults }) =>
          this.prompts.nbaValueEstimation({
            baseInfo,
            segment,
            nbaAnalysis: segmentResults.step1_nbaAnalysis,
          }),
        fallback: fallbackGenerators.nbaValueEstimation.bind(fallbackGenerators),
      },
      {
        id: 'step-value',
        progressId: 'step-value',
        label: 'Value Differentiators',
        resultKey: 'step2_valueDifferentiators',
        promptBuilder: ({ segment, segmentResults }) =>
          this.prompts.valueDifferentiators({
            baseInfo,
            segment,
            nbaAnalysis: segmentResults.step1_nbaAnalysis,
            nbaValue: segmentResults.step1_nbaValue,
          }),
        fallback: fallbackGenerators.valueDifferentiators.bind(fallbackGenerators),
      },
      {
        id: 'step-willingness',
        progressId: 'step-willingness',
        label: 'Willingness to Pay',
        resultKey: 'step3_willingnessToPay',
        promptBuilder: ({ segment, segmentResults }) =>
          this.prompts.willingnessToPay({
            baseInfo,
            segment,
            nbaAnalysis: segmentResults.step1_nbaAnalysis,
            nbaValue: segmentResults.step1_nbaValue,
            valueDifferentiators: segmentResults.step2_valueDifferentiators,
          }),
        fallback: fallbackGenerators.willingnessToPay.bind(fallbackGenerators),
      },
      {
        id: 'step-communication',
        progressId: 'step-communication',
        label: 'Customer Communication',
        resultKey: 'step5_customerCommunication',
        promptBuilder: ({ segment, segmentResults }) =>
          this.prompts.customerCommunication({
            baseInfo,
            segment,
            nbaAnalysis: segmentResults.step1_nbaAnalysis,
            nbaValue: segmentResults.step1_nbaValue,
            valueDifferentiators: segmentResults.step2_valueDifferentiators,
            willingnessToPay: segmentResults.step3_willingnessToPay,
          }),
        fallback: fallbackGenerators.customerCommunication.bind(fallbackGenerators),
      },
      {
        id: 'step-guidance',
        progressId: 'step-guidance',
        label: 'Company Guidance',
        resultKey: 'step6_companyGuidance',
        promptBuilder: ({ segment, segmentResults }) =>
          this.prompts.companyGuidance({
            baseInfo,
            segment,
            nbaAnalysis: segmentResults.step1_nbaAnalysis,
            nbaValue: segmentResults.step1_nbaValue,
            valueDifferentiators: segmentResults.step2_valueDifferentiators,
            willingnessToPay: segmentResults.step3_willingnessToPay,
            communication: segmentResults.step5_customerCommunication,
          }),
        fallback: fallbackGenerators.companyGuidance.bind(fallbackGenerators),
      },
    ];
  }

  prepareSegments({ segmentationResult, productData, baseInfo }) {
    let data =
      segmentationResult && typeof segmentationResult === 'object'
        ? { ...segmentationResult }
        : {};

    let segments = Array.isArray(data.segments) ? [...data.segments] : [];

    if (segments.length === 0) {
      console.warn('Customer segmentation returned no segments; generating defaults.');
      const fallbackSegmentation = fallbackGenerators.customerSegmentation(productData, {
        baseInfo,
      });
      if (fallbackSegmentation && typeof fallbackSegmentation === 'object') {
        data = { ...fallbackSegmentation, ...data };
        segments = Array.isArray(data.segments) ? [...data.segments] : [];
      }
    }

    if (segments.length === 0) {
      segments = [
        {
          id: 'segment-1',
          name: 'General Market',
          description:
            'Default segment generated because no segmentation data was returned.',
          pricingSensitivity: 'medium',
          primaryNeeds: ['Balanced sustainability benefits and price'],
          buyingCriteria: ['Reliable performance', 'Proof of ROI'],
        },
      ];
    }

    const segmentStates = segments.map((segment, index) =>
      this.initialiseSegmentState(segment, index),
    );

    data.segments = segmentStates.map(state => state.profile);

    return {
      segmentation: data,
      segmentStates,
    };
  }

  initialiseSegmentState(segment, index) {
    const baseName = segment?.name || segment?.segment || `Segment ${index + 1}`;
    const id = this.generateSegmentId(segment?.id ?? baseName, index);

    const profile = {
      ...segment,
      id,
      name: baseName,
    };

    return {
      id,
      index,
      name: baseName,
      profile,
      results: {},
    };
  }

  generateSegmentId(rawId, index) {
    const base = (rawId ?? `segment-${index + 1}`)
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const suffix = index + 1;
    return base ? `${base}-${suffix}` : `segment-${suffix}`;
  }

  createSegmentContext(baseInfo, segmentState) {
    return {
      baseInfo,
      segmentId: segmentState.id,
      segmentIndex: segmentState.index,
      segment: segmentState.profile,
      segmentResults: segmentState.results,
      results: segmentState.results,
    };
  }

  composeResults({ productData, segmentation, segmentStates }) {
    const segments = segmentStates.map(segmentState => {
      const stepResults = { ...segmentState.results };
      const metrics = this.calculateSegmentMetrics(stepResults);
      const executiveSummary = this.buildExecutiveSummary(stepResults);

      return {
        id: segmentState.id,
        name: segmentState.name,
        index: segmentState.index,
        profile: segmentState.profile,
        ...stepResults,
        step4_totalValue: {
          totalValueToCustomer: Math.max(0, metrics.totalWillingnessToPay ?? 0),
          valueWithoutNBA:
            'Total value calculated from NBA analysis and value differentiators when available.',
          calculationMethod:
            'NBA value plus sustainability differentiators derived from OpenAI or fallback data.',
        },
        executiveSummary,
      };
    });

    const crossSegmentSummary = this.buildCrossSegmentSummary(segments);

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
      segmentation,
      segments,
      crossSegmentSummary,
      _source: 'openai_multi_call',
      _timestamp: new Date().toISOString(),
    };
  }

  buildCrossSegmentSummary(segments = []) {
    if (!Array.isArray(segments) || segments.length === 0) {
      return { segments: [], summaryStats: null };
    }

    const series = segments.map(segment => {
      const recommendedPrice = segment.executiveSummary?.recommendedPrice ?? 0;
      const totalWillingnessToPay =
        segment.executiveSummary?.metrics?.totalWillingnessToPay ?? 0;
      const confidence = segment.executiveSummary?.confidenceLevel ?? 0;

      return {
        id: segment.id,
        name: segment.name,
        recommendedPrice,
        totalWillingnessToPay,
        confidence,
      };
    });

    const sorted = [...series].sort((a, b) => b.recommendedPrice - a.recommendedPrice);
    const highest = sorted[0] ?? null;
    const lowest = sorted[sorted.length - 1] ?? null;
    const average =
      series.reduce((acc, item) => acc + (item.recommendedPrice ?? 0), 0) / series.length;

    return {
      segments: series,
      summaryStats: {
        highest,
        lowest,
        spread:
          highest && lowest ? highest.recommendedPrice - lowest.recommendedPrice : 0,
        averageRecommendedPrice: Number.isFinite(average) ? Math.round(average) : 0,
      },
    };
  }

  calculateSegmentMetrics(stepResults = {}) {
    const nbaValue = stepResults.step1_nbaValue?.nbaValue ?? 0;
    const differentiators = Array.isArray(
      stepResults.step2_valueDifferentiators?.differentiators,
    )
      ? stepResults.step2_valueDifferentiators.differentiators
      : [];

    const differentiatorValue = differentiators.reduce(
      (acc, diff) => acc + (Number(diff?.value) || 0),
      0,
    );

    const totalWillingnessToPay =
      stepResults.step3_willingnessToPay?.totalWillingnessToPay ??
      nbaValue + differentiatorValue;

    const priceRecommendation = stepResults.step3_willingnessToPay?.priceRecommendation ?? null;

    return {
      nbaValue,
      differentiatorValue,
      totalWillingnessToPay,
      priceRecommendation,
    };
  }

  deriveConfidenceLevel(confidence) {
    if (typeof confidence === 'number' && Number.isFinite(confidence)) {
      return Math.max(0, Math.min(100, confidence));
    }

    if (typeof confidence === 'string') {
      const value = confidence.toLowerCase();
      if (value.includes('high')) {
        return 90;
      }
      if (value.includes('medium')) {
        return 80;
      }
      if (value.includes('low')) {
        return 65;
      }
    }

    return 85;
  }

  /**
   * Build an executive summary from step outputs.
   * @param {object} stepResults
   * @returns {object}
   */
  buildExecutiveSummary(stepResults) {
    const metrics = this.calculateSegmentMetrics(stepResults);
    const priceRecommendation = metrics.priceRecommendation ?? {};
    const recommendedPriceRaw = Number.isFinite(priceRecommendation.recommendedPrice)
      ? priceRecommendation.recommendedPrice
      : Number.isFinite(metrics.totalWillingnessToPay)
        ? metrics.totalWillingnessToPay
        : 0;
    const recommendedPrice = Number.isFinite(recommendedPriceRaw)
      ? Math.max(0, Math.round(recommendedPriceRaw))
      : 0;

    const confidenceLevel = this.deriveConfidenceLevel(priceRecommendation.confidence);
    const totalWillingness = Number.isFinite(metrics.totalWillingnessToPay)
      ? Math.max(0, metrics.totalWillingnessToPay)
      : 0;
    const differentiatorValue = Number.isFinite(metrics.differentiatorValue)
      ? metrics.differentiatorValue
      : 0;
    const nbaValue = Number.isFinite(metrics.nbaValue) ? Math.max(0, metrics.nbaValue) : 0;

    return {
      keyFindings: [
        'Value differentiators justify premium pricing versus NBA alternatives.',
        'Customer willingness to pay exceeds the NBA market baseline.',
        'Value communication should focus on quantified ROI and incentive capture.',
      ],
      recommendedPrice,
      confidenceLevel,
      nextSteps: [
        'Implement value-based pricing strategy.',
        'Develop comprehensive value communication materials.',
        'Train the commercial team on the refreshed value proposition.',
      ],
      metrics: {
        nbaValue,
        differentiatorValue,
        totalWillingnessToPay: totalWillingness,
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
    customerSegmentation: ({ baseInfo }) => {
      const productSnapshot = {
        name: baseInfo.name,
        description: baseInfo.description,
        knownAlternatives: baseInfo.alternatives,
        additionalInfo: baseInfo.additionalInfo,
        extractedDocuments: baseInfo.docs,
      };

      return `STEP 1 – CUSTOMER SEGMENTATION

Analyse the product information below and propose the primary customer segments that should be evaluated in a pricing assessment. Prioritise segment definitions that tie directly to economic value drivers, sustainability preferences, and adoption barriers. Limit to the 2-4 most actionable segments.

${this.formatContextForPrompt('PRODUCT_INPUT', productSnapshot, 2000)}

Return strictly valid JSON with this structure:
{
  "segmentationApproach": "How segments were identified",
  "keyObservations": ["Key insight 1", "Key insight 2"],
  "segments": [
    {
      "id": "short_identifier_no_spaces",
      "name": "Segment name",
      "description": "Concise description of who is in the segment",
      "primaryNeeds": ["Need 1", "Need 2"],
      "buyingCriteria": ["Criteria 1", "Criteria 2"],
      "pricingSensitivity": "low/medium/high",
      "representativeShare": "Approximate share e.g. 30%",
      "valueDriversFocus": ["Value driver focus areas"],
      "riskFactors": ["Risks that could limit adoption"]
    }
  ]
}`;
    },

    nbaAnalysis: ({ baseInfo, segment }) => {
      const productSnapshot = {
        name: baseInfo.name,
        description: baseInfo.description,
        knownAlternatives: baseInfo.alternatives,
        additionalInfo: baseInfo.additionalInfo,
        extractedDocuments: baseInfo.docs,
      };

      const segmentProfile = segment
        ? {
            name: segment.name,
            description: segment.description,
            primaryNeeds: segment.primaryNeeds,
            buyingCriteria: segment.buyingCriteria,
            pricingSensitivity: segment.pricingSensitivity,
            valueDriversFocus: segment.valueDriversFocus,
            riskFactors: segment.riskFactors,
          }
        : null;

      const segmentName = segment?.name ?? 'Target Segment';

      return `STEP 2 – NEXT BEST ALTERNATIVES (NBA) ANALYSIS FOR ${segmentName}

Identify the most relevant next best alternatives for the ${segmentName} based on the segment context and product information below. Focus on real competitors, substitutes, and adjacent solutions they would realistically evaluate. Highlight price points, positioning, and proof points tailored to this segment. Do not calculate an aggregate NBA value in this step.

${this.formatContextForPrompt('SEGMENT_PROFILE', segmentProfile, 1600)}

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
        "segmentSpecificNotes": ["Insights unique to this segment"]
      }
    }
  ],
  "marketPositioning": "Summary of positioning vs alternatives for this segment",
  "confidenceLevel": "High / Medium / Low"
}`;
    },

    nbaValueEstimation: ({ baseInfo, segment, nbaAnalysis }) => {
      const productSnapshot = {
        name: baseInfo.name,
        description: baseInfo.description,
        additionalInfo: baseInfo.additionalInfo,
      };

      const segmentProfile = segment
        ? {
            name: segment.name,
            pricingSensitivity: segment.pricingSensitivity,
            representativeShare: segment.representativeShare,
          }
        : null;

      const segmentName = segment?.name ?? 'Target Segment';

      return `STEP 2B – NBA VALUE ESTIMATION FOR ${segmentName}

Derive a representative NBA value for the ${segmentName} using the alternatives identified in the previous step. Reference segment-specific assumptions, weighting logic, and any relevant price evidence. Produce a single monetary value and clearly explain how it was calculated.

${this.formatContextForPrompt('SEGMENT_PROFILE', segmentProfile, 1200)}

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 2200)}

Return strictly valid JSON with this structure:
{
  "nbaValue": 0,
  "valuationMethodology": "How you calculated the representative NBA value for this segment",
  "justification": "Narrative summary referencing alternative data and assumptions",
  "assumptions": ["Key assumption list"],
  "confidenceLevel": "High / Medium / Low"
}`;
    },

    valueDifferentiators: ({ baseInfo, segment, nbaAnalysis, nbaValue }) => {
      const productSnapshot = {
        name: baseInfo.name,
        description: baseInfo.description,
        additionalInfo: baseInfo.additionalInfo,
      };

      const segmentProfile = segment
        ? {
            name: segment.name,
            primaryNeeds: segment.primaryNeeds,
            valueDriversFocus: segment.valueDriversFocus,
            pricingSensitivity: segment.pricingSensitivity,
          }
        : null;

      const segmentName = segment?.name ?? 'Target Segment';

      return `STEP 3 – VALUE DIFFERENTIATORS FOR ${segmentName}

Using the NBA analysis and NBA value estimation you just created, calculate the incremental economic value of the sustainable product versus those alternatives for the ${segmentName}. Focus on differentiators that map to the segment's primary needs and buying criteria. Quantify each value driver and tie it back to NBA prices.

${this.formatContextForPrompt('SEGMENT_PROFILE', segmentProfile, 1400)}

${this.formatContextForPrompt('PRODUCT_INPUT', productSnapshot, 1200)}

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 2000)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1400)}

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
      "economicRationale": "Why customers in this segment value this differentiator",
      "evidence": "Supporting data or references"
    }
  ],
  "totalDifferentiatorValue": 0
}`;
    },

    willingnessToPay: ({ baseInfo, segment, nbaAnalysis, nbaValue, valueDifferentiators }) => {
      const segmentProfile = segment
        ? {
            name: segment.name,
            pricingSensitivity: segment.pricingSensitivity,
            representativeShare: segment.representativeShare,
            riskFactors: segment.riskFactors,
          }
        : null;

      const segmentName = segment?.name ?? 'Target Segment';

      return `STEP 4 – WILLINGNESS TO PAY FOR ${segmentName}

Estimate the willingness to pay for the ${segmentName} using the NBA baseline, consolidated NBA value, and quantified differentiator value. Incorporate segment-specific pricing sensitivity, adoption risks, and growth potential.

${this.formatContextForPrompt('SEGMENT_PROFILE', segmentProfile, 1200)}

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 1600)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1400)}

VALUE DIFFERENTIATOR CONTEXT:
${this.formatContextForPrompt('VALUE_DIFFERENTIATORS', valueDifferentiators, 2000)}

Return strictly valid JSON:
{
  "calculation": "Narrative description of how NBA + differentiators informed willingness to pay",
  "nbaValue": 0,
  "differentiatorValue": 0,
  "totalWillingnessToPay": 0,
  "priceRecommendation": {
    "recommendedPrice": 0,
    "floorPrice": 0,
    "stretchPrice": 0,
    "confidence": "High / Medium / Low",
    "rationale": "Why this pricing envelope suits the segment"
  },
  "sensitivityAnalysis": [
    {
      "factor": "Variable that impacts willingness",
      "impact": "How it changes pricing posture"
    }
  ]
}`;
    },

    customerCommunication: ({
      baseInfo,
      segment,
      nbaAnalysis,
      nbaValue,
      valueDifferentiators,
      willingnessToPay,
    }) => {
      const segmentProfile = segment
        ? {
            name: segment.name,
            primaryNeeds: segment.primaryNeeds,
            buyingCriteria: segment.buyingCriteria,
            valueDriversFocus: segment.valueDriversFocus,
          }
        : null;

      const segmentName = segment?.name ?? 'Target Segment';

      return `STEP 5 – CUSTOMER COMMUNICATION PLAN FOR ${segmentName}

Design the communication strategy for the ${segmentName} using the quantified NBA baseline, differentiator value, and willingness-to-pay result. Emphasise how to translate the economics into segment-specific messaging, tools, and enablement assets.

${this.formatContextForPrompt('SEGMENT_PROFILE', segmentProfile, 1400)}

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 1400)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1200)}

VALUE DIFFERENTIATOR CONTEXT:
${this.formatContextForPrompt('VALUE_DIFFERENTIATORS', valueDifferentiators, 1600)}

WILLINGNESS TO PAY CONTEXT:
${this.formatContextForPrompt('WILLINGNESS_TO_PAY', willingnessToPay, 1400)}

Return strictly valid JSON in this format:
{
  "communicationStrategy": "High-level approach tailored to the segment",
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
  "lifetimeGuidance": { ... },
  "storytellingThemes": ["Key narrative themes for this segment"]
}`;
    },

    companyGuidance: ({
      baseInfo,
      segment,
      nbaAnalysis,
      nbaValue,
      valueDifferentiators,
      willingnessToPay,
      communication,
    }) => {
      const segmentProfile = segment
        ? {
            name: segment.name,
            pricingSensitivity: segment.pricingSensitivity,
            valueDriversFocus: segment.valueDriversFocus,
            riskFactors: segment.riskFactors,
          }
        : null;

      const segmentName = segment?.name ?? 'Target Segment';

      return `STEP 6 – COMPANY ENABLEMENT GUIDANCE FOR ${segmentName}

Assess organisational strengths, weaknesses, and next steps required to deliver the quantified value for the ${segmentName}. Anchor recommendations in the NBA findings, differentiator insights, willingness-to-pay outcomes, and communication plan.

${this.formatContextForPrompt('SEGMENT_PROFILE', segmentProfile, 1400)}

NBA ANALYSIS CONTEXT:
${this.formatContextForPrompt('NBA_ANALYSIS_RESULT', nbaAnalysis, 1200)}

NBA VALUE CONTEXT:
${this.formatContextForPrompt('NBA_VALUE_RESULT', nbaValue, 1200)}

VALUE DIFFERENTIATOR CONTEXT:
${this.formatContextForPrompt('VALUE_DIFFERENTIATORS', valueDifferentiators, 1400)}

WILLINGNESS TO PAY CONTEXT:
${this.formatContextForPrompt('WILLINGNESS_TO_PAY', willingnessToPay, 1200)}

COMMUNICATION PLAN CONTEXT:
${this.formatContextForPrompt('COMMUNICATION_PLAN', communication, 1200)}

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
    "currentPosition": "Current market position for the segment",
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
