// Sustainable Product Value Assessment - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing form...');
    
    // Get form elements
    const form = document.querySelector('.assessment-form');
    const submitBtn = document.querySelector('.submit-btn');
    const resultsSection = document.getElementById('results');
    
    // Debug: Check if elements are found
    console.log('Form element:', form);
    console.log('Submit button:', submitBtn);
    console.log('Results section:', resultsSection);
    
    if (!form) {
        console.error('Form element not found!');
        return;
    }
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        console.log('Form submitted!');
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const files = formData.getAll('product-docs');
        
        // Extract text from uploaded files
        console.log('📄 Processing uploaded files...');
        const extractedTexts = await extractTextFromFiles(files);
        
        const productData = {
            name: formData.get('product-name'),
            description: formData.get('product-description'),
            nbaProducts: formData.get('nba-products'),
            additionalInfo: formData.get('additional-info'),
            files: files,
            extractedTexts: extractedTexts
        };
        
        // Validate required fields
        console.log('Product data:', productData);
        if (!productData.name || !productData.description) {
            console.log('Validation failed - missing required fields');
            showError('Please fill in all required fields (Product Name and Description)');
            return;
        }
        
        console.log('Validation passed, showing loading...');
        // Show loading state
        showLoading();
        
        // Call OpenAI API for assessment
        try {
            console.log('Calling OpenAI API for assessment...');
            const results = await openAIService.assessProduct(productData);
            console.log('AI assessment completed:', results);
            
            // Store results globally for chart access
            window.currentAssessmentResults = results;
            
            displayResults(results);
        } catch (error) {
            console.error('Assessment failed:', error);
            showError('Assessment failed. Please try again or check your API configuration.');
        }
    });
    
    // Show loading state
    function showLoading() {
        console.log('Showing loading state...');
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Starting Analysis...';
        submitBtn.disabled = true;
        
        // Create progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-indicator">
                <h4>📊 Assessment Progress</h4>
                    <div class="progress-steps">
                        <div class="progress-step" id="step-nba">
                            <span class="step-icon">🔍</span>
                            <span class="step-text">NBA Analysis</span>
                            <span class="step-status spinning-hourglass">⏳</span>
                        </div>
                        <div class="progress-step" id="step-value">
                            <span class="step-icon">💰</span>
                            <span class="step-text">Value Differentiators</span>
                            <span class="step-status spinning-hourglass">⏳</span>
                        </div>
                        <div class="progress-step" id="step-willingness">
                            <span class="step-icon">💵</span>
                            <span class="step-text">Willingness to Pay</span>
                            <span class="step-status spinning-hourglass">⏳</span>
                        </div>
                        <div class="progress-step" id="step-communication">
                            <span class="step-icon">💬</span>
                            <span class="step-text">Customer Communication</span>
                            <span class="step-status spinning-hourglass">⏳</span>
                        </div>
                        <div class="progress-step" id="step-guidance">
                            <span class="step-icon">🎯</span>
                            <span class="step-text">Company Guidance</span>
                            <span class="step-status spinning-hourglass">⏳</span>
                        </div>
                    </div>
            </div>
        `;
        
        // Insert progress indicator after the form
        const form = document.getElementById('product-assessment-form');
        console.log('🔍 Form element found:', !!form);
        console.log('🔍 Form parent node:', !!form?.parentNode);
        
        if (form && form.parentNode) {
            form.parentNode.insertBefore(progressContainer, form.nextSibling);
            console.log('✅ Progress indicator inserted after form');
        } else {
            // Fallback: insert at the end of the container
            const container = document.querySelector('.container');
            console.log('🔍 Container found:', !!container);
            
            if (container) {
                container.appendChild(progressContainer);
                console.log('✅ Progress indicator inserted in container');
            } else {
                // Last resort: append to body
                document.body.appendChild(progressContainer);
                console.log('✅ Progress indicator inserted in body');
            }
        }
        
        // Start the progress simulation
        simulateProgress();
    }
    
    // Update progress step
    function updateProgressStep(stepId, status) {
        const stepElement = document.getElementById(stepId);
        if (stepElement) {
            const statusElement = stepElement.querySelector('.step-status');
            if (statusElement) {
                // Remove spinning animation
                statusElement.classList.remove('spinning-hourglass');
                
                // Add completion styling and checkmark
                statusElement.textContent = '✅';
                statusElement.classList.add('completed-status');
                stepElement.classList.add('completed');
            }
        }
    }
    
    // Simulate progress with timed checkmarks
    function simulateProgress() {
        const steps = ['step-nba', 'step-value', 'step-willingness', 'step-communication', 'step-guidance'];
        let currentStep = 0;
        
        const progressInterval = setInterval(() => {
            if (currentStep < steps.length - 1) {
                // Mark current step as completed
                updateProgressStep(steps[currentStep], '✅');
                currentStep++;
            } else {
                // Clear the interval - let the last step complete naturally
                clearInterval(progressInterval);
            }
        }, 2000); // Every 2 seconds
        
        // Store interval ID so we can clear it when real completion happens
        window.progressInterval = progressInterval;
    }
    
    // Clean up progress indicator
    function cleanupProgress() {
        // Clear any running progress simulation
        if (window.progressInterval) {
            clearInterval(window.progressInterval);
            window.progressInterval = null;
        }
        
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.remove();
        }
    }
    
    // Show error message
    function showError(message) {
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span>${message}</span>
            </div>
        `;
        
        // Insert error message before form actions
        const formActions = document.querySelector('.form-actions');
        formActions.parentNode.insertBefore(errorDiv, formActions);
        
        // Reset button
        submitBtn.innerHTML = 'Assess Product Value';
        submitBtn.disabled = false;
    }
    
    // Note: Mock function removed - now using OpenAI API via openAIService
    
    // Display results
    function displayResults(results) {
        console.log('Displaying results...');
        console.log('📊 Results Source:', results._source || 'unknown');
        console.log('⏰ Results Timestamp:', results._timestamp || 'unknown');
        console.log('🔍 Company Guidance Structure:', results.step6_companyGuidance);
        console.log('🔍 Value Differentiators Structure:', results.step2_valueDifferentiators);
        
        // Validate value differentiators math
        if (results.step2_valueDifferentiators && results.step2_valueDifferentiators.differentiators) {
            const individualSum = results.step2_valueDifferentiators.differentiators.reduce((sum, diff) => sum + (diff.value || 0), 0);
            const displayedTotal = results.step2_valueDifferentiators.totalDifferentiatorValue || 0;
            console.log('🧮 Math Check - Individual values sum:', individualSum, 'Displayed total:', displayedTotal);
            if (Math.abs(individualSum - displayedTotal) > 1) {
                console.warn('⚠️ Math inconsistency detected! Individual sum:', individualSum, 'vs Total:', displayedTotal);
            }
        }
        
        // Reset button
        submitBtn.innerHTML = 'Assess Product Value';
        submitBtn.disabled = false;
        
        // Clean up progress indicator
        cleanupProgress();
        
        // Remove any error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create results HTML
        const dataSource = results._source || 'unknown';
        const isAI = dataSource === 'openai' || dataSource === 'openai_multi_call';
        const sourceIndicator = isAI ? 
            '<div class="data-source-indicator ai-source">🤖 AI-Generated Assessment</div>' : 
            '<div class="data-source-indicator fallback-source">⚠️ Fallback Data (API Failed)</div>';
        
        const resultsHTML = `
            ${sourceIndicator}
            
            <!-- Executive Summary -->
            <div class="executive-summary">
                <h2>📊 Executive Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <h3>${results.productSummary.title}</h3>
                        <p>${results.productSummary.description}</p>
                    </div>
                    <div class="summary-item">
                        <h4>🎯 Recommended Price</h4>
                        <div class="price-highlight">$${results.executiveSummary.recommendedPrice.toLocaleString()}</div>
                    </div>
                    <div class="summary-item">
                        <h4>📈 Confidence Level</h4>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${results.executiveSummary.confidenceLevel}%"></div>
                            <span class="confidence-text">${results.executiveSummary.confidenceLevel}%</span>
                        </div>
                    </div>
                </div>
                <div class="key-findings">
                    <h4>🔑 Key Findings</h4>
                    <ul>
                        ${(results.executiveSummary.keyFindings || []).map(finding => `<li>${finding}</li>`).join('')}
                    </ul>
                </div>
                
                <!-- Waterfall Chart -->
                <div class="waterfall-chart-container">
                    <h4>📊 Value Breakdown</h4>
                    <div class="chart-wrapper">
                        <div id="waterfall-chart"></div>
                    </div>
                </div>
            </div>

            <!-- Step 1: NBA Analysis -->
            <div class="analysis-step">
                <div class="step-header">
                    <h2>🔍 Step 1: Next Best Alternatives Analysis</h2>
                    <div class="step-number">1</div>
                </div>
                <div class="step-content">
                    <div class="methodology">
                        <h4>📋 Search Methodology</h4>
                        <p>${results.step1_nbaAnalysis.searchMethodology}</p>
                    </div>
                    <div class="alternatives-grid">
                        ${(results.step1_nbaAnalysis.identifiedAlternatives || []).map(nba => `
                            <div class="alternative-card">
                                <div class="alternative-header">
                                    <h4>${nba.name}</h4>
                                    <div class="alternative-price">$${nba.estimatedPrice.toLocaleString()}</div>
                                </div>
                                <div class="alternative-details">
                                    <p><strong>Why this alternative:</strong> ${nba.reasoning}</p>
                                    <p><strong>Key differences:</strong> ${nba.keyDifferences.join(', ')}</p>
                                    <p><strong>Market position:</strong> ${nba.marketShare}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="nba-summary">
                        <h4>📊 NBA Value Summary</h4>
                        <div class="nba-value">$${results.step1_nbaAnalysis.nbaValue.toLocaleString()}</div>
                        <p><strong>Market Positioning:</strong> ${results.step1_nbaAnalysis.marketPositioning}</p>
                    </div>
                </div>
            </div>

            <!-- Step 2: Value Differentiators -->
            <div class="analysis-step">
                <div class="step-header">
                    <h2>💎 Step 2: Value Differentiators Analysis</h2>
                    <div class="step-number">2</div>
                </div>
                <div class="step-content">
                    <div class="differentiators-grid">
                        ${(results.step2_valueDifferentiators.differentiators || []).map(diff => `
                            <div class="differentiator-card">
                                <div class="differentiator-header">
                                    <h4>${diff.name}</h4>
                                    <div class="differentiator-value">+$${diff.value.toLocaleString()}</div>
                                </div>
                                <div class="differentiator-details">
                                    <div class="calculation">
                                        <h5>🧮 Calculation</h5>
                                        ${typeof diff.calculation === 'object' ? `
                                            <div class="calculation-methodology">
                                                <strong>Methodology:</strong> ${diff.calculation.methodology || 'Not specified'}
                                            </div>
                                            <div class="calculation-substeps">
                                                <strong>Calculation Steps:</strong>
                                                <ul>
                                                    ${(diff.calculation.substeps || []).map(step => `
                                                        <li>
                                                            <strong>${step.step}:</strong> ${step.calculation}
                                                            ${step.assumptions ? `<br><em>Assumptions: ${step.assumptions}</em>` : ''}
                                                        </li>
                                                    `).join('')}
                                                </ul>
                                            </div>
                                            <div class="calculation-total">
                                                <strong>Total:</strong> ${diff.calculation.totalCalculation || 'Not calculated'}
                                            </div>
                                        ` : `<p>${diff.calculation}</p>`}
                                    </div>
                                    <div class="rationale">
                                        <h5>💡 Economic Rationale</h5>
                                        <p>${diff.economicRationale}</p>
                                    </div>
                                    <div class="evidence">
                                        <h5>📊 Supporting Evidence</h5>
                                        <p>${diff.evidence}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="total-differentiators">
                        <h4>📈 Total Value Differentiators</h4>
                        <div class="total-value">+$${results.step2_valueDifferentiators.totalDifferentiatorValue.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <!-- Step 3: Willingness to Pay -->
            <div class="analysis-step">
                <div class="step-header">
                    <h2>💰 Step 3: Customer Willingness to Pay</h2>
                    <div class="step-number">3</div>
                </div>
                <div class="step-content">
                    <div class="willingness-calculation">
                        <h4>🧮 Calculation Formula</h4>
                        <div class="formula">
                            <div class="formula-item">
                                <span class="formula-label">NBA Value</span>
                                <span class="formula-value">$${results.step3_willingnessToPay.nbaValue.toLocaleString()}</span>
                            </div>
                            <div class="formula-operator">+</div>
                            <div class="formula-item">
                                <span class="formula-label">Value Differentiators</span>
                                <span class="formula-value">$${results.step3_willingnessToPay.differentiatorValue.toLocaleString()}</span>
                            </div>
                            <div class="formula-operator">=</div>
                            <div class="formula-item result">
                                <span class="formula-label">Willingness to Pay</span>
                                <span class="formula-value">$${results.step3_willingnessToPay.totalWillingnessToPay.toLocaleString()}</span>
                            </div>
                        </div>
                        <p class="calculation-explanation">${results.step3_willingnessToPay.calculationBreakdown}</p>
                    </div>
                    <div class="customer-segments">
                        <h4>👥 Customer Segments</h4>
                        <div class="segments-grid">
                            ${(results.step3_willingnessToPay.customerSegments || []).map(segment => `
                                <div class="segment-card">
                                    <h5>${segment.segment}</h5>
                                    <div class="segment-wtp">$${segment.willingnessToPay.toLocaleString()}</div>
                                    <p>${segment.reasoning}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 4: Total Value (if no NBA) -->
            <div class="analysis-step">
                <div class="step-header">
                    <h2>🎯 Step 4: Total Value Assessment</h2>
                    <div class="step-number">4</div>
                </div>
                <div class="step-content">
                    <div class="total-value-card">
                        <h4>📊 Total Value to Customer</h4>
                        <div class="total-value-amount">$${results.step4_totalValue.totalValueToCustomer.toLocaleString()}</div>
                        <p><strong>Calculation Method:</strong> ${results.step4_totalValue.calculationMethod}</p>
                        <p><strong>Value Without NBA:</strong> ${results.step4_totalValue.valueWithoutNBA}</p>
                    </div>
                </div>
            </div>

            <!-- Step 5: Customer Communication -->
            <div class="analysis-step">
                <div class="step-header">
                    <h2>🗣️ Step 5: Customer Communication Strategy</h2>
                    <div class="step-number">5</div>
                </div>
                <div class="step-content">
                    <div class="communication-strategy">
                        <h4>📢 Communication Strategy</h4>
                        <p>${results.step5_customerCommunication.communicationStrategy}</p>
                    </div>
                    <div class="guidance-grid">
                        <div class="guidance-card">
                            <h5>💰 TCO Guidance</h5>
                            <p><strong>Message:</strong> ${results.step5_customerCommunication.tcoGuidance.message}</p>
                            <p><strong>Tools:</strong> ${results.step5_customerCommunication.tcoGuidance.tools.join(', ')}</p>
                            <p><strong>Objective:</strong> ${results.step5_customerCommunication.tcoGuidance.objectives}</p>
                        </div>
                        <div class="guidance-card">
                            <h5>🏛️ Incentive Guidance</h5>
                            <p><strong>Message:</strong> ${results.step5_customerCommunication.incentiveGuidance.message}</p>
                            <p><strong>Tools:</strong> ${results.step5_customerCommunication.incentiveGuidance.tools.join(', ')}</p>
                            <p><strong>Objective:</strong> ${results.step5_customerCommunication.incentiveGuidance.objectives}</p>
                        </div>
                        <div class="guidance-card">
                            <h5>⏰ Lifetime Guidance</h5>
                            <p><strong>Message:</strong> ${results.step5_customerCommunication.lifetimeGuidance.message}</p>
                            <p><strong>Tools:</strong> ${results.step5_customerCommunication.lifetimeGuidance.tools.join(', ')}</p>
                            <p><strong>Objective:</strong> ${results.step5_customerCommunication.lifetimeGuidance.objectives}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 6: Company Guidance -->
            <div class="analysis-step">
                <div class="step-header">
                    <h2>🏢 Step 6: Company Performance & Improvement</h2>
                    <div class="step-number">6</div>
                </div>
                <div class="step-content">
                    <div class="performance-gaps">
                        <h4>📉 Performance Gaps</h4>
                        <div class="gaps-grid">
                            ${results.step6_companyGuidance.performanceGaps ? 
                                results.step6_companyGuidance.performanceGaps.map(gap => `
                                    <div class="gap-card">
                                        <h5>${gap.area}</h5>
                                        <p><strong>Current Performance:</strong> ${gap.currentPerformance}</p>
                                        <p><strong>Recommendation:</strong> ${gap.recommendation}</p>
                                        <p><strong>Expected Impact:</strong> ${gap.impact}</p>
                                    </div>
                                `).join('') :
                                // New structure with valueDriverStrengths and valueDriverWeaknesses
                                (results.step6_companyGuidance.valueDriverStrengths || []).map(strength => `
                                    <div class="gap-card">
                                        <h5>✅ ${strength.driver}</h5>
                                        <p><strong>Current Strength:</strong> ${strength.currentStrength}</p>
                                        <p><strong>Level:</strong> ${strength.strengthLevel}</p>
                                        <p><strong>Evidence:</strong> ${strength.evidence}</p>
                                    </div>
                                `).join('') +
                                (results.step6_companyGuidance.valueDriverWeaknesses || []).map(weakness => `
                                    <div class="gap-card">
                                        <h5>⚠️ ${weakness.driver}</h5>
                                        <p><strong>Current Weakness:</strong> ${weakness.currentWeakness}</p>
                                        <p><strong>Level:</strong> ${weakness.weaknessLevel}</p>
                                        <p><strong>Root Cause:</strong> ${weakness.rootCause}</p>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                    ${results.step6_companyGuidance.underperformanceAreas ? `
                        <div class="underperformance-analysis">
                            <h4>⚠️ Underperformance Areas</h4>
                            <p>${results.step6_companyGuidance.underperformanceAreas}</p>
                        </div>
                    ` : ''}
                    ${results.step6_companyGuidance.improvementPlan ? `
                        <div class="improvement-plan">
                            <h4>📋 Improvement Plan</h4>
                            <p>${results.step6_companyGuidance.improvementPlan}</p>
                        </div>
                    ` : ''}
                    ${results.step6_companyGuidance.competitivePositioning ? `
                        <div class="competitive-positioning">
                            <h4>🎯 Competitive Positioning</h4>
                            <p><strong>Current Position:</strong> ${results.step6_companyGuidance.competitivePositioning.currentPosition}</p>
                            <p><strong>Positioning Gaps:</strong> ${results.step6_companyGuidance.competitivePositioning.positioningGaps}</p>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
                <h2>🚀 Next Steps</h2>
                <div class="steps-list">
                    ${(results.executiveSummary.nextSteps || []).map((step, index) => `
                        <div class="next-step-item">
                            <div class="step-number">${index + 1}</div>
                            <div class="step-content">${step}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Update results section
        resultsSection.querySelector('.results-content').innerHTML = resultsHTML;
        
        // Show results section with animation
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Add animation class
        setTimeout(() => {
            resultsSection.classList.add('show-results');
            // Initialize tooltips after results are displayed
            initializeTooltips();
            // Initialize waterfall chart animation
            initializeWaterfallChart();
        }, 100);
    }
    
    // Initialize tooltips for result cards
    function initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', function(e) {
                const tooltipText = this.getAttribute('data-tooltip');
                if (tooltipText) {
                    showTooltip(e, tooltipText);
                }
            });
            
            element.addEventListener('mouseleave', function() {
                hideTooltip();
            });
        });
    }
    
    // Show tooltip
    function showTooltip(event, text) {
        // Remove existing tooltip
        hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        // Show tooltip
        setTimeout(() => tooltip.classList.add('show'), 10);
    }
    
    // Hide tooltip
    function hideTooltip() {
        const existingTooltip = document.querySelector('.tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }
    
    // Initialize waterfall chart with Plotly.js
    function initializeWaterfallChart() {
        const chartDiv = document.getElementById('waterfall-chart');
        if (!chartDiv) return;
        
        // Get the results data from the current assessment
        const results = window.currentAssessmentResults;
        if (!results) return;
        
        // Prepare waterfall data structure
        const nbaValue = results.step1_nbaAnalysis.nbaValue;
        const differentiators = results.step2_valueDifferentiators.differentiators;
        
        // Calculate the correct total: NBA value + sum of all differentiators
        const differentiatorSum = differentiators.reduce((sum, diff) => sum + (diff.value || 0), 0);
        const calculatedTotal = nbaValue + differentiatorSum;
        
        // Create waterfall data
        const x = ['NBA Value'];
        const y = [nbaValue];
        const measure = ['absolute'];
        const text = [`$${nbaValue.toLocaleString()}`];
        const colors = ['#2563eb'];
        
        // Add each differentiator
        differentiators.forEach(diff => {
            x.push(diff.name);
            y.push(diff.value);
            measure.push('relative');
            text.push(`+$${diff.value.toLocaleString()}`);
            colors.push('#22c55e');
        });
        
        // Add final total - use calculated total to ensure accuracy
        x.push('Willingness to Pay');
        y.push(calculatedTotal);
        measure.push('total');
        text.push(`$${calculatedTotal.toLocaleString()}`);
        colors.push('#16a34a');
        
        // Create the waterfall chart
        const data = [{
            type: 'waterfall',
            x: x,
            y: y,
            measure: measure,
            text: text,
            textposition: 'outside',
            texttemplate: '<b>%{text}</b>',
            connector: {
                line: {
                    color: 'rgba(148, 163, 184, 0.5)',
                    width: 2
                }
            },
            marker: {
                color: colors,
                line: {
                    color: colors,
                    width: 2
                }
            },
            textfont: {
                size: 13,
                color: '#1e293b',
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
            }
        }];
        
        const layout = {
            title: {
                text: '',
                font: {
                    size: 18,
                    color: '#1e293b',
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
                }
            },
            xaxis: {
                title: '',
                showgrid: false,
                tickangle: -45,
                tickfont: {
                    size: 11,
                    color: '#374151',
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
                },
                titlefont: {
                    size: 14,
                    color: '#1e293b',
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
                },
                automargin: true
            },
            yaxis: {
                title: {
                    text: 'Value ($)',
                    font: {
                        size: 14,
                        color: '#1e293b',
                        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
                    }
                },
                showgrid: true,
                gridcolor: 'rgba(148, 163, 184, 0.2)',
                tickformat: '$,.0f',
                tickfont: {
                    size: 12,
                    color: '#374151',
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
                }
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: {
                l: 120,
                r: 80,
                t: 120,
                b: 200
            },
            showlegend: false,
            hovermode: 'closest',
            font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
                size: 12,
                color: '#1e293b'
            }
        };
        
        const config = {
            responsive: true,
            displayModeBar: false,
            staticPlot: false
        };
        
        // Create the plot
        Plotly.newPlot('waterfall-chart', data, layout, config);
    }
    
    // File upload handling
    const fileInput = document.getElementById('product-docs');
    fileInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            console.log(`${files.length} file(s) selected for upload`);
            // Show file preview
            showFilePreview(files);
        }
    });
});

// PDF text extraction function
async function extractTextFromFiles(files) {
    const extractedTexts = [];
    
    for (const file of files) {
        if (file.size === 0) continue;
        
        console.log(`📄 Processing file: ${file.name} (${file.type})`);
        
        try {
            if (file.type === 'application/pdf') {
                const text = await extractTextFromPDF(file);
                extractedTexts.push({
                    filename: file.name,
                    type: 'pdf',
                    text: text,
                    size: file.size
                });
            } else if (file.type === 'text/plain') {
                const text = await extractTextFromTextFile(file);
                extractedTexts.push({
                    filename: file.name,
                    type: 'text',
                    text: text,
                    size: file.size
                });
            } else {
                console.log(`⚠️ Unsupported file type: ${file.type}`);
                extractedTexts.push({
                    filename: file.name,
                    type: 'unsupported',
                    text: `[File type ${file.type} not supported for text extraction]`,
                    size: file.size
                });
            }
        } catch (error) {
            console.error(`❌ Error processing ${file.name}:`, error);
            extractedTexts.push({
                filename: file.name,
                type: 'error',
                text: `[Error processing file: ${error.message}]`,
                size: file.size
            });
        }
    }
    
    console.log(`✅ Extracted text from ${extractedTexts.length} files`);
    return extractedTexts;
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                
                // Limit text length to avoid token limits
                const maxLength = 3000;
                if (fullText.length > maxLength) {
                    fullText = fullText.substring(0, maxLength) + '...[truncated]';
                }
                
                resolve(fullText.trim());
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Extract text from text files
async function extractTextFromTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            let text = e.target.result;
            
            // Limit text length
            const maxLength = 3000;
            if (text.length > maxLength) {
                text = text.substring(0, maxLength) + '...[truncated]';
            }
            
            resolve(text.trim());
        };
        
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Show file preview
function showFilePreview(files) {
    const fileList = document.createElement('div');
    fileList.className = 'file-preview';
    fileList.innerHTML = '<h4>📄 Uploaded Files:</h4>';
    
    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
            <span class="file-type">${file.type}</span>
        `;
        fileList.appendChild(fileItem);
    });
    
    // Remove existing preview
    const existingPreview = document.querySelector('.file-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Add new preview after file input
    const fileInput = document.getElementById('product-docs');
    fileInput.parentNode.insertBefore(fileList, fileInput.nextSibling);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Testing functions - available in console
window.testOpenAI = async function(productName = "Tesla Solar Roof", description = "Integrated solar roof tiles that replace traditional roofing materials while generating electricity") {
    console.log('🧪 Testing OpenAI API with:', { productName, description });
    
    const testData = {
        name: productName,
        description: description,
        nbaProducts: "Traditional asphalt shingles, metal roofing, conventional solar panels",
        additionalInfo: "Premium sustainable roofing solution"
    };
    
    try {
        const result = await openAIService.assessProduct(testData);
        console.log('✅ Test completed successfully!');
        console.log('📊 Result source:', result._source);
        console.log('📊 Full result:', result);
        return result;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
};

window.testAPIKey = function() {
    console.log('🔑 API Key Status:', {
        hasKey: !!CONFIG.OPENAI_API_KEY,
        keyLength: CONFIG.OPENAI_API_KEY ? CONFIG.OPENAI_API_KEY.length : 0,
        keyStart: CONFIG.OPENAI_API_KEY ? CONFIG.OPENAI_API_KEY.substring(0, 10) + '...' : 'None',
        model: CONFIG.MODEL,
        maxTokens: CONFIG.MAX_TOKENS
    });
};

window.testSimpleAPI = async function() {
    console.log('🧪 Testing simple API call...');
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: 'Say "API test successful" and nothing else.'
                    }
                ],
                max_tokens: 10,
                temperature: 0
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return false;
        }
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        return true;
        
    } catch (error) {
        console.error('❌ API Test Failed:', error);
        return false;
    }
};

window.forceFallback = function() {
    console.log('🔄 Forcing fallback mode...');
    CONFIG.USE_FALLBACK = true;
    CONFIG.OPENAI_API_KEY = 'invalid-key-for-testing';
    console.log('✅ Fallback mode enabled. Next assessment will use mock data.');
};

window.diagnoseAPI = async function() {
    console.log('🔍 Running API diagnostics...');
    
    // Check config
    console.log('1. Config check:', {
        hasKey: !!CONFIG.OPENAI_API_KEY,
        keyLength: CONFIG.OPENAI_API_KEY?.length,
        model: CONFIG.MODEL,
        maxTokens: CONFIG.MAX_TOKENS,
        useFallback: CONFIG.USE_FALLBACK
    });
    
    // Test simple API call
    console.log('2. Testing simple API call...');
    const simpleTest = await window.testSimpleAPI();
    
    // Test with current service
    console.log('3. Testing with current service...');
    try {
        const testData = {
            name: "Test Product",
            description: "A simple test product",
            nbaProducts: "Test alternative",
            additionalInfo: "Test info"
        };
        
        const result = await openAIService.assessProduct(testData);
        console.log('✅ Service test successful:', result);
    } catch (error) {
        console.error('❌ Service test failed:', error);
    }
    
    return { simpleTest, config: CONFIG };
};
