const randomBetween = (min, max) => Math.random() * (max - min) + min;

const pricingSensitivityFactor = sensitivity => {
  const value = (sensitivity ?? '').toString().toLowerCase();
  switch (value) {
    case 'low':
      return 1.15;
    case 'medium':
      return 1;
    case 'high':
      return 0.85;
    default:
      return 1;
  }
};

const qualitativeConfidence = sensitivity => {
  const value = (sensitivity ?? '').toString().toLowerCase();
  switch (value) {
    case 'low':
      return 'High';
    case 'medium':
      return 'Medium-High';
    case 'high':
      return 'Medium';
    default:
      return 'Medium-High';
  }
};

const numericConfidence = sensitivity => {
  const value = (sensitivity ?? '').toString().toLowerCase();
  switch (value) {
    case 'low':
      return 88;
    case 'medium':
      return 82;
    case 'high':
      return 75;
    default:
      return 80;
  }
};

const slugify = (value, fallback, index = 0) => {
  const base =
    value?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
    fallback ||
    'segment';
  return `${base}-${index + 1}`;
};

const sumDifferentiators = differentiators =>
  (differentiators ?? []).reduce((acc, diff) => acc + (Number(diff?.value) || 0), 0);

const formatCurrency = value => `$${Math.round(value ?? 0).toLocaleString()}`;

const buildCrossSegmentSummary = (segments = []) => {
  if (!Array.isArray(segments) || segments.length === 0) {
    return { segments: [], summaryStats: null };
  }

  const series = segments.map(segment => ({
    id: segment.id,
    name: segment.name,
    recommendedPrice: segment.executiveSummary?.recommendedPrice ?? 0,
    totalWillingnessToPay: segment.executiveSummary?.metrics?.totalWillingnessToPay ?? 0,
    confidence: segment.executiveSummary?.confidenceLevel ?? 0,
  }));

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
      spread: highest && lowest ? highest.recommendedPrice - lowest.recommendedPrice : 0,
      averageRecommendedPrice: Number.isFinite(average) ? Math.round(average) : 0,
    },
  };
};

