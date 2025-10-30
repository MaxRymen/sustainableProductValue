import { tooltipManager } from './tooltipManager.js';
import { renderWaterfallChart } from './waterfallChart.js';
import { renderSegmentPriceChart } from './segmentPriceChart.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export class ResultsRenderer {
  constructor({ section }) {
    this.section = section;
    this.container = section?.querySelector('.results-content') ?? section;
    this.hasRendered = false;
  }

  reset() {
    if (!this.section) {
      return;
    }

    this.section.classList.remove('show-results');
    this.section.style.display = 'none';
    if (this.container) {
      this.container.innerHTML = '';
    }

    this.hasRendered = false;
  }

  render(results, { isFinal = false } = {}) {
    if (!this.section || !this.container) {
      console.warn('Results container not found; cannot render assessment.');
      return;
    }

    const segments = Array.isArray(results?.segments) ? results.segments : [];

    if (!segments.length) {
      this.container.innerHTML = [
        this.buildSourceBadge(results),
        '<div class="empty-state">No segment data was generated for this assessment.</div>',
      ].join('');

      this.section.style.display = 'block';
      this.section.scrollIntoView({ behavior: 'smooth' });
      window.requestAnimationFrame(() => this.section.classList.add('show-results'));
      return;
    }

    this.container.innerHTML = [
      this.buildSourceBadge(results),
      this.buildSegmentationSection(results),
      this.buildCrossSegmentSummary(results),
      this.buildSegmentTabs(segments),
    ].join('');

    this.section.style.display = 'block';

    if (!this.hasRendered) {
      this.section.scrollIntoView({ behavior: 'smooth' });
      window.requestAnimationFrame(() => this.section.classList.add('show-results'));
      this.hasRendered = true;
    }

    this.initialiseTabs();
    this.renderCharts(results, segments);
    tooltipManager.attach(this.container);
  }

  buildSourceBadge(results) {
    const source = results?._source ?? 'unknown';
    const isAi = source.startsWith('openai');
    const copy = isAi ? '🤖 AI-Generated Assessment' : '⚠️ Fallback Data (API Failed)';
    const className = isAi ? 'ai-source' : 'fallback-source';

    return `<div class="data-source-indicator ${className}">${copy}</div>`;
  }

  buildSegmentationSection(results) {
    const segmentation = results.segmentation ?? {};
    const productSummary = results.productSummary ?? {};
    const segments = Array.isArray(segmentation.segments) ? segmentation.segments : [];
    const observations = Array.isArray(segmentation.keyObservations)
      ? segmentation.keyObservations
      : [];

    return `
      <div class="analysis-step segmentation-step">
        <div class="step-header">
          <h2>👥 Step 1: Customer Segmentation</h2>
          <div class="step-number">1</div>
        </div>
        <div class="step-content">
          ${
            productSummary.title || productSummary.description
              ? `<div class="product-overview">
                  <h3>${productSummary.title ?? 'Product Summary'}</h3>
                  <p>${productSummary.description ?? ''}</p>
                </div>`
              : ''
          }
          ${
            segmentation.segmentationApproach
              ? `<p class="segmentation-approach">${segmentation.segmentationApproach}</p>`
              : ''
          }
          ${
            observations.length
              ? `<ul class="segmentation-insights">${observations
                  .map(item => `<li>${item}</li>`)
                  .join('')}</ul>`
              : ''
          }
          <div class="segment-summary-grid">
            ${segments.map(segment => this.renderSegmentSummaryCard(segment)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderSegmentSummaryCard(segment) {
    const needs = Array.isArray(segment?.primaryNeeds) ? segment.primaryNeeds : [];
    const buyingCriteria = Array.isArray(segment?.buyingCriteria) ? segment.buyingCriteria : [];
    const valueDrivers = Array.isArray(segment?.valueDriversFocus)
      ? segment.valueDriversFocus
      : [];

    return `
      <div class="segment-summary-card">
        <h3>${segment?.name ?? 'Segment'}</h3>
        <p class="segment-description">${segment?.description ?? 'Segment description unavailable.'}</p>
        <div class="segment-meta">
          <span><strong>Sensitivity:</strong> ${segment?.pricingSensitivity ?? 'n/a'}</span>
          <span><strong>Share:</strong> ${segment?.representativeShare ?? 'n/a'}</span>
        </div>
        ${needs.length ? this.renderDefinitionList('Primary Needs', needs) : ''}
        ${buyingCriteria.length ? this.renderDefinitionList('Buying Criteria', buyingCriteria) : ''}
        ${valueDrivers.length ? this.renderDefinitionList('Value Drivers Focus', valueDrivers) : ''}
      </div>
    `;
  }

  renderDefinitionList(label, items) {
    return `
      <div class="segment-list">
        <strong>${label}:</strong>
        <ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>
    `;
  }

  buildCrossSegmentSummary(results) {
    const summary = results.crossSegmentSummary ?? {};
    const statsMarkup = summary.summaryStats ? this.buildCrossSegmentStats(summary.summaryStats) : '';

    return `
      <div class="analysis-step cross-segment-step">
        <div class="step-header">
          <h2>📈 Cross-Segment Summary</h2>
        </div>
        <div class="step-content">
          <div class="chart-wrapper">
            <div id="segment-price-chart"></div>
          </div>
          ${statsMarkup}
        </div>
      </div>
    `;
  }

  buildCrossSegmentStats(stats) {
    const parts = [];

    if (stats.highest) {
      parts.push(
        `<div class="stats-item"><strong>Top Segment:</strong> ${stats.highest.name} (${currencyFormatter.format(
          stats.highest.recommendedPrice ?? 0,
        )})</div>`,
      );
    }

    if (stats.lowest) {
      parts.push(
        `<div class="stats-item"><strong>Lowest Segment:</strong> ${stats.lowest.name} (${currencyFormatter.format(
          stats.lowest.recommendedPrice ?? 0,
        )})</div>`,
      );
    }

    parts.push(
      `<div class="stats-item"><strong>Price Spread:</strong> ${currencyFormatter.format(
        stats.spread ?? 0,
      )}</div>`,
    );

    parts.push(
      `<div class="stats-item"><strong>Average Recommended Price:</strong> ${currencyFormatter.format(
        stats.averageRecommendedPrice ?? 0,
      )}</div>`,
    );

    return `<div class="summary-stats">${parts.join('')}</div>`;
  }

  buildSegmentTabs(segments) {
    return `
      <div class="segment-tabs">
        <div class="tab-list">
          ${segments
            .map(
              (segment, index) => `
                <button
                  class="segment-tab ${index === 0 ? 'active' : ''}"
                  data-target="#segment-panel-${segment.id}"
                  type="button"
                >
                  ${segment.name ?? `Segment ${index + 1}`}
                </button>
              `,
            )
            .join('')}
        </div>
        <div class="tab-panels">
          ${segments
            .map(
              (segment, index) => `
                <div class="segment-panel ${index === 0 ? 'active' : ''}" id="segment-panel-${segment.id}">
                  ${this.buildSegmentContent(segment, index)}
                </div>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  buildSegmentContent(segment, index) {
    return [
      this.buildSegmentExecutiveSummary(segment),
      this.buildSegmentNBASection(segment),
      this.buildSegmentDifferentiatorsSection(segment),
      this.buildSegmentWillingnessSection(segment),
      this.buildSegmentCommunicationSection(segment),
      this.buildSegmentGuidanceSection(segment),
    ].join('');
  }

  buildSegmentExecutiveSummary(segment) {
    const summary = segment.executiveSummary ?? {};
    const recommendedPrice = currencyFormatter.format(summary.recommendedPrice ?? 0);
    const confidence = summary.confidenceLevel ?? 0;
    const keyFindings = Array.isArray(summary.keyFindings) ? summary.keyFindings : [];
    const nextSteps = Array.isArray(summary.nextSteps) ? summary.nextSteps : [];

    return `
      <div class="executive-summary">
        <h2>📊 Executive Summary — ${segment.name}</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <h4>🎯 Recommended Price</h4>
            <div class="price-highlight">${recommendedPrice}</div>
          </div>
          <div class="summary-item">
            <h4>📈 Confidence Level</h4>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${confidence}%"></div>
              <span class="confidence-text">${confidence}%</span>
            </div>
          </div>
          <div class="summary-item">
            <h4>⚙️ Segment Metrics</h4>
            <ul class="metric-list">
              <li><strong>NBA Value:</strong> ${currencyFormatter.format(
                summary.metrics?.nbaValue ?? 0,
              )}</li>
              <li><strong>Differentiator Value:</strong> ${currencyFormatter.format(
                summary.metrics?.differentiatorValue ?? 0,
              )}</li>
              <li><strong>Total Willingness to Pay:</strong> ${currencyFormatter.format(
                summary.metrics?.totalWillingnessToPay ?? 0,
              )}</li>
            </ul>
          </div>
        </div>
        <div class="key-findings">
          <h4>🔑 Key Findings</h4>
          <ul>${keyFindings.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
        ${
          nextSteps.length
            ? `<div class="next-steps"><h4>🛠️ Recommended Actions</h4><ul>${nextSteps
                .map(step => `<li>${step}</li>`)
                .join('')}</ul></div>`
            : ''
        }
      </div>
    `;
  }

  buildSegmentNBASection(segment) {
    const analysis = segment.step1_nbaAnalysis ?? {};
    const valuation = segment.step1_nbaValue ?? {};
    const alternatives = Array.isArray(analysis.identifiedAlternatives)
      ? analysis.identifiedAlternatives
      : [];

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>🔍 Step 2: Next Best Alternatives — ${segment.name}</h2>
          <div class="step-number">2</div>
        </div>
        <div class="step-content">
          <div class="methodology">
            <h4>📋 Search Methodology</h4>
            <p>${analysis.searchMethodology ?? 'Not provided'}</p>
          </div>
          <div class="alternatives-grid">
            ${alternatives
              .map(
                alt => `
                <div class="alternative-card">
                  <div class="alternative-header">
                    <h4>${alt.name ?? 'Alternative'}</h4>
                    <div class="alternative-price">${currencyFormatter.format(
                      alt.estimatedPrice ?? 0,
                    )}</div>
                  </div>
                  <div class="alternative-details">
                    <p><strong>Why this alternative:</strong> ${alt.reasoning ?? 'N/A'}</p>
                    <p><strong>Key differences:</strong> ${(alt.keyDifferences || []).join(', ')}</p>
                    <p><strong>Market position:</strong> ${alt.marketShare ?? 'N/A'}</p>
                  </div>
                </div>
              `,
              )
              .join('')}
          </div>
          <div class="nba-summary">
            <h4>📊 NBA Value Summary</h4>
            <div class="nba-value">${currencyFormatter.format(valuation.nbaValue ?? 0)}</div>
            ${
              valuation.valuationMethodology
                ? `<p><strong>Methodology:</strong> ${valuation.valuationMethodology}</p>`
                : ''
            }
            ${
              valuation.justification
                ? `<p><strong>Justification:</strong> ${valuation.justification}</p>`
                : ''
            }
            ${
              valuation.assumptions?.length
                ? `<p><strong>Assumptions:</strong> ${valuation.assumptions.join(', ')}</p>`
                : ''
            }
            <p><strong>Market Positioning:</strong> ${analysis.marketPositioning ?? 'N/A'}</p>
          </div>
        </div>
      </div>
    `;
  }

  buildSegmentDifferentiatorsSection(segment) {
    const data = segment.step2_valueDifferentiators ?? {};
    const differentiators = Array.isArray(data.differentiators) ? data.differentiators : [];

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>💎 Step 3: Value Differentiators — ${segment.name}</h2>
          <div class="step-number">3</div>
        </div>
        <div class="step-content">
          <div class="differentiators-grid">
            ${differentiators.map(diff => this.renderDifferentiatorCard(diff)).join('')}
          </div>
          <div class="total-differentiators">
            <h4>📈 Total Value Differentiators</h4>
            <div class="total-value">${currencyFormatter.format(
              differentiators.reduce((acc, diff) => acc + (diff.value || 0), 0),
            )}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderDifferentiatorCard(diff) {
    const calc = diff.calculation ?? {};
    const substeps = calc.substeps ?? [];
    return `
      <div class="differentiator-card">
        <div class="differentiator-header">
          <h4>${diff.name ?? 'Differentiator'}</h4>
          <div class="differentiator-value">+${currencyFormatter.format(diff.value ?? 0)}</div>
        </div>
        <div class="differentiator-details">
          <div class="calculation">
            <h5>🧮 Calculation</h5>
            <div class="calculation-methodology">
              <strong>Methodology:</strong> ${calc.methodology ?? 'Not specified'}
            </div>
            <div class="calculation-substeps">
              <strong>Calculation Steps:</strong>
              <ul>
                ${substeps
                  .map(
                    step => `
                      <li>
                        <strong>${step.step}:</strong> ${step.calculation}
                        ${step.assumptions ? `<br><em>Assumptions: ${step.assumptions}</em>` : ''}
                      </li>
                    `,
                  )
                  .join('')}
              </ul>
            </div>
            <div class="calculation-total">
              <strong>Total:</strong> ${calc.totalCalculation ?? 'Not calculated'}
            </div>
          </div>
          <div class="rationale">
            <h5>💡 Economic Rationale</h5>
            <p>${diff.economicRationale ?? 'Not provided'}</p>
          </div>
          <div class="evidence">
            <h5>📊 Supporting Evidence</h5>
            <p>${diff.evidence ?? 'Not provided'}</p>
          </div>
        </div>
      </div>
    `;
  }

  buildSegmentWillingnessSection(segment) {
    const willingnessToPay = segment.step3_willingnessToPay ?? {};
    const nbaValue = segment.step1_nbaValue ?? {};
    const valueDifferentiators = segment.step2_valueDifferentiators ?? {};
    const priceRecommendation = willingnessToPay.priceRecommendation ?? {};
    const sensitivityAnalysis = Array.isArray(willingnessToPay.sensitivityAnalysis)
      ? willingnessToPay.sensitivityAnalysis
      : [];

    const totalDifferentiatorValue = (valueDifferentiators.differentiators || []).reduce(
      (acc, diff) => acc + (diff.value || 0),
      0,
    );
    const totalWillingness = willingnessToPay.totalWillingnessToPay ??
      (nbaValue.nbaValue || 0) + totalDifferentiatorValue;

    const chartId = `waterfall-chart-${segment.id}`;

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>💰 Step 4: Willingness to Pay — ${segment.name}</h2>
          <div class="step-number">4</div>
        </div>
        <div class="step-content">
          <div class="willingness-calculation">
            <h4>🧮 Calculation Formula</h4>
            <div class="formula">
              ${this.renderFormulaItem('NBA Value', nbaValue.nbaValue)}
              <div class="formula-operator">+</div>
              ${this.renderFormulaItem('Value Differentiators', totalDifferentiatorValue)}
              <div class="formula-operator">=</div>
              ${this.renderFormulaItem('Total Willingness to Pay', totalWillingness, true)}
            </div>
            <p>${willingnessToPay.calculation ?? ''}</p>
          </div>
          <div class="pricing-recommendation">
            <h4>📌 Pricing Guidance</h4>
            <ul>
              <li><strong>Recommended Price:</strong> ${currencyFormatter.format(
                priceRecommendation.recommendedPrice ?? 0,
              )}</li>
              <li><strong>Floor Price:</strong> ${currencyFormatter.format(
                priceRecommendation.floorPrice ?? 0,
              )}</li>
              <li><strong>Stretch Price:</strong> ${currencyFormatter.format(
                priceRecommendation.stretchPrice ?? 0,
              )}</li>
              <li><strong>Confidence:</strong> ${priceRecommendation.confidence ?? 'Not specified'}</li>
            </ul>
          </div>
          ${
            sensitivityAnalysis.length
              ? `<div class="sensitivity-analysis">
                  <h4>⚖️ Sensitivity Drivers</h4>
                  <ul>${sensitivityAnalysis
                    .map(item => `<li><strong>${item.factor}:</strong> ${item.impact}</li>`)
                    .join('')}</ul>
                </div>`
              : ''
          }
          <div class="waterfall-chart-container">
            <h4>📊 Value Breakdown</h4>
            <div class="chart-wrapper">
              <div id="${chartId}" class="waterfall-chart"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderFormulaItem(label, value, highlight = false) {
    return `
      <div class="formula-item ${highlight ? 'formula-highlight' : ''}">
        <span class="formula-label">${label}</span>
        <span class="formula-value">${currencyFormatter.format(value ?? 0)}</span>
      </div>
    `;
  }

  buildSegmentCommunicationSection(segment) {
    const data = segment.step5_customerCommunication ?? {};
    const sections = [
      { key: 'tcoGuidance', title: 'TCO Guidance' },
      { key: 'incentiveGuidance', title: 'Incentive Guidance' },
      { key: 'lifetimeGuidance', title: 'Lifetime Guidance' },
    ];
    const themes = Array.isArray(data.storytellingThemes) ? data.storytellingThemes : [];

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>💬 Step 5: Customer Communication — ${segment.name}</h2>
          <div class="step-number">5</div>
        </div>
        <div class="step-content">
          <div class="communication-strategy">
            <h4>Strategy Overview</h4>
            <p>${data.communicationStrategy ?? 'Focus on articulating economic value and ROI.'}</p>
          </div>
          <div class="communication-grid">
            ${sections
              .map(section => this.renderGuidanceCard(section.title, data[section.key]))
              .join('')}
          </div>
          ${
            themes.length
              ? `<div class="storytelling-themes">
                  <h4>Storytelling Themes</h4>
                  <ul>${themes.map(theme => `<li>${theme}</li>`).join('')}</ul>
                </div>`
              : ''
          }
        </div>
      </div>
    `;
  }

  renderGuidanceCard(title, guidance) {
    if (!guidance) {
      return '';
    }

    const tools = Array.isArray(guidance.tools) ? guidance.tools : [];
    const steps = Array.isArray(guidance.actionableSteps) ? guidance.actionableSteps : [];

    return `
      <div class="guidance-card">
        <h4>${title}</h4>
        <p><strong>Message:</strong> ${guidance.message ?? ''}</p>
        <p><strong>Objectives:</strong> ${guidance.objectives ?? ''}</p>
        ${tools.length ? `<p><strong>Tools:</strong> ${tools.join(', ')}</p>` : ''}
        ${
          steps.length
            ? `<div class="actionable-steps">
                <strong>Actionable Steps:</strong>
                <ul>${steps
                  .map(
                    step => `
                      <li>
                        <strong>${step.step ?? 'Step'}:</strong> ${step.description ?? ''}
                        ${step.implementation ? `<br><em>${step.implementation}</em>` : ''}
                      </li>
                    `,
                  )
                  .join('')}</ul>
              </div>`
            : ''
        }
      </div>
    `;
  }

  buildSegmentGuidanceSection(segment) {
    const data = segment.step6_companyGuidance ?? {};
    const strengths = Array.isArray(data.valueDriverStrengths) ? data.valueDriverStrengths : [];
    const weaknesses = Array.isArray(data.valueDriverWeaknesses) ? data.valueDriverWeaknesses : [];
    const opportunities = Array.isArray(data.competitivePositioning?.positioningOpportunities)
      ? data.competitivePositioning.positioningOpportunities
      : [];

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>🎯 Step 6: Company Enablement — ${segment.name}</h2>
          <div class="step-number">6</div>
        </div>
        <div class="step-content">
          <div class="guidance-columns">
            ${
              strengths.length
                ? `<div class="guidance-column">
                    <h4>Strengths</h4>
                    ${strengths.map(item => this.renderCapabilityBlock(item, false)).join('')}
                  </div>`
                : ''
            }
            ${
              weaknesses.length
                ? `<div class="guidance-column">
                    <h4>Weaknesses</h4>
                    ${weaknesses.map(item => this.renderCapabilityBlock(item, true)).join('')}
                  </div>`
                : ''
            }
          </div>
          <div class="competitive-positioning">
            <h4>Competitive Positioning</h4>
            <p><strong>Current Position:</strong> ${
              data.competitivePositioning?.currentPosition ?? 'Not provided'
            }</p>
            <p><strong>Positioning Gaps:</strong> ${
              data.competitivePositioning?.positioningGaps ?? 'Not provided'
            }</p>
            ${
              opportunities.length
                ? `<ul class="opportunity-list">${opportunities
                    .map(
                      item => `
                        <li>
                          <strong>${item.opportunity ?? 'Opportunity'}:</strong> ${item.action ?? ''}
                          ${item.expectedImpact ? `<br><em>${item.expectedImpact}</em>` : ''}
                        </li>
                      `,
                    )
                    .join('')}</ul>`
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  renderCapabilityBlock(item, isWeakness = false) {
    const enhancements = Array.isArray(isWeakness ? item.improvementPlan : item.enhancementOpportunities)
      ? isWeakness
        ? item.improvementPlan
        : item.enhancementOpportunities
      : [];

    return `
      <div class="capability-block ${isWeakness ? 'capability-warning' : ''}">
        <h5>${item.driver ?? item.improvement ?? 'Capability'}</h5>
        <p>${item.currentStrength ?? item.currentWeakness ?? ''}</p>
        <p><strong>Level:</strong> ${
          isWeakness ? item.weaknessLevel ?? 'n/a' : item.strengthLevel ?? 'n/a'
        }</p>
        ${
          item.evidence
            ? `<p><strong>Evidence:</strong> ${item.evidence}</p>`
            : ''
        }
        ${
          enhancements.length
            ? `<div class="opportunity-list">
                <strong>${isWeakness ? 'Improvement Plan' : 'Enhancement Opportunities'}:</strong>
                <ul>${enhancements
                  .map(
                    enhancement => `
                      <li>
                        <strong>${enhancement.opportunity ?? enhancement.improvement ?? 'Action'}:</strong>
                        ${enhancement.action ?? ''}
                        ${enhancement.expectedImpact ? `<br><em>${enhancement.expectedImpact}</em>` : ''}
                      </li>
                    `,
                  )
                  .join('')}</ul>
              </div>`
            : ''
        }
      </div>
    `;
  }

  initialiseTabs() {
    const tabs = Array.from(this.container.querySelectorAll('.segment-tab'));
    const panels = Array.from(this.container.querySelectorAll('.segment-panel'));

    if (!tabs.length || !panels.length) {
      return;
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetSelector = tab.getAttribute('data-target');

        tabs.forEach(btn => btn.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));

        tab.classList.add('active');
        const targetPanel = this.container.querySelector(targetSelector);
        if (targetPanel) {
          targetPanel.classList.add('active');
          const plot = targetPanel.querySelector('.waterfall-chart');
          if (plot && window.Plotly?.Plots?.resize) {
            window.Plotly.Plots.resize(plot);
          }
        }
      });
    });
  }

  renderCharts(results, segments) {
    renderSegmentPriceChart({
      summary: results.crossSegmentSummary,
      containerId: 'segment-price-chart',
    });

    segments.forEach(segment => {
      renderWaterfallChart({ segment, containerId: `waterfall-chart-${segment.id}` });
    });
  }
}

export default ResultsRenderer;
