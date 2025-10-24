import { tooltipManager } from './tooltipManager.js';
import { renderWaterfallChart } from './waterfallChart.js';

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
  }

  render(results) {
    if (!this.section || !this.container) {
      console.warn('Results container not found; cannot render assessment.');
      return;
    }

    this.container.innerHTML = [
      this.buildSourceBadge(results),
      this.buildExecutiveSummary(results),
      this.buildNBASection(results),
      this.buildDifferentiatorsSection(results),
      this.buildWillingnessSection(results),
      this.buildCustomerCommunicationSection(results),
      this.buildCompanyGuidanceSection(results),
      this.buildNextSteps(results),
    ].join('');

    this.section.style.display = 'block';
    this.section.scrollIntoView({ behavior: 'smooth' });
    window.requestAnimationFrame(() => this.section.classList.add('show-results'));

    tooltipManager.attach(this.container);
    renderWaterfallChart(results);
  }

  buildSourceBadge(results) {
    const source = results?._source ?? 'unknown';
    const isAi = source.startsWith('openai');
    const copy = isAi ? '🤖 AI-Generated Assessment' : '⚠️ Fallback Data (API Failed)';
    const className = isAi ? 'ai-source' : 'fallback-source';

    return `<div class="data-source-indicator ${className}">${copy}</div>`;
  }

  buildExecutiveSummary(results) {
    const summary = results.executiveSummary ?? {};
    const productSummary = results.productSummary ?? {};
    const recommendedPrice = summary.recommendedPrice ?? 0;
    const confidence = summary.confidenceLevel ?? 0;
    const keyFindings = summary.keyFindings ?? [];

    return `
      <div class="executive-summary">
        <h2>📊 Executive Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <h3>${productSummary.title ?? 'Product Summary'}</h3>
            <p>${productSummary.description ?? ''}</p>
          </div>
          <div class="summary-item">
            <h4>🎯 Recommended Price</h4>
            <div class="price-highlight">${currencyFormatter.format(recommendedPrice)}</div>
          </div>
          <div class="summary-item">
            <h4>📈 Confidence Level</h4>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${confidence}%"></div>
              <span class="confidence-text">${confidence}%</span>
            </div>
          </div>
        </div>
        <div class="key-findings">
          <h4>🔑 Key Findings</h4>
          <ul>${keyFindings.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
        <div class="waterfall-chart-container">
          <h4>📊 Value Breakdown</h4>
          <div class="chart-wrapper">
            <div id="waterfall-chart"></div>
          </div>
        </div>
      </div>
    `;
  }

  buildNBASection(results) {
    const analysis = results.step1_nbaAnalysis ?? {};
    const valuation = results.step1_nbaValue ?? {};
    const alternatives = analysis.identifiedAlternatives ?? [];

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>🔍 Step 1: Next Best Alternatives Analysis</h2>
          <div class="step-number">1</div>
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

  buildDifferentiatorsSection(results) {
    const data = results.step2_valueDifferentiators ?? {};
    const differentiators = data.differentiators ?? [];

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>💎 Step 2: Value Differentiators Analysis</h2>
          <div class="step-number">2</div>
        </div>
        <div class="step-content">
          <div class="differentiators-grid">
            ${differentiators.map(diff => this.renderDifferentiatorCard(diff)).join('')}
          </div>
          <div class="total-differentiators">
            <h4>📈 Total Value Differentiators</h4>
            <div class="total-value">${currencyFormatter.format(
              data.differentiators.reduce((acc, diff) => acc + (diff.value || 0), 0)
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

  buildWillingnessSection(results) {
    const nbaValue = results.step1_nbaValue ?? {};
    const valueDifferentiators = results.step2_valueDifferentiators ?? {};
    const data = results.step2_valueDifferentiators ?? {};
    const willingnessToPay = results.step3_willingnessToPay ?? {};

    const segments = willingnessToPay.customerSegments ?? [];

    const totalDifferentiatorValue = valueDifferentiators.differentiators.reduce((acc, diff) => acc + (diff.value || 0), 0)
    const totalWillingness = (nbaValue.nbaValue || 0) + totalDifferentiatorValue;

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>💰 Step 3: Customer Willingness to Pay</h2>
          <div class="step-number">3</div>
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
            <p>${data.calculationBreakdown ?? ''}</p>
          </div>
          <div class="segment-grid">
            ${segments
              .map(
                segment => `
                <div class="segment-card">
                  <h4>${segment.segment ?? 'Segment'}</h4>
                  <div class="segment-value">${currencyFormatter.format(
                    segment.willingnessToPay ?? 0,
                  )}</div>
                  <p>${segment.reasoning ?? ''}</p>
                </div>
              `,
              )
              .join('')}
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

  buildCustomerCommunicationSection(results) {
    const data = results.step5_customerCommunication ?? {};
    const sections = [
      { key: 'tcoGuidance', title: 'TCO Guidance' },
      { key: 'incentiveGuidance', title: 'Incentive Guidance' },
      { key: 'lifetimeGuidance', title: 'Lifetime Guidance' },
    ];

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>💬 Step 4: Customer Communication Strategy</h2>
          <div class="step-number">4</div>
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
        </div>
      </div>
    `;
  }

  renderGuidanceCard(title, guidance) {
    if (!guidance) {
      return '';
    }

    return `
      <div class="guidance-card">
        <h4>${title}</h4>
        <p><strong>Message:</strong> ${guidance.message ?? ''}</p>
        <p><strong>Objectives:</strong> ${guidance.objectives ?? ''}</p>
        <p><strong>Tools:</strong> ${(guidance.tools || []).join(', ')}</p>
        <div class="actionable-steps">
          <strong>Actionable Steps:</strong>
          <ul>
            ${(guidance.actionableSteps || [])
              .map(
                step => `
                  <li>
                    <strong>${step.step}:</strong> ${step.description}
                    ${step.implementation ? `<br><em>${step.implementation}</em>` : ''}
                  </li>
                `,
              )
              .join('')}
          </ul>
        </div>
      </div>
    `;
  }

  buildCompanyGuidanceSection(results) {
    const data = results.step6_companyGuidance ?? {};

    return `
      <div class="analysis-step">
        <div class="step-header">
          <h2>🎯 Step 5: Company Guidance</h2>
          <div class="step-number">5</div>
        </div>
        <div class="step-content">
          ${this.renderValueDriverColumns('Strengths', data.valueDriverStrengths)}
          ${this.renderValueDriverColumns('Weaknesses', data.valueDriverWeaknesses, true)}
          ${this.renderCompetitivePositioning(data.competitivePositioning)}
          ${data.underperformanceAreas ? this.renderTextBlock('⚠️ Underperformance Areas', data.underperformanceAreas) : ''}
          ${data.improvementPlan ? this.renderTextBlock('📋 Improvement Plan', data.improvementPlan) : ''}
        </div>
      </div>
    `;
  }

  renderValueDriverColumns(title, drivers = [], highlight = false) {
    if (!drivers || drivers.length === 0) {
      return '';
    }

    return `
      <div class="value-driver-section ${highlight ? 'value-driver-warning' : ''}">
        <h4>${title}</h4>
        <div class="value-driver-grid">
          ${drivers
            .map(
              driver => `
                <div class="value-driver-card">
                  <h5>${driver.driver ?? 'Driver'}</h5>
                  <p><strong>Status:</strong> ${highlight ? driver.currentWeakness : driver.currentStrength}</p>
                  <p><strong>Level:</strong> ${highlight ? driver.weaknessLevel : driver.strengthLevel}</p>
                  <p><strong>Evidence:</strong> ${driver.evidence ?? ''}</p>
                  <div class="opportunity-list">
                    <strong>${highlight ? 'Improvement Plan' : 'Enhancement Opportunities'}:</strong>
                    <ul>
                      ${(highlight ? driver.improvementPlan : driver.enhancementOpportunities || [])
                        .map(
                          item => `
                            <li>
                              <strong>${item.opportunity || item.improvement}:</strong> ${item.action}
                              ${item.expectedImpact ? `<br><em>${item.expectedImpact}</em>` : ''}
                            </li>
                          `,
                        )
                        .join('')}
                    </ul>
                  </div>
                </div>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  renderCompetitivePositioning(positioning) {
    if (!positioning) {
      return '';
    }

    return `
      <div class="competitive-positioning">
        <h4>🎯 Competitive Positioning</h4>
        <p><strong>Current Position:</strong> ${positioning.currentPosition ?? ''}</p>
        <p><strong>Positioning Gaps:</strong> ${positioning.positioningGaps ?? ''}</p>
        <div class="positioning-opportunities">
          <strong>Opportunities:</strong>
          <ul>
            ${(positioning.positioningOpportunities || [])
              .map(
                opp => `
                  <li>
                    <strong>${opp.opportunity}:</strong> ${opp.action}
                    ${opp.expectedImpact ? `<br><em>${opp.expectedImpact}</em>` : ''}
                  </li>
                `,
              )
              .join('')}
          </ul>
        </div>
      </div>
    `;
  }

  renderTextBlock(title, content) {
    return `
      <div class="text-block">
        <h4>${title}</h4>
        <p>${content}</p>
      </div>
    `;
  }

  buildNextSteps(results) {
    const steps = results.executiveSummary?.nextSteps ?? [];
    if (steps.length === 0) {
      return '';
    }

    return `
      <div class="next-steps">
        <h2>🚀 Next Steps</h2>
        <div class="steps-list">
          ${steps
            .map(
              (step, index) => `
                <div class="next-step-item">
                  <div class="step-number">${index + 1}</div>
                  <div class="step-content">${step}</div>
                </div>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  }
}

export default ResultsRenderer;