export const fallbackGenerators = {
  customerSegmentation(productData, context = {}) {
    const segments = [
      {
        id: 'eco-leaders',
        name: 'Eco Leaders',
        description:
          'Sustainability-first enterprises with mandates to aggressively reduce Scope 1 & 2 emissions.',
        primaryNeeds: [
          'Verified sustainability impact',
          'Innovation leadership and brand differentiation',
          'Partnership on reporting and compliance',
        ],
        buyingCriteria: [
          'Documented emissions reduction',
          'Proven ROI within 24-36 months',
          'Enterprise-grade support and integration',
        ],
        pricingSensitivity: 'low',
        representativeShare: '25%',
        valueDriversFocus: [
          'Carbon reduction monetisation',
          'Brand leadership halo effects',
          'Access to incentives and credits',
        ],
        riskFactors: [
          'Requires robust measurement and verification capabilities',
          'Long procurement cycles with extensive stakeholder reviews',
        ],
      },
      {
        id: 'roi-optimisers',
        name: 'ROI-Focused Operators',
        description:
          'Operational leaders balancing sustainability goals with strict payback thresholds.',
        primaryNeeds: [
          'Clear total cost of ownership savings',
          'Minimal disruption to operations',
          'Proof of stable performance',
        ],
        buyingCriteria: [
          'Payback in under 3 years',
          'Demonstrated maintenance savings',
          'Training and enablement support',
        ],
        pricingSensitivity: 'medium',
        representativeShare: '40%',
        valueDriversFocus: [
          'Operating expense reductions',
          'Uptime and reliability improvements',
          'Maintenance simplification',
        ],
        riskFactors: [
          'Need quantifiable business case data',
          'Sceptical of untested sustainability claims',
        ],
      },
      {
        id: 'cost-pragmatists',
        name: 'Cost-Conscious Pragmatists',
        description:
          'Budget-driven buyers open to sustainability upgrades when economics are compelling.',
        primaryNeeds: [
          'Competitive upfront price',
          'Financing or incentive support',
          'Assurance of long-term durability',
        ],
        buyingCriteria: [
          'Low capital requirement',
          'Bundled incentives and financing',
          'Peer proof points',
        ],
        pricingSensitivity: 'high',
        representativeShare: '35%',
        valueDriversFocus: [
          'Subsidies and rebates',
          'Maintenance avoidance',
          'Extended warranty coverage',
        ],
        riskFactors: [
          'High sensitivity to initial price premium',
          'Need references from similar budget profiles',
        ],
      },
    ];

    return {
      segmentationApproach:
        'Heuristic segmentation based on sustainability maturity, budget posture, and decision criteria observed across similar product launches.',
      keyObservations: [
        'Willingness to pay increases with sustainability mandates and access to incentives.',
        'Operational ROI remains critical for mainstream segments even when sustainability is valued.',
        'Budget-sensitive buyers still convert when lifetime savings and financing support are explicit.',
      ],
      segments,
    };
  },

  nbaAnalysis(productData, context = {}) {
    const segment = context?.segment;
    const segmentName = segment?.name ?? 'General Market';
    const multiplier = pricingSensitivityFactor(segment?.pricingSensitivity);
    const primaryPrice = randomBetween(1400, 2300) * multiplier;
    const challengerPrice = randomBetween(1000, 1800) * multiplier * 0.95;

    return {
      searchMethodology: `Secondary research focused on offerings shortlisted by ${segmentName}, combining analyst reports, marketplace pricing, and peer case studies.`,
      identifiedAlternatives: [
        {
          name: 'Established OEM Alternative',
          reasoning: `${segmentName} often shortlist long-standing OEMs with nationwide service coverage.`,
          estimatedPrice: Math.round(primaryPrice),
          priceRange: multiplier > 1 ? 'high' : 'medium',
          keyDifferences: [
            'Lower sustainability performance',
            'Higher energy consumption',
            'Shorter warranty coverage',
          ],
          marketShare: 'Market leader with approximately 55% share across mainstream buyers',
          proofPoints: {
            priceSources: [
              {
                source: 'Industry pricing index',
                url: 'https://example.com/pricing-index',
                price: `$${Math.round(primaryPrice).toLocaleString()}`,
                reliability: 'Aggregated benchmark data for comparable configurations',
              },
            ],
            segmentSpecificNotes: [
              `${segmentName} values the predictable maintenance network despite weaker sustainability credentials.`,
            ],
          },
        },
        {
          name: 'Budget Import Option',
          reasoning: `${segmentName} consider lower-priced imports to test premium positioning.`,
          estimatedPrice: Math.round(challengerPrice),
          priceRange: multiplier < 1 ? 'low' : 'medium',
          keyDifferences: [
            'Limited sustainability certifications',
            'Minimal after-sales support',
            'Shorter expected lifetime',
          ],
          marketShare: 'Challenger brand growing share with budget-focused customers',
          proofPoints: {
            priceSources: [
              {
                source: 'Public marketplace listings',
                url: 'https://example.com/marketplace',
                price: `$${Math.round(challengerPrice).toLocaleString()}`,
                reliability: 'Validated across multiple sellers within the past quarter',
              },
            ],
            segmentSpecificNotes: [
              `${segmentName} recognises the upfront savings but raises concerns about downtime risk.`,
            ],
          },
        },
      ],
      marketPositioning: `${segmentName} view the sustainable product as the premium option that offsets a higher upfront price with verifiable lifetime value.`,
      confidenceLevel: 'medium',
    };
  },

  nbaValueEstimation(productData, context = {}) {
    const segment = context?.segment;
    const segmentResults = context?.results || context?.segmentResults || {};
    const nbaAnalysis =
      segmentResults.step1_nbaAnalysis ||
      context?.nbaAnalysis ||
      this.nbaAnalysis(productData, { segment });

    const pricePoints =
      nbaAnalysis?.identifiedAlternatives
        ?.map(alternative => Number(alternative?.estimatedPrice) || 0)
        .filter(price => price > 0) ?? [];

    const baseAverage =
      pricePoints.length > 0
        ? pricePoints.reduce((sum, price) => sum + price, 0) / pricePoints.length
        : randomBetween(1800, 2600);

    const multiplier = pricingSensitivityFactor(segment?.pricingSensitivity);
    const nbaValue = Math.round(baseAverage * multiplier);

    return {
      nbaValue,
      valuationMethodology: `Weighted average of verified NBA price points adjusted for ${segment?.name ?? 'the target segment'} purchasing patterns.`,
      justification:
        'Benchmark accounts for typical option mix, service packages, and volume discounts observed in similar deals.',
      assumptions: [
        'Reference prices remain valid for the current budgeting cycle.',
        `${segment?.name ?? 'The segment'} generally negotiates 5-8% off list prices based on volume.`,
      ],
      confidenceLevel: multiplier > 1 ? 'high' : multiplier < 1 ? 'medium' : 'medium-high',
    };
  },

  valueDifferentiators(productData, context = {}) {
    const segment = context?.segment;
    const segmentName = segment?.name ?? 'this segment';
    const segmentResults = context?.results || context?.segmentResults || {};
    const nbaValueContext = segmentResults.step1_nbaValue || context?.nbaValue;
    const nbaValue = nbaValueContext?.nbaValue ?? Math.round(randomBetween(1800, 2600));
    const multiplier = pricingSensitivityFactor(segment?.pricingSensitivity);

    const tcoDifference = Math.max(1500, nbaValue * 0.24) * multiplier + randomBetween(400, 900);
    const incentiveValue =
      (segmentName === 'Eco Leaders' ? 1800 : 1300) * multiplier + randomBetween(200, 600);
    const lifetimeValue =
      (segment?.pricingSensitivity === 'high' ? 1400 : 1900) * multiplier + randomBetween(300, 700);

    const differentiators = [
      {
        name: 'Total Cost of Ownership (TCO) Advantage',
        value: Math.round(tcoDifference),
        calculation: {
          methodology: 'Compare 10-year operating, maintenance, and downtime costs versus NBA set.',
          substeps: [
            {
              step: 'Energy savings',
              calculation: 'Annual kWh reduction × utility rate × 10 years',
              assumptions: 'Higher efficiency vs. legacy alternatives',
            },
            {
              step: 'Maintenance avoidance',
              calculation: 'Reduced technician visits × labour rate × contract duration',
              assumptions: 'Predictive maintenance and modular components',
            },
            {
              step: 'Downtime avoided',
              calculation: 'Hours avoided × productivity cost',
              assumptions: 'Higher reliability from sustainable design',
            },
          ],
          totalCalculation: 'Sum of energy, maintenance, and downtime savings',
        },
        economicRationale: `${segmentName} unlocks compounding OPEX benefits while protecting uptime.`,
        evidence: 'Benchmark case studies and internal service logs for sustainable fleets.',
      },
      {
        name: 'Incentives & Credits Capture',
        value: Math.round(incentiveValue),
        calculation: {
          methodology: 'Aggregate tax credits, grants, and carbon monetisation unique to the product.',
          substeps: [
            {
              step: 'Federal/State incentives',
              calculation: 'Eligible tax credit value × adoption likelihood',
              assumptions: 'Current policy outlook and product eligibility',
            },
            {
              step: 'Utility rebates',
              calculation: 'Local incentive amount × coverage rate',
              assumptions: 'Average rebate utilisation for similar customers',
            },
            {
              step: 'Carbon monetisation',
              calculation: 'Annual emissions reduction × carbon price × product lifetime',
              assumptions: 'Regional carbon pricing scenarios',
            },
          ],
          totalCalculation: 'Sum of all accessible incentive pools',
        },
        economicRationale: `${segmentName} can offset upfront premiums by maximising incentive capture.`,
        evidence: 'Government programme databases and sustainability finance benchmarks.',
      },
      {
        name: 'Extended Lifetime Value',
        value: Math.round(lifetimeValue),
        calculation: {
          methodology: 'Quantify the economic benefit of longer product lifespan and warranty coverage.',
          substeps: [
            {
              step: 'Warranty extension impact',
              calculation: 'Additional warranty years × equivalent replacement cost',
              assumptions: 'OEM-backed warranty and reliability data',
            },
            {
              step: 'Residual value protection',
              calculation: 'Higher resale value × fleet replacement cadence',
              assumptions: 'Improved asset care from sustainable design',
            },
            {
              step: 'Productivity gains',
              calculation: 'Reduced downtime × revenue per hour',
              assumptions: 'Stabilised operations vs. NBA alternatives',
            },
          ],
          totalCalculation: 'Warranty value + residual protection + productivity gains',
        },
        economicRationale: `${segmentName} benefit from predictable asset performance and lifecycle savings.`,
        evidence: 'Internal reliability testing and customer case studies.',
      },
    ];

    return {
      differentiators,
      totalDifferentiatorValue: Math.round(sumDifferentiators(differentiators)),
    };
  },

  willingnessToPay(productData, context = {}) {
    const segment = context?.segment;
    const segmentName = segment?.name ?? 'this segment';
    const segmentResults = context?.results || context?.segmentResults || {};
    const nbaValueContext = segmentResults.step1_nbaValue || context?.nbaValue;
    const differentiatorContext =
      segmentResults.step2_valueDifferentiators || context?.valueDifferentiators;

    const baseNbaValue = nbaValueContext?.nbaValue ?? Math.round(randomBetween(1800, 2600));
    const differentiatorValue =
      differentiatorContext?.totalDifferentiatorValue ?? Math.round(randomBetween(4200, 6800));

    const sensitivity = (segment?.pricingSensitivity ?? '').toLowerCase();
    const adjustment = sensitivity === 'low' ? 1.08 : sensitivity === 'high' ? 0.9 : 1;
    const totalWillingnessToPay = Math.round((baseNbaValue + differentiatorValue) * adjustment);

    const recommendedPrice = Math.round(
      totalWillingnessToPay * (sensitivity === 'high' ? 0.88 : sensitivity === 'low' ? 0.95 : 0.92),
    );
    const floorPrice = Math.round(recommendedPrice * 0.9);
    const stretchPrice = Math.round(recommendedPrice * (sensitivity === 'low' ? 1.22 : 1.15));

    return {
      calculation:
        'NBA baseline plus quantified differentiators, adjusted by segment pricing sensitivity and adoption risk.',
      nbaValue: Math.round(baseNbaValue),
      differentiatorValue: Math.round(differentiatorValue),
      totalWillingnessToPay,
      priceRecommendation: {
        recommendedPrice,
        floorPrice,
        stretchPrice,
        confidence: qualitativeConfidence(segment?.pricingSensitivity),
        rationale: `${segmentName} can justify a premium when value realisation and incentive access are clearly documented.`,
      },
      sensitivityAnalysis: [
        {
          factor: 'Availability of incentives and subsidies',
          impact: 'Reduced incentive availability decreases willingness to pay by 8-12%.',
        },
        {
          factor: 'Implementation complexity',
          impact:
            'Higher perceived deployment effort requires additional ROI proof points to maintain premium pricing.',
        },
      ],
    };
  },

  customerCommunication(productData, context = {}) {
    const segment = context?.segment;
    const segmentName = segment?.name ?? 'this segment';
    const differentiators =
      context?.results?.step2_valueDifferentiators || context?.valueDifferentiators || {};
    const willingness =
      context?.results?.step3_willingnessToPay || context?.willingnessToPay || {};
    const nbaValueContext = context?.results?.step1_nbaValue || context?.nbaValue || {};

    const nbaBaseline = nbaValueContext?.nbaValue
      ? formatCurrency(nbaValueContext.nbaValue)
      : 'the NBA benchmark price';
    const totalDifferentiatorValue = differentiators?.totalDifferentiatorValue
      ? formatCurrency(differentiators.totalDifferentiatorValue)
      : 'the quantified differentiator value';
    const recommendedPrice = willingness?.priceRecommendation?.recommendedPrice
      ? formatCurrency(willingness.priceRecommendation.recommendedPrice)
      : null;

    return {
      communicationStrategy: `Show ${segmentName} how the solution outperforms ${nbaBaseline} by translating quantified savings (${totalDifferentiatorValue}) into clear payback stories${recommendedPrice ? ` and anchor the commercial conversation around a recommended price of ${recommendedPrice}` : ''}.`,
      tcoGuidance: {
        message: `Use interactive TCO tools to reveal lifetime savings versus ${nbaBaseline}.`,
        tools: [
          'Segment-specific TCO calculator',
          'Custom ROI case deck',
          'Operational benchmarking sheet',
        ],
        objectives: 'Demonstrate a fast, dependable payback window tailored to their usage profile.',
        actionableSteps: [
          {
            step: 'Configure segment persona calculator',
            description: `Pre-load ${segmentName} assumptions (usage, costs, incentives) to accelerate workshops.`,
            implementation: 'Collaborate with finance and sustainability teams to validate inputs.',
          },
        ],
      },
      incentiveGuidance: {
        message: 'Package the incentive capture process into a guided journey.',
        tools: [
          'Incentive eligibility checklist',
          'Application playbook',
          'Funding timeline tracker',
        ],
        objectives: 'De-risk the administrative burden and accelerate incentive access.',
        actionableSteps: [
          {
            step: 'Launch incentive concierge',
            description: 'Provide white-glove support to gather documentation and submit applications.',
            implementation: 'Align legal and finance resources to streamline compliance reviews.',
          },
        ],
      },
      lifetimeGuidance: {
        message: 'Highlight durability, uptime, and warranty protections that safeguard operations.',
        tools: ['Warranty comparison sheet', 'Reliability benchmark', 'Lifecycle service plan'],
        objectives: 'Assure stakeholders that premium pricing protects long-term performance.',
        actionableSteps: [
          {
            step: 'Bundle lifecycle assurance kit',
            description: 'Offer optional service packages tying uptime guarantees to measurable KPIs.',
            implementation: 'Coordinate product, service, and customer success teams on delivery model.',
          },
        ],
      },
      storytellingThemes: [
        `${segmentName} captures measurable ROI and risk mitigation with the sustainable option.`,
        'Incentive enablement removes friction and offsets upfront investment.',
        'Long-term reliability and warranty support reduce operational surprises.',
      ],
    };
  },

  companyGuidance(productData, context = {}) {
    const segment = context?.segment;
    const segmentName = segment?.name ?? 'this segment';
    const differentiatorContext =
      context?.results?.step2_valueDifferentiators || context?.valueDifferentiators || {};
    const willingnessContext =
      context?.results?.step3_willingnessToPay || context?.willingnessToPay || {};

    const differentiatorValue =
      differentiatorContext?.totalDifferentiatorValue ||
      sumDifferentiators(differentiatorContext?.differentiators);
    const willingness = willingnessContext?.totalWillingnessToPay ?? differentiatorValue;

    return {
      valueDriverStrengths: [
        {
          driver: 'Quantified ROI Storytelling',
          currentStrength: 'Commercial teams already leverage TCO calculators and success stories.',
          strengthLevel: 'medium',
          evidence: 'Existing case studies and ROI templates referenced in recent deals.',
          enhancementOpportunities: [
            {
              opportunity: 'Segment-persona proof packs',
              action: `Create tailored ROI and incentive artefacts for ${segmentName}.`,
              expectedImpact: `Protect ${formatCurrency(
                differentiatorValue,
              )} in value creation by aligning with segment priorities.`,
            },
          ],
        },
      ],
      valueDriverWeaknesses: [
        {
          driver: 'Incentive Execution',
          currentWeakness: 'Fragmented ownership of incentive research and application support.',
          weaknessLevel: 'high',
          rootCause: 'Limited dedicated resources for sustainability financing programmes.',
          improvementPlan: [
            {
              improvement: 'Build incentive desk capability',
              action: 'Centralise programme intelligence and create repeatable workflows.',
              expectedImpact: `Accelerate capture of the ${formatCurrency(
                differentiatorValue,
              )} incentive upside quantified in differentiators.`,
            },
          ],
        },
      ],
      competitivePositioning: {
        currentPosition: `Premium sustainable option perceived as high-quality but not always linked to ${segmentName} business outcomes.`,
        positioningGaps: 'Messaging does not consistently quantify economics or incentive enablement.',
        positioningOpportunities: [
          {
            opportunity: 'Value-based messaging cadence',
            action: `Embed ${segmentName} persona stories across marketing, sales, and customer success motions.`,
            expectedImpact: `Align go-to-market with the ${formatCurrency(
              willingness,
            )} willingness-to-pay benchmark to defend premium pricing.`,
          },
        ],
      },
    };
  },

  fullAssessment(productData) {
    const segmentation = this.customerSegmentation(productData);
    const segmentList = Array.isArray(segmentation?.segments) ? segmentation.segments : [];

    const segments = segmentList.map((segment, index) => {
      const segmentId = slugify(segment?.id || segment?.name, 'segment', index);
      const profile = { ...segment, id: segmentId };

      const results = {};
      const contextBase = { segment: profile, results };

      results.step1_nbaAnalysis = this.nbaAnalysis(productData, contextBase);
      results.step1_nbaValue = this.nbaValueEstimation(productData, {
        ...contextBase,
        nbaAnalysis: results.step1_nbaAnalysis,
      });
      results.step2_valueDifferentiators = this.valueDifferentiators(productData, {
        ...contextBase,
        nbaAnalysis: results.step1_nbaAnalysis,
        nbaValue: results.step1_nbaValue,
      });
      results.step3_willingnessToPay = this.willingnessToPay(productData, {
        ...contextBase,
        nbaAnalysis: results.step1_nbaAnalysis,
        nbaValue: results.step1_nbaValue,
        valueDifferentiators: results.step2_valueDifferentiators,
      });
      results.step5_customerCommunication = this.customerCommunication(productData, {
        ...contextBase,
        nbaAnalysis: results.step1_nbaAnalysis,
        nbaValue: results.step1_nbaValue,
        valueDifferentiators: results.step2_valueDifferentiators,
        willingnessToPay: results.step3_willingnessToPay,
      });
      results.step6_companyGuidance = this.companyGuidance(productData, {
        ...contextBase,
        nbaAnalysis: results.step1_nbaAnalysis,
        nbaValue: results.step1_nbaValue,
        valueDifferentiators: results.step2_valueDifferentiators,
        willingnessToPay: results.step3_willingnessToPay,
        communication: results.step5_customerCommunication,
      });

      const differentiatorValue =
        results.step2_valueDifferentiators?.totalDifferentiatorValue ||
        sumDifferentiators(results.step2_valueDifferentiators?.differentiators);
      const nbaValue = results.step1_nbaValue?.nbaValue ?? 0;
      const totalWillingnessToPay =
        results.step3_willingnessToPay?.totalWillingnessToPay ?? nbaValue + differentiatorValue;
      const recommendedPrice =
        results.step3_willingnessToPay?.priceRecommendation?.recommendedPrice ||
        Math.round(totalWillingnessToPay);
      const confidenceLevel = numericConfidence(profile.pricingSensitivity);

      const executiveSummary = {
        keyFindings: [
          `${profile.name} face an NBA benchmark near ${formatCurrency(nbaValue)}, but quantified differentiators unlock ${formatCurrency(differentiatorValue)} in additional value.`,
          `${profile.name} can support premium pricing when incentive enablement and ROI calculators are front-loaded in the sales cycle.`,
          'Operational readiness and incentive execution remain the biggest levers to accelerate adoption.',
        ],
        recommendedPrice,
        confidenceLevel,
        nextSteps: [
          'Align commercial assets to segment-specific ROI narratives.',
          'Stand up an incentive enablement pod to streamline customer onboarding.',
          'Instrument post-sale value tracking to reinforce renewal pricing.',
        ],
        metrics: {
          nbaValue,
          differentiatorValue,
          totalWillingnessToPay,
        },
      };

      const step4_totalValue = {
        totalValueToCustomer: totalWillingnessToPay,
        valueWithoutNBA:
          'Total value calculated from NBA analysis and segment-specific differentiators.',
        calculationMethod:
          'NBA benchmark plus quantified economic differentiators adjusted for segment sensitivity.',
      };

      return {
        id: segmentId,
        name: profile.name,
        index,
        profile,
        ...results,
        step4_totalValue,
        executiveSummary,
      };
    });

    const crossSegmentSummary = buildCrossSegmentSummary(segments);

    return {
      productSummary: {
        title: productData.name,
        description: `A sustainable ${productData.name} positioned to deliver measurable ROI and emissions impact.`,
        sustainabilityHighlights: [
          'Reduced environmental footprint vs. incumbent alternatives',
          'Lower operating cost profile through energy and maintenance savings',
          'Extended lifetime backed by durable design and support',
        ],
      },
      segmentation,
      segments,
      crossSegmentSummary,
      _source: 'fallback',
      _timestamp: new Date().toISOString(),
    };
  },
};

export default fallbackGenerators;
