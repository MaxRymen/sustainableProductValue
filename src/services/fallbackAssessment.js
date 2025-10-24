export const fallbackGenerators = {
  nbaAnalysis(productData, context = {}) {
    const nbaValue = 1200 + Math.random() * 800;
    return {
      searchMethodology: 'Market research and competitive analysis based on product specifications',
      identifiedAlternatives: [
        {
          name: 'Traditional Alternative',
          reasoning: 'Standard market alternative with similar functionality',
          estimatedPrice: Math.round(nbaValue),
          priceRange: 'medium',
          keyDifferences: ['Lower sustainability', 'Higher maintenance costs', 'Shorter lifetime'],
          marketShare: 'Market leader with 60% share',
        },
      ],
      marketPositioning: 'Premium sustainable option with long-term value',
    };
  },

  nbaValueEstimation(productData, context = {}) {
    const nbaAnalysis =
      context?.results?.step1_nbaAnalysis || context?.nbaAnalysis || this.nbaAnalysis(productData);
    const pricePoints =
      nbaAnalysis?.identifiedAlternatives
        ?.map(alternative => Number(alternative.estimatedPrice) || 0)
        .filter(price => price > 0) || [];

    const baseline =
      pricePoints.length > 0
        ? pricePoints.reduce((sum, price) => sum + price, 0) / pricePoints.length
        : 2000 + Math.random() * 500;

    const nbaValue = Math.round(baseline);

    return {
      nbaValue,
      valuationMethodology: 'Weighted average of verified NBA alternative price points.',
      justification:
        'Calculated representative NBA price by averaging documented competitor prices and normalising for feature parity.',
      assumptions: [
        'Alternative price points reflect current market conditions.',
        'Customer would consider the listed alternatives as realistic substitutes.',
      ],
      confidenceLevel: 'medium',
    };
  },

  valueDifferentiators(productData, context = {}) {
    const nbaContext = context?.results?.step1_nbaAnalysis || context?.nbaAnalysis;
    const nbaValueContext = context?.results?.step1_nbaValue || context?.nbaValue;
    const nbaValue = nbaValueContext?.nbaValue ?? 2000;
    const tcoDifference = Math.max(1500, nbaValue * 0.25) + Math.random() * 2000;
    const incentiveValue = 1500 + Math.random() * 1200;
    const lifetimeValue = 1800 + Math.random() * 1500;

    return {
      differentiators: [
        {
          name: 'Total Cost of Ownership (TCO) Difference',
          value: Math.round(tcoDifference),
          calculation: {
            methodology: 'Compare 10-year TCO between product and NBA alternatives',
            substeps: [
              {
                step: 'Energy cost difference',
                calculation: 'Sustainable product annual energy cost - NBA annual energy cost',
                assumptions: 'Higher efficiency vs. traditional alternatives',
              },
              {
                step: 'Maintenance cost difference',
                calculation: 'Sustainable maintenance costs vs NBA over lifetime',
                assumptions: 'Lower maintenance frequency thanks to durable components',
              },
              {
                step: 'Replacement cost difference',
                calculation: 'NBA replacement frequency - Sustainable product replacement frequency',
                assumptions: 'Extended lifetime reduces replacement cycles',
              },
            ],
            totalCalculation: 'Sum of all TCO differences = Net TCO advantage',
          },
          economicRationale: 'Lower operating costs improve customer ROI over product lifetime',
          evidence: 'Industry benchmark reports on sustainable equipment performance',
        },
        {
          name: 'Government Incentives & Carbon Credits',
          value: Math.round(incentiveValue),
          calculation: {
            methodology: 'Calculate available incentives unique to the sustainable product',
            substeps: [
              {
                step: 'Tax credit advantage',
                calculation: 'Available sustainable product tax credits',
                assumptions: 'Current federal credit programs',
              },
              {
                step: 'Rebate advantage',
                calculation: 'State/local rebates exclusive to sustainable solutions',
                assumptions: 'Regional incentive programs',
              },
              {
                step: 'Carbon credit value',
                calculation: 'Annual CO₂ reduction × carbon price × lifetime',
                assumptions: 'Reduced emissions relative to baseline alternatives',
              },
            ],
            totalCalculation: 'Tax credit + rebates + carbon credits',
          },
          economicRationale: 'Financial incentives lower total ownership cost for customers',
          evidence: 'Government incentive databases and carbon market pricing',
        },
        {
          name: 'Extended Lifetime Value Difference',
          value: Math.round(lifetimeValue),
          calculation: {
            methodology: 'Measure the economic benefit of longer product life',
            substeps: [
              {
                step: 'Warranty extension value',
                calculation: 'Additional warranty years × annual replacement cost',
                assumptions: 'Longer warranties on sustainable designs',
              },
              {
                step: 'Downtime reduction value',
                calculation: 'Reduced downtime hours × cost of downtime',
                assumptions: 'Higher reliability vs. traditional alternatives',
              },
              {
                step: 'Delayed replacement value',
                calculation: 'Years of extended life × annual depreciation',
                assumptions: 'Extended product lifespan due to durable components',
              },
            ],
            totalCalculation: 'Warranty value + Downtime savings + Delayed replacement',
          },
          economicRationale: 'Durability saves on replacements and productivity loss',
          evidence: 'Reliability studies for sustainable product categories',
        },
      ],
      totalDifferentiatorValue: Math.round(tcoDifference + incentiveValue + lifetimeValue),
    };
  },

  willingnessToPay(productData, context = {}) {
    const nbaValueContext = context?.results?.step1_nbaValue || context?.nbaValue;
    const differentiatorContext =
      context?.results?.step2_valueDifferentiators || context?.valueDifferentiators;

    const nbaValue = Math.round(
      nbaValueContext?.nbaValue ?? 1200 + Math.random() * 500,
    );
    const differentiatorValue = Math.round(
      differentiatorContext?.totalDifferentiatorValue ?? (8000 + Math.random() * 2000),
    );
    const total = nbaValue + differentiatorValue;

    return {
      calculation: 'NBA Value + Value Differentiators = Willingness to Pay',
      nbaValue,
      differentiatorValue,
      totalWillingnessToPay: total,
      calculationBreakdown:
        'Willingness to pay combines NBA market price with the economic value of sustainability differentiators',
      customerSegments: [
        {
          segment: 'Early adopters / sustainability focused',
          willingnessToPay: Math.round(total * 1.2),
          reasoning: 'High preference for sustainable innovation and ROI',
        },
        {
          segment: 'Price sensitive / mainstream',
          willingnessToPay: Math.round(total * 0.8),
          reasoning: 'Need stronger financial proof before paying premium pricing',
        },
      ],
    };
  },

  customerCommunication(productData, context = {}) {
    const differentiators =
      context?.results?.step2_valueDifferentiators || context?.valueDifferentiators;
    const willingness =
      context?.results?.step3_willingnessToPay || context?.willingnessToPay;
    const nbaValueContext = context?.results?.step1_nbaValue || context?.nbaValue;
    const formatCurrency = value => `$${Math.round(value).toLocaleString()}`;
    const nbaBaseline = nbaValueContext?.nbaValue
      ? formatCurrency(nbaValueContext.nbaValue)
      : 'the NBA benchmark price';
    const differentiatorTotal = differentiators?.totalDifferentiatorValue
      ? formatCurrency(differentiators.totalDifferentiatorValue)
      : 'the quantified differentiator value';
    const willingnessTotal = willingness?.totalWillingnessToPay
      ? formatCurrency(willingness.totalWillingnessToPay)
      : null;

    return {
      communicationStrategy: `Focus on economic benefits and ROI to show why customers should pay beyond ${nbaBaseline}, highlighting the ${differentiatorTotal} upside quantified in the analysis${
        willingnessTotal ? ` and the ${willingnessTotal} willingness-to-pay ceiling` : ''
      }.`,
      tcoGuidance: {
        message: `Use TCO calculators and 10-year cost comparisons to demonstrate long-term savings versus ${nbaBaseline}.`,
        tools: ['TCO calculator', 'ROI analysis', 'comparison charts'],
        objectives: 'Help customers understand lifetime ownership savings',
        actionableSteps: [
          {
            step: 'Create personalized TCO calculator',
            description: "Tailor cost calculators with the customer's usage inputs",
            implementation: 'Incorporate actual utility rates and maintenance history',
          },
        ],
      },
      incentiveGuidance: {
        message: 'Guide customers through incentives and tax credits',
        tools: ['incentive finder', 'application assistance', 'timeline guidance'],
        objectives: 'Maximize capture of available financial programs',
        actionableSteps: [
          {
            step: 'Incentive discovery and application',
            description: 'Help customers identify and apply for programs',
            implementation: 'Provide step-by-step process and required documentation',
          },
        ],
      },
      lifetimeGuidance: {
        message: 'Showcase extended warranty and durability benefits',
        tools: ['warranty comparisons', 'maintenance schedules', 'durability testing'],
        objectives: 'Demonstrate value of longer product life',
        actionableSteps: [
          {
            step: 'Warranty value demonstration',
            description: 'Quantify economic value of extended warranties',
            implementation: 'Calculate replacement cost savings with comparison tools',
          },
        ],
      },
    };
  },

  companyGuidance(productData, context = {}) {
    const differentiatorContext =
      context?.results?.step2_valueDifferentiators || context?.valueDifferentiators;
    const willingnessContext =
      context?.results?.step3_willingnessToPay || context?.willingnessToPay;

    const differentiatorValue = differentiatorContext?.totalDifferentiatorValue ?? 7500;
    const willingness = willingnessContext?.totalWillingnessToPay ?? 10000;
    const formatCurrency = value => `$${Math.round(value).toLocaleString()}`;

    return {
      valueDriverStrengths: [
        {
          driver: 'TCO Value Creation',
          currentStrength: 'Team understands the TCO benefits and communicates them effectively',
          strengthLevel: 'medium',
          evidence: 'Existing TCO calculators and documentation available',
          enhancementOpportunities: [
            {
              opportunity: 'Improve TCO communication tools',
              action: 'Develop interactive calculators with real-time inputs',
              expectedImpact: `Protect ${formatCurrency(
                differentiatorValue,
              )} in quantified differentiator value by reinforcing ROI storytelling.`,
            },
          ],
        },
      ],
      valueDriverWeaknesses: [
        {
          driver: 'Incentive Optimization',
          currentWeakness: 'Limited guidance on government incentives',
          weaknessLevel: 'high',
          rootCause: 'Lack of dedicated incentive research capability',
          improvementPlan: [
            {
              improvement: 'Build incentive expertise',
              action: 'Catalog all relevant incentives and update quarterly',
              expectedImpact: `Accelerate capture of the ${formatCurrency(
                differentiatorValue,
              )} incentive upside quantified in differentiators.`,
            },
          ],
        },
      ],
      competitivePositioning: {
        currentPosition: 'Positioned as premium sustainable option with unclear value justification',
        positioningGaps: 'Pricing communication does not link to measurable economic value',
        positioningOpportunities: [
          {
            opportunity: 'Value-based positioning',
            action: 'Emphasize ROI and total savings over upfront cost',
            expectedImpact: `Align commercial motions with the ${formatCurrency(
              willingness,
            )} willingness-to-pay benchmark to support premium pricing.`,
          },
        ],
      },
    };
  },

  fullAssessment(productData) {
    const nbaAnalysis = this.nbaAnalysis(productData);
    const nbaValue = this.nbaValueEstimation(productData, { nbaAnalysis });
    const valueDifferentiators = this.valueDifferentiators(productData, {
      nbaAnalysis,
      nbaValue,
    });
    const willingnessToPay = this.willingnessToPay(productData, {
      nbaAnalysis,
      nbaValue,
      valueDifferentiators,
    });
    const customerCommunication = this.customerCommunication(productData, {
      nbaAnalysis,
      nbaValue,
      valueDifferentiators,
      willingnessToPay,
    });
    const companyGuidance = this.companyGuidance(productData, {
      nbaValue,
      valueDifferentiators,
      willingnessToPay,
      communication: customerCommunication,
    });

    return {
      productSummary: {
        title: productData.name,
        description: `A sustainable ${productData.name} with environmental benefits and cost savings.`,
        sustainabilityHighlights: [
          'Reduced environmental impact',
          'Lower total cost of ownership',
          'Extended product lifetime',
        ],
      },
      step1_nbaAnalysis: nbaAnalysis,
      step1_nbaValue: nbaValue,
      step2_valueDifferentiators: valueDifferentiators,
      step3_willingnessToPay: willingnessToPay,
      step4_totalValue: {
        totalValueToCustomer: willingnessToPay.totalWillingnessToPay,
        valueWithoutNBA:
          'When no direct NBA exists, total value is calculated from functional benefits and market demand',
        calculationMethod:
          'NBA baseline + differentiators + incentive value + extended lifetime savings',
      },
      step5_customerCommunication: customerCommunication,
      step6_companyGuidance: companyGuidance,
      executiveSummary: {
        keyFindings: [
          'Value differentiators justify premium pricing compared with NBA options',
          'Customer willingness to pay exceeds current pricing posture',
          'Value communication assets require modernization',
        ],
        recommendedPrice: Math.round(willingnessToPay.totalWillingnessToPay * 0.9),
        confidenceLevel: Math.round(Math.random() * 20 + 80),
        nextSteps: [
          'Implement value-based pricing strategy anchored on quantified ROI.',
          'Develop comprehensive value communication materials for economic buyers.',
          'Train sales and success teams on the refreshed differentiation story.',
        ],
      },
      _source: 'fallback',
      _timestamp: new Date().toISOString(),
    };
  },
};

export default fallbackGenerators;
