class UserProfile {
    constructor() {
        this.education = '';
        this.subjects = [];
        this.careerInterest = '';
        this.performance = 0;
        this.experience = '';
        this.commitment = '';
        this.priority = '';
        this.workStyle = '';
        this.psychology = {};
        this.testimony = '';
    }

    static fromFormData() {
        const profile = new UserProfile();
        profile.education = document.getElementById('educationLevel').value;
        profile.subjects = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        profile.careerInterest = document.querySelector('input[name="careerInterest"]:checked')?.value || '';
        profile.performance = parseInt(document.getElementById('academicPerformance').value);
        profile.experience = document.getElementById('experienceLevel').value;
        profile.commitment = document.querySelector('input[name="learningCommitment"]:checked')?.value || '';
        profile.priority = document.querySelector('input[name="careerPriority"]:checked')?.value || '';
        profile.workStyle = document.querySelector('input[name="workStyle"]:checked')?.value || '';
        profile.testimony = document.getElementById('userTestimony')?.value || '';
        profile.psychology = {
            stressHandling: document.querySelector('input[name="stressHandling"]:checked')?.value || '',
            motivation: document.querySelector('input[name="motivation"]:checked')?.value || '',
            workPreference: document.querySelector('input[name="workPreference"]:checked')?.value || '',
            challengeType: document.querySelector('input[name="challengeType"]:checked')?.value || '',
            decisionMaking: document.querySelector('input[name="decisionMaking"]:checked')?.value || ''
        };
        return profile;
    }

    isValid() {
        return this.education && this.careerInterest && this.subjects.length > 0;
    }

    toJSON() {
        return {
            education: this.education,
            subjects: this.subjects,
            careerInterest: this.careerInterest,
            performance: this.performance,
            experience: this.experience,
            commitment: this.commitment,
            priority: this.priority,
            workStyle: this.workStyle,
            psychology: this.psychology,
            testimony: this.testimony
        };
    }
}

class CareerMatcher {
    static async getRecommendations(userProfile) {
        try {
            const response = await fetch('/api/career-recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: userProfile.toJSON() })
            });
            
            if (!response.ok) {
                throw new Error(`AI service error: HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }
            
            if (!data.careers || data.careers.length === 0) {
                throw new Error('AI failed to generate career recommendations');
            }
            
            return data.careers;
            
        } catch (error) {
            console.error('AI Career Generation Error:', error);
            throw new Error(`Fully AI-driven system error: ${error.message}`);
        }
    }
    
    static async getCareerDetails(careerTitle, sectionType, userProfile) {
        try {
            const response = await fetch('/api/career-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    career_title: careerTitle,
                    section_type: sectionType,
                    profile: userProfile
                })
            });
            
            if (!response.ok) {
                throw new Error(`AI service error: HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'AI content generation failed');
            }
            
            if (!data.content) {
                throw new Error('AI failed to generate content - no fallback available');
            }
            
            return data.content;
            
        } catch (error) {
            console.error('AI Content Generation Error:', error);
            throw new Error(`Fully AI-driven content generation failed: ${error.message}`);
        }
    }
    
    static renderTop3(careers) {
        const careerCards = document.getElementById('careerCards');
        
        if (!careers || careers.length === 0) {
            careerCards.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc3545; font-size: 18px;"><i class="bx bx-error"></i> Fully AI-driven system failed to generate career recommendations. Please try again.</div>';
            return;
        }
        
        window.currentCareers = careers;
        
        careerCards.innerHTML = `
            <div class="domain-header">
                <h3><i class='bx bx-target-lock' style='color: #e74c3c; font-weight: 700;'></i> Recommended Job Domains</h3>
                <p class="domain-subtitle">Based on your career interests and profile</p>
            </div>
            
            <div class="job-domains-accordion">
                ${careers.map((career, index) => `
                    <div class="domain-accordion-item">
                        <div class="domain-accordion-header" onclick="toggleDomainAccordion(${index})">
                            <div class="domain-info">
                                <div class="domain-icon">${career.icon}</div>
                                <div class="domain-details">
                                    <h4>${career.title}</h4>
                                    <div class="domain-match">${career.match}% Match • ${career.salary} • ${career.growth}</div>
                                </div>
                            </div>
                            <span class="accordion-arrow" id="arrow-${index}"><i class='bx bx-chevron-down'></i></span>
                        </div>
                        
                        <div class="domain-accordion-content" id="content-${index}">
                            <div class="domain-description">
                                <p>${career.summary}</p>
                            </div>
                            
                            <div class="domain-jobs-list">
                                <h5><i class='bx bx-briefcase' style='color: #3498db; font-weight: 600;'></i> Available Job Roles</h5>
                                <div class="jobs-grid">
                                    ${generateJobRoles(career, index)}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function goToRecommendedJobs(jobTitle) {
    // Scroll back to job domains section
    const careerCards = document.getElementById('careerCards');
    if (careerCards) {
        careerCards.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleDomainAccordion(index) {
    const content = document.getElementById(`content-${index}`);
    const arrow = document.getElementById(`arrow-${index}`);
    
    // Close all other accordions
    document.querySelectorAll('.domain-accordion-content').forEach((item, i) => {
        if (i !== index) {
            item.classList.remove('active');
            const otherArrow = document.getElementById(`arrow-${i}`);
            if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
        }
    });
    
    // Toggle current accordion
    content.classList.toggle('active');
    arrow.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
}

function generateJobRoles(career, domainIndex) {
    const jobs = career.jobs || [];
    
    if (jobs.length === 0) {
        return '<div class="no-jobs-message">Fully AI-driven system failed to generate job roles for this domain</div>';
    }
    
    return jobs.map((job, jobIndex) => `
        <div class="job-card" onclick="selectJobFromDomain('${job.title}', ${domainIndex}, ${jobIndex})">
            <h6>${job.title}</h6>
            <div class="job-meta">
                <span class="job-salary">${job.salary}</span>
                <span class="job-growth">${job.growth}</span>
            </div>
            <p class="job-desc">${job.description}</p>
        </div>
    `).join('');
}

function selectJobFromDomain(jobTitle, domainIndex, jobIndex) {
    const career = window.currentCareers[domainIndex];
    if (!career) return;
    
    // Clear cache for previous job when switching to new job
    const currentJobTitle = document.querySelector('.career-header h2')?.textContent;
    if (currentJobTitle && currentJobTitle !== jobTitle) {
        clearJobCache(currentJobTitle);
    }
    
    const detailsSection = document.getElementById('careerDetailsSection') || createDetailsSection();
    const userProfileData = localStorage.getItem('userProfile');
    const userProfile = userProfileData ? JSON.parse(userProfileData) : {};
    
    detailsSection.innerHTML = `
        <div class="career-details-container">
            <div class="career-header">
                <span class="career-icon-large">${career.icon}</span>
                <div>
                    <h2>${jobTitle}</h2>
                    <p class="career-subtitle">${career.match}% Match • ${career.salary} • ${career.growth}</p>
                </div>
            </div>
            
            <div class="nav-pills">
                <button class="nav-pill active" onclick="showAITab('overview', '${jobTitle}')"><i class='bx bx-clipboard' style='color: #27ae60; font-weight: 900;'></i> Overview</button>
                <button class="nav-pill ai-tab" onclick="showAITab('pathway', '${jobTitle}')"><i class='bx bx-rocket' style='color: #e67e22; font-weight: 900;'></i> Entry Pathway</button>
                <button class="nav-pill ai-tab" onclick="showAITab('skills', '${jobTitle}')"><i class='bx bx-target-lock' style='color: #e74c3c; font-weight: 900;'></i> Skills Priority</button>
                <button class="nav-pill ai-tab" onclick="showAITab('roadmap', '${jobTitle}')"><i class='bx bx-map' style='color: #9b59b6; font-weight: 900;'></i> 90-Day Roadmap</button>
                <button class="nav-pill ai-tab" onclick="showAITab('institute', '${jobTitle}')"><i class='bx bx-building' style='color: #2c3e50; font-weight: 900; font-size: 1.2rem;'></i> Institutes</button>
                <button class="nav-pill ai-tab" onclick="showAITab('fees', '${jobTitle}')"><i class='bx bx-credit-card' style='color: #f39c12; font-weight: 900; font-size: 1.2rem;'></i> Fees</button>
                <button class="nav-pill ai-tab" onclick="showAITab('scholarships', '${jobTitle}')"><i class='bx bx-medal' style='color: #d4af37; font-weight: 900; font-size: 1.2rem;'></i> Scholarships & Loans</button>
                <button class="nav-pill ai-tab" onclick="showAITab('jobmarket', '${jobTitle}')"><i class='bx bx-bar-chart-alt-2' style='color: #16a085; font-weight: 900;'></i> Job Market</button>
                <button class="nav-pill ai-tab" onclick="showAITab('certifications', '${jobTitle}')"><i class='bx bx-trophy' style='color: #e67e22; font-weight: 900; font-size: 1.2rem;'></i> Certifications</button>
                <button class="nav-pill ai-tab" onclick="showAITab('salary', '${jobTitle}')"><i class='bx bx-money' style='color: #27ae60; font-weight: 900;'></i> Salary Growth</button>
                <button class="nav-pill ai-tab" onclick="showAITab('experts', '${jobTitle}')"><i class='bx bx-user-check' style='color: #8e44ad; font-weight: 900;'></i> Experts</button>
            </div>
            
            <div class="tab-content">
                <div id="overview" class="tab-pane active">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated overview...</div>
                </div>
                
                <div id="pathway" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated pathway...</div>
                </div>
                
                <div id="institute" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated institutes...</div>
                </div>
                
                <div id="fees" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated fees...</div>
                </div>
                
                <div id="scholarships" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated scholarships...</div>
                </div>
                
                <div id="skills" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated skills...</div>
                </div>
                
                <div id="roadmap" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated roadmap...</div>
                </div>
                
                <div id="certifications" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated certifications...</div>
                </div>
                
                <div id="jobmarket" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated job market...</div>
                </div>
                
                <div id="marketoverview" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated market overview...</div>
                </div>
                
                <div id="salary" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated salary...</div>
                </div>
                
                <div id="experts" class="tab-pane">
                    <div class="loading-content"><i class='bx bx-loader-alt bx-spin'></i> Loading AI-generated experts...</div>
                </div>
            </div>

            
            <div class="action-buttons">
                <button onclick="goToRecommendedJobs('${jobTitle}')" class="go-to-jobs-btn"><i class='bx bx-target-lock'></i> Go to Recommended Jobs</button>
                <button onclick="downloadCareerReport('${jobTitle}')" class="download-report-btn"><i class='bx bx-download'></i> Download PDF Report</button>
                <button onclick="hideCareerDetails()" class="close-details-btn"><i class='bx bx-x'></i> Close Details</button>
            </div>
        </div>
    `;
    detailsSection.style.display = 'block';
    detailsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Auto-load overview content
    setTimeout(() => {
        showAITab('overview', jobTitle);
    }, 100);
}
async function showAITab(tabId, careerTitle) {
    document.querySelectorAll('.nav-pill').forEach(pill => pill.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    document.querySelectorAll(`.nav-pill[onclick*="'${tabId}'"]`).forEach(pill => pill.classList.add('active'));
    document.getElementById(tabId).classList.add('active');
    
    const cacheKey = `${careerTitle}_${tabId}`;
    const tabPane = document.getElementById(tabId);
    
    // Check if content is cached
    if (careerDetailsCache.has(cacheKey)) {
        tabPane.innerHTML = careerDetailsCache.get(cacheKey);
        return;
    }
    
    if (!tabPane.innerHTML.includes('loading-content')) {
        return;
    }
    
    tabPane.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">
                <h4>AI generating personalized content...</h4>
                <p>Analyzing your profile for ${careerTitle}</p>
                <div class="progress-text">Processing data and generating insights...</div>
            </div>
            <div class="loading-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="progress-${tabId}"></div>
                </div>
                <div class="progress-text" id="progress-text-${tabId}">0%</div>
            </div>
        </div>
    `;
    
    // Animate progress bar
    const progressBar = document.getElementById(`progress-${tabId}`);
    const progressText = document.getElementById(`progress-text-${tabId}`);
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 90) progress = 90;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }, 200);
    
    try {
        const userProfileData = localStorage.getItem('userProfile');
        const userProfile = userProfileData ? JSON.parse(userProfileData) : {};
        const content = await CareerMatcher.getCareerDetails(careerTitle, tabId, userProfile);
        
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        
        setTimeout(() => {
            const renderedContent = renderAIContent(tabId, content);
            tabPane.innerHTML = renderedContent;
            careerDetailsCache.set(cacheKey, renderedContent);
        }, 300);
    } catch (error) {
        clearInterval(progressInterval);
        tabPane.innerHTML = `
            <div class="error-content">
                <div class="error-icon"><i class="bx bx-error"></i></div>
                <h4>Fully AI-driven system failed</h4>
                <p>${error.message}</p>
                <button onclick="retryAIGeneration('${tabId}', '${careerTitle}')" class="retry-btn">
                    <i class='bx bx-refresh'></i> Regenerate Content
                </button>
            </div>
        `;
    }
}

function showTab(tabId) {
    // Show tab as active
    document.querySelectorAll('.nav-pill').forEach(pill => pill.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function renderAIContent(sectionType, content) {
    switch (sectionType) {
        case 'overview':
            return renderOverviewContent(content);
        case 'pathway':
            return renderPathwayContent(content);
        case 'institute':
            return renderInstituteContent(content);
        case 'fees':
            return renderFeesContent(content);
        case 'scholarships':
            return renderScholarshipsContent(content);
        case 'skills':
            return renderSkillsContent(content);
        case 'roadmap':
            return renderRoadmapContent(content);
        case 'certifications':
            return renderCertificationsContent(content);
        case 'jobmarket':
            return renderJobMarketContent(content);
        case 'salary':
            return renderSalaryContent(content);
        case 'experts':
            return renderExpertsContent(content);
        default:
            return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate content</div>';
    }
}

function renderOverviewContent(content) {
    if (!content.overview) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate overview data</div>';
    
    return `
        <h2>Career Overview</h2><br>
        <div class="ai-overview-container">
            <div class="overview-description">
                <h5><i class='bx bx-briefcase' style='color: #2c3e50; font-weight: 700;'></i> Role Description</h5>
                <p>${content.overview.role_description}</p>
            </div>
            
            <div class="key-responsibilities">
                <h5><i class='bx bx-target-lock' style='color: #e74c3c; font-weight: 700;'></i> Key Responsibilities</h5>
                <ul class="responsibilities-list">
                    ${content.overview.key_responsibilities.map(resp => `<li class="responsibility-item">${resp}</li>`).join('')}
                </ul>
            </div>
            
            <div class="why-suitable">
                <h5><i class='bx bx-star' style='color: #f39c12; font-weight: 700;'></i> Why This Suits You</h5>
                <p class="personalized-match">${content.overview.why_suitable || 'This career aligns well with your profile and interests.'}</p>
            </div>
        </div>
    `;
}

function renderRoadmapContent(content) {
    if (!content || !content.roadmap) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate roadmap data</div>';
    
    const roadmapData = content.roadmap;
    const phases = Object.entries(roadmapData).filter(([key]) => key.startsWith('phase'));
    
    if (phases.length === 0) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate roadmap phases</div>';
    
    return `
        <div class="roadmap-professional-container">
            <div class="roadmap-header">
                <h2><i class='bx bx-map'></i> Your 90-Day Learning Roadmap</h2>
                <p class="roadmap-subtitle">${roadmapData.overview || 'AI-curated step-by-step career development plan'}</p>
            </div>
            
            <div class="roadmap-timeline-professional">
                ${phases.map(([phase, data], index) => {
                    const phaseColors = ['#e74c3c', '#f39c12', '#27ae60'];
                    const phaseColor = phaseColors[index] || '#3498db';
                    const dayRange = `Days ${index * 30 + 1}-${(index + 1) * 30}`;
                    
                    return `
                        <div class="roadmap-phase-card" style="border-left: 5px solid ${phaseColor};">
                            <div class="phase-header-professional">
                                <div class="phase-number-badge" style="background: ${phaseColor};">
                                    <span class="phase-num">${index + 1}</span>
                                </div>
                                <div class="phase-title-info">
                                    <h3>${data.title || `Phase ${index + 1}`}</h3>
                                    <span class="phase-duration-badge">${dayRange}</span>
                                </div>
                            </div>
                            
                            <div class="phase-content-professional">
                                ${data.goals ? `
                                    <div class="phase-section">
                                        <h4><i class='bx bx-target-lock'></i> Learning Goals</h4>
                                        <div class="goals-grid">
                                            ${data.goals.map(goal => `
                                                <div class="goal-item">
                                                    <i class='bx bx-check-circle'></i>
                                                    <span>${goal}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${(data.tasks || data.daily_tasks) ? `
                                    <div class="phase-section">
                                        <h4><i class='bx bx-clipboard'></i> Action Tasks</h4>
                                        <div class="tasks-grid">
                                            ${(data.tasks || data.daily_tasks).map(task => `
                                                <div class="task-item">
                                                    <i class='bx bx-play-circle'></i>
                                                    <span>${task}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${data.progress_indicators ? `
                                    <div class="phase-section">
                                        <h4><i class='bx bx-chart-line'></i> Progress Indicators</h4>
                                        <div class="progress-grid">
                                            ${data.progress_indicators.map(indicator => `
                                                <div class="progress-item">
                                                    <i class='bx bx-medal'></i>
                                                    <span>${indicator}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="roadmap-completion-tracker">
                <div class="tracker-header">
                    <h4><i class='bx bx-trophy'></i> Track Your Progress</h4>
                    <p>Mark phases as complete to monitor your learning journey</p>
                </div>
                <div class="progress-phases">
                    ${phases.map((_, index) => `
                        <div class="progress-phase" onclick="togglePhaseComplete(${index})">
                            <div class="phase-circle" id="phase-${index}">
                                <i class='bx bx-check'></i>
                            </div>
                            <span>Phase ${index + 1}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderCertificationsContent(content) {
    if (!content.certifications) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate certifications data</div>';
    
    return `
        <div class="certifications-simple-container">
            <div class="certifications-header">
                <h3>Professional Certifications</h3>
                <p class="certifications-subtitle">Industry-recognized credentials to advance your career</p>
            </div>
            
            <ul class="certifications-list">
                ${content.certifications.map(cert => {
                    const certLink = cert.link || cert.fallback_link;
                    return `
                        <li class="certification-item" data-cert-link="${certLink || ''}">
                            <strong>${cert.name}</strong> by ${cert.provider}
                            <br>&nbsp;&nbsp;&nbsp;<i class='bx bx-calendar'></i> Duration: ${cert.duration} | <i class='bx bx-money'></i> Cost: ${cert.cost || 'Varies'} | <i class='bx bx-trending-up'></i> Impact: ${cert.career_impact || 'High value'}
                            ${certLink ? `&nbsp;&nbsp;&nbsp;<a href="${certLink}" target="_blank" rel="noopener noreferrer" class="cert-link"><i class='bx bx-link-external'></i> Enroll Now</a>` : ''}
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>
    `;
}

function renderJobMarketContent(content) {
    if (!content || !content.jobmarket) {
        console.error('Job market content missing:', content);
        return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate job market data</div>';
    }
    
    const jobmarket = content.jobmarket;
    const demandPercentage = jobmarket.demand_percentage || 75;
    
    return `
        <h2><i class='bx bx-bar-chart-alt-2' style='color: #16a085; font-weight: 700;'></i> Job Market Analysis</h2>
        <div class="market-overview-container">
            <div class="market-stats-visual">
                <div class="stat-chart-grid">
                    <div class="chart-card demand-chart">
                        <div class="chart-header">
                            <h5><i class='bx bx-trending-up'></i> Market Demand</h5>
                            <div class="demand-visual">
                                <div class="demand-gauge">
                                    <div class="gauge-background"></div>
                                    <div class="gauge-fill" style="--demand-percentage: ${demandPercentage};"></div>
                                    <div class="gauge-needle" style="--demand-percentage: ${demandPercentage};"></div>
                                    <div class="gauge-center"></div>
                                </div>
                                <div class="demand-status">
                                    <span class="status-text">${jobmarket.demand.split(' ').slice(0, 2).join(' ')}</span>
                                    <span class="demand-label">Market Demand</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chart-card growth-chart">
                        <div class="chart-header">
                            <h5><i class='bx bx-rocket'></i> Growth Trend</h5>
                            <div class="growth-visual">
                                <div class="growth-column-chart">
                                    <div class="growth-bar"></div>
                                    <div class="growth-bar"></div>
                                    <div class="growth-bar"></div>
                                    <div class="growth-bar"></div>
                                    <div class="growth-bar"></div>
                                    <div class="growth-bar"></div>
                                </div>
                                <div class="growth-percentage">
                                    <span class="percentage-value">${jobmarket.growth_rate.split(' ').slice(0, 2).join(' ')}</span>
                                    <span class="percentage-label">Annual Growth</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chart-card success-chart">
                        <div class="chart-header">
                            <h5><i class='bx bx-check-circle'></i> Success Rate</h5>
                            <div class="success-visual">
                                <div class="success-circle">
                                    <div class="circle-progress" style="--percentage: 85;"></div>
                                    <div class="circle-text">
                                        <span class="success-number">${jobmarket.success_rate.split(' ').slice(0, 2).join(' ')}</span>
                                        <span class="success-label">Placement</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="market-analysis-details">
                <h5><i class='bx bx-chart-line'></i> Detailed Market Analysis</h5>
                <div class="analysis-grid">
                    <div class="analysis-item">
                        <strong>Demand Level:</strong> ${jobmarket.demand} with ${demandPercentage}% market penetration
                    </div>
                    <div class="analysis-item">
                        <strong>Growth Rate:</strong> ${jobmarket.growth_rate} year-over-year expansion
                    </div>
                    <div class="analysis-item">
                        <strong>Success Rate:</strong> ${jobmarket.success_rate} job placement success
                    </div>
                    <div class="analysis-item">
                        <strong>Market Outlook:</strong> Positive growth trajectory with increasing opportunities
                    </div>
                </div>
            </div>
            
            ${jobmarket.top_companies && Array.isArray(jobmarket.top_companies) ? `
                <div class="top-companies">
                    <h5><i class='bx bx-buildings' style='color: #34495e; font-weight: 700;'></i> Top Hiring Companies in India</h5>
                    <div class="companies-grid">
                        ${jobmarket.top_companies.map(company => `
                            <div class="company-card">
                                <h6>${company.name}</h6>
                                <p class="company-type"><strong>Industry:</strong> ${company.type}</p>
                                <p class="hiring-freq"><strong>Hiring:</strong> ${company.hiring_frequency}</p>
                                ${company.package_range ? `<p class="package-range"><strong>Package:</strong> ${company.package_range}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${jobmarket.key_insights && Array.isArray(jobmarket.key_insights) ? `
                <div class="market-insights">
                    <h5><i class='bx bx-target-lock' style='color: #e74c3c; font-weight: 700;'></i> Key Market Insights</h5>
                    <div class="insights-grid">
                        ${jobmarket.key_insights.map(insight => `
                            <div class="insight-card">
                                <span class="insight-icon"><i class='bx bx-bulb' style='color: #f39c12; font-weight: 600;'></i></span>
                                <span class="insight-text">${insight}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderSalaryContent(content) {
    try {
        if (!content || !content.salary) {
            console.error('Salary content missing:', content);
            return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate salary data</div>';
        }
        
        const salaryData = content.salary;
        const experienceLevels = ['fresher_level', '5years_level', '10years_level', '15years_level'];
        const levelLabels = {
            'fresher_level': 'Fresher (0-1 years)',
            '5years_level': '5 Years Experience', 
            '10years_level': '10 Years Experience',
            '15years_level': '15+ Years Experience'
        };
        
        return `
            <div class="salary-timeline-container">
                <h2><i class='bx bx-money'></i> Salary Progression Timeline</h2>
                <div class="salary-cards-grid">
                    ${experienceLevels.map((level, index) => {
                        const data = salaryData[level];
                        if (!data || typeof data !== 'object') {
                            console.warn(`Invalid data for level ${level}:`, data);
                            return '';
                        }
                        
                        const levelColors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
                        const levelColor = levelColors[index];
                        
                        return `
                            <div class="salary-card" style="border-left: 4px solid ${levelColor};">
                                <div class="salary-card-header">
                                    <div class="salary-level-info">
                                        <h5>${levelLabels[level]}</h5>
                                    </div>
                                </div>
                                ${data.cities && typeof data.cities === 'object' ? `
                                    <div class="city-breakdown">
                                        <div class="cities-grid">
                                            ${Object.entries(data.cities).map(([city, salary]) => `
                                                <div class="city-salary-item">
                                                    <span class="city-name">${city.charAt(0).toUpperCase() + city.slice(1)}</span>
                                                    <span class="city-salary">${salary || 'Not available'}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${salaryData.growth_tips && Array.isArray(salaryData.growth_tips) ? `
                    <div class="growth-tips-section">
                        <h5><i class='bx bx-bulb'></i> Salary Growth Tips</h5>
                        <div class="tips-grid">
                            ${salaryData.growth_tips.map(tip => `
                                <div class="tip-card">
                                    <span class="tip-icon"><i class='bx bx-rocket'></i></span>
                                    <span class="tip-text">${tip || 'Tip not available'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Error rendering salary content:', error);
        return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to display salary information</div>';
    }
}

function renderPathwayContent(content) {
    if (!content.pathway) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate pathway data</div>';
    
    return `
        <h2><i class='bx bx-rocket'></i> Career Entry Pathway</h2><br>
        <div class="ai-pathway-container">
            <!--div class="pathway-description">
                <p>Educational pathway description</p>
            </div-->
            <div class="pathway-timeline">
                ${content.pathway.map((step, index) => {
                    const stepClass = step.level.includes('10') ? 'class10' : 
                                    step.level.includes('12') ? 'class12' : 
                                    step.level.includes('Undergraduate') ? 'undergraduate' : 'postgraduate';
                    return `
                        <div class="pathway-step ${stepClass}">
                            <h5 class="pathway-level">${step.level}</h5>
                            <span class="pathway-duration">${step.duration}</span>
                            <p class="pathway-focus"><strong>Focus:</strong> ${step.focus}</p>
                            <p class="pathway-description">${step.description}</p>
                            ${step.entrance_prep ? `
                                <div class="entrance-prep">
                                    <strong><i class='bx bx-target-lock'></i> Entrance Preparation:</strong> ${step.entrance_prep}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderSkillsContent(content) {
    if (!content.skills) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate skills data</div>';
    
    const skillsData = content.skills;
    const priorityOrder = ['high', 'medium', 'low'];
    
    return `
        <div class="skills-section">
            <div class="skills-header">
                <h2><i class='bx bx-brain'></i> Master These Skills</h2>
                <p class="skills-subtitle">AI-curated learning path with YouTube course resources</p>
            </div>
            
            ${priorityOrder.map((priority, index) => {
                if (!skillsData[priority]) return '';
                const priorityConfig = {
                    high: { title: 'Must-Have Skills', subtitle: 'Essential for career success', icon: 'bx-trophy', gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)', badge: 'CRITICAL' },
                    medium: { title: 'Core Skills', subtitle: 'Build strong foundation', icon: 'bx-target-lock', gradient: 'linear-gradient(135deg, #f39c12, #e67e22)', badge: 'IMPORTANT' },
                    low: { title: 'Bonus Skills', subtitle: 'Accelerate your progress', icon: 'bx-trending-up', gradient: 'linear-gradient(135deg, #3498db, #2980b9)', badge: 'BONUS' }
                };
                
                const config = priorityConfig[priority];
                
                return `
                    <div class="skills-priority-section">
                        <div class="priority-header-card">
                            <div class="priority-badge" style="background: ${config.gradient}">${config.badge}</div>
                            <div class="priority-info">
                                <h3><i class='bx ${config.icon}'></i> ${config.title}</h3>
                                <p>${config.subtitle}</p>
                            </div>
                        </div>
                        
                        <div class="skills-mastery-grid">
                            ${skillsData[priority].map((skill, skillIndex) => `
                                <div class="skill-mastery-card" data-skill-id="${priority}-${skillIndex}">
                                    <div class="skill-content">
                                        <div class="skill-header">
                                            <h4>${skill.name}</h4>
                                            <div class="skill-impact">
                                                <span class="impact-label">Career Impact</span>
                                                <div class="impact-bar">
                                                    <div class="impact-fill" style="width: ${priority === 'high' ? '90' : priority === 'medium' ? '70' : '50'}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="skill-outcome">${skill.description}</p>
                                        
                                        ${skill.youtube_search_url ? `
                                            <div class="youtube-search-section">
                                                <a href="${skill.youtube_search_url}" target="_blank" rel="noopener noreferrer" class="youtube-search-btn">
                                                    <i class='bx bxl-youtube'></i>
                                                    <span>Find Courses on YouTube</span>
                                                    <i class='bx bx-link-external'></i>
                                                </a>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// AI skill resources loading functionality
function loadSkillResources(skillId, skillName) {
    const skillCard = document.querySelector(`[data-skill-id="${skillId}"]`);
    const button = skillCard.querySelector('.master-skill-btn');
    const resourcesContainer = skillCard.querySelector('.skill-resources-container');
    
    // Show loading state
    button.querySelector('span').style.display = 'none';
    button.querySelector('.btn-loading').style.display = 'flex';
    button.disabled = true;
    
    // Call AI-driven resource generation API
    fetch('/api/generate-skill-resources', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            skill_name: skillName,
            career_context: document.querySelector('.career-header h2')?.textContent || ''
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.resources) {
            resourcesContainer.style.display = 'block';
            resourcesContainer.innerHTML = `
                <div class="resources-comprehensive">
                    <div class="resources-header">
                        <h5><i class='bx bx-book-open'></i> Curated Learning Resources for ${skillName}</h5>
                    </div>
                    
                    <div class="resources-tabs">
                        <div class="resource-tab active" onclick="showResourceTab('courses-${skillId}')">Courses</div>
                        <div class="resource-tab" onclick="showResourceTab('videos-${skillId}')">Videos</div>
                        <div class="resource-tab" onclick="showResourceTab('docs-${skillId}')">Documentation</div>
                        <div class="resource-tab" onclick="showResourceTab('practice-${skillId}')">Practice</div>
                    </div>
                    
                    <div class="resource-content">
                        <div id="courses-${skillId}" class="resource-panel active">
                            ${data.resources.resources.courses.map(course => `
                                <div class="resource-item">
                                    <h6>${course.title}</h6>
                                    <p><strong>Provider:</strong> ${course.provider} | <strong>Duration:</strong> ${course.duration} | <strong>Level:</strong> ${course.level}</p>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div id="videos-${skillId}" class="resource-panel">
                            ${data.resources.resources.videos.map(video => `
                                <div class="resource-item">
                                    <h6>${video.title}</h6>
                                    <p><strong>Duration:</strong> ${video.duration}</p>
                                    ${video.url ? `<iframe width="100%" height="200" src="${video.url}" frameborder="0" allowfullscreen></iframe>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        
                        <div id="docs-${skillId}" class="resource-panel">
                            ${data.resources.resources.documentation.map(doc => `
                                <div class="resource-item">
                                    <h6>${doc.title}</h6>
                                    <p>${doc.description}</p>
                                    <span class="doc-type">${doc.type}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div id="practice-${skillId}" class="resource-panel">
                            ${data.resources.resources.practice_paths.map(practice => `
                                <div class="resource-item">
                                    <h6>${practice.title}</h6>
                                    <p>${practice.description}</p>
                                    <span class="difficulty-badge ${practice.difficulty.toLowerCase()}">${practice.difficulty}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            button.innerHTML = '<i class="bx bx-check"></i><span>Resources Loaded</span>';
        } else {
            throw new Error('AI resource generation failed - no fallback available');
        }
        
        button.querySelector('span').style.display = 'inline';
        button.querySelector('.btn-loading').style.display = 'none';
        button.disabled = false;
    })
    .catch(error => {
        resourcesContainer.style.display = 'block';
        resourcesContainer.innerHTML = `
            <div class="resources-error">
                <div class="error-content">
                    <i class='bx bx-error'></i>
                    <h5>AI Resource Generation Failed</h5>
                    <p>Fully AI-driven system failed to generate resources - no fallback modes available</p>
                </div>
            </div>
        `;
        
        button.querySelector('span').style.display = 'inline';
        button.querySelector('.btn-loading').style.display = 'none';
        button.disabled = false;
        button.innerHTML = '<i class="bx bx-error"></i><span>AI Failed</span>';
    });
}

function showResourceTab(tabId) {
    const skillId = tabId.split('-').slice(1).join('-');
    document.querySelectorAll(`[id*="${skillId}"] .resource-tab`).forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll(`[id*="${skillId}"] .resource-panel`).forEach(panel => panel.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function renderInstituteContent(content) {
    if (!content.institutes) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate institutes data</div>';
    
    const categories = {
        government: { title: 'Government Institutes', icon: 'bx-buildings', color: '#10b981' },
        private: { title: 'Private Institutes', icon: 'bx-building', color: '#3b82f6' },
        distance: { title: 'Distance Learning', icon: 'bx-book-open', color: '#f59e0b' },
        online: { title: 'Online Platforms', icon: 'bx-laptop', color: '#8b5cf6' }
    };
    
    return `
        <div class="institutes-simple-container">
            <div class="institutes-header-simple">
                <h2>Recommended Educational Institutes</h2>
                <p class="institutes-subtitle-simple">Top institutions for your career path</p>
            </div>
            
            ${Object.entries(categories).map(([category, config]) => {
                if (!content.institutes[category] || !Array.isArray(content.institutes[category])) return '';
                return `
                    <div class="institute-category-simple">
                        <h3><i class='bx ${config.icon}'></i> ${config.title}</h3>
                        <ul class="institutes-list">
                            ${content.institutes[category].slice(0, 4).map(institute => `
                                <li class="institute-item">
                                    <strong>${institute.name}</strong>
                                    ${institute.location ? ` - <i class='bx bx-map'></i> ${institute.location}` : ''}
                                    ${institute.specialization ? ` - ${institute.specialization}` : ''}
                                    ${institute.rating ? ` - <i class='bx bx-star'></i> ${institute.rating}` : ''}
                                    ${institute.website ? `&nbsp;&nbsp;&nbsp;<a href="${institute.website}" target="_blank" rel="noopener noreferrer" class="institute-link"><i class='bx bx-link-external'></i> Visit Website</a>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderFeesContent(content) {
    if (!content.fees) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate fees data</div>';
    
    return `
        <div class="fees-professional-container">            
            ${content.fees.total_investment ? `
                <div class="total-cost-highlight">
                    <h2><i class='bx bx-calculator'></i> Total Investment Range</h2>
                    <div class="total-amount">${content.fees.total_investment.replace(/\(.*?\)/g, '').trim()}</div>
                    <p class="cost-note">${content.fees.note ? content.fees.note.replace(/middle-class/gi, '').replace(/middle class/gi, '') : ''}</p>
                </div><br>
            ` : ''}
            
            <div class="fees-breakdown-professional">
                <h4><i class='bx bx-bar-chart-alt-2' style='color: #16a085; font-weight: 700;'></i> Essential Cost Breakdown</h4>
                <div class="fees-cards-grid">
                    ${content.fees.breakdown.map(fee => `
                        <div class="fee-card">
                            <div class="fee-header">
                                <h5>${fee.category}</h5>
                            </div>
                            <span class="fee-duration">${fee.duration}</span>
                            <div class="fee-amount">${fee.range}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Global storage for career details to persist data
const careerDetailsCache = new Map();

function renderScholarshipsContent(content) {
    if (!content.financial_support) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate financial support data</div>';
    
    return `
        <div class="scholarships-simple-container">
            ${content.financial_support.scholarships && content.financial_support.scholarships.length > 0 ? `
                <div class="financial-category-simple scholarships-section">
                    <h2 class="financial-heading"><i class='bx bx-medal' style='color: #d4af37; font-weight: 700;'></i> Merit & Need-Based Scholarships</h2>
                    <ul class="scholarships-list">
                        ${content.financial_support.scholarships.map(scholarship => `
                            <li class="scholarship-item">
                                <strong>${scholarship.name}</strong> - ${scholarship.amount || 'Varies'} - ${scholarship.eligibility || 'Merit-based'}
                                ${scholarship.link ? `&nbsp;&nbsp;&nbsp;<a href="${scholarship.link}" target="_blank" rel="noopener noreferrer" class="scholarship-link"><i class='bx bx-link-external'></i> Apply Now</a>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${content.financial_support.loans && content.financial_support.loans.length > 0 ? `
                <div class="financial-category-simple loans-section">
                    <h2 class="financial-heading"><i class='bx bx-bank'></i> Educational Loans</h2>
                    <ul class="loans-list">
                        ${content.financial_support.loans.map(loan => `
                            <li class="loan-item">
                                <strong>${loan.provider}</strong> - ${loan.max_amount || 'Up to ₹30 Lakhs'} - ${loan.interest_rate || '8.5-12% per annum'}
                                ${loan.link ? `>&nbsp;&nbsp;&nbsp;<a href="${loan.link}" target="_blank" rel="noopener noreferrer" class="loan-link"><i class='bx bx-link-external'></i> Apply for Loan</a>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${content.financial_support.government_schemes && content.financial_support.government_schemes.length > 0 ? `
                <div class="financial-category-simple schemes-section">
                    <h2 class="financial-heading"><i class='bx bx-building-house'></i> Government Schemes & Support</h2>
                    <ul class="schemes-list">
                        ${content.financial_support.government_schemes.map(scheme => `
                            <li class="scheme-item">
                                <strong>${scheme.name}</strong> - ${scheme.benefit}
                                ${scheme.link ? `&nbsp;&nbsp;&nbsp;<a href="${scheme.link}" target="_blank" rel="noopener noreferrer" class="scheme-link"><i class='bx bx-link-external'></i> Learn More</a>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

function renderMarketOverviewContent(content) {
    if (!content.market_overview) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate market overview data</div>';
    
    const market = content.market_overview;
    return `
        <div class="market-overview-container">
            <div class="market-stats-visual">
                <div class="stat-chart-grid">
                    <div class="chart-card demand-chart">
                        <div class="chart-header">
                            <h5><i class='bx bx-trending-up'></i> Job Demand</h5>
                            <div class="demand-indicator ${market.job_demand?.toLowerCase()}">
                                <div class="demand-bar"></div>
                                <span>${market.job_demand || 'High'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chart-card growth-chart">
                        <div class="chart-header">
                            <h5><i class='bx bx-rocket'></i> Growth Rate</h5>
                            <div class="growth-line">
                                <div class="growth-trend positive">
                                    <span class="growth-percentage">${market.growth_rate || '+15%'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chart-card salary-chart">
                        <div class="chart-header">
                            <h5><i class='bx bx-money'></i> Avg Salary</h5>
                            <div class="salary-range-visual">
                                <div class="salary-bar">
                                    <div class="salary-fill"></div>
                                </div>
                                <span class="salary-text">${market.average_salary || '₹8-15 LPA'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="market-insights">
                <h5><i class='bx bx-target-lock'></i> Market Insights</h5>
                <div class="insights-grid">
                    ${(market.key_insights || [
                        'High demand in tech sector',
                        'Remote work opportunities increasing',
                        'Skills-based hiring trending'
                    ]).map(insight => `
                        <div class="insight-card">
                            <span class="insight-icon"><i class='bx bx-bulb'></i></span>
                            <span>${insight}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderExpertsContent(content) {
    if (!content.experts) return '<div class="error-content"><i class="bx bx-error"></i> Fully AI-driven system failed to generate experts data</div>';
    
    // Limit to 2 experts as requested
    const limitedExperts = content.experts.slice(0, 2);
    
    return `
        <div class="experts-section">
            <h2><i class='bx bx-user-voice'></i> Industry Leaders</h2>
            <div class="experts-cards-grid">
                ${limitedExperts.map(expert => `
                    <div class="expert-card">
                        <div class="expert-header">
                            <div class="expert-basic-info">
                                <h5 class="expert-name">${expert.name}<p class="expert-title">${expert.designation}</p></h5>
                                
                            </div>
                        </div>
                        <div class="expert-details">
                            <div class="company-card">
                                <span class="company-icon"><i class='bx bx-buildings'></i></span>
                                <span>${expert.company}</span>
                                <span class="exp-icon"><i class='bx bx-time'></i></span>
                                <span>${expert.experience}</span>
                            </div>
                            <div class="expert-experience">
                            </div>
                            ${expert.key_advice ? `
                                <div class="expert-advice">
                                    <span class="advice-icon"><i class='bx bx-bulb'></i></span>
                                    <span><strong>Key Advice:</strong> "${expert.key_advice}"</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function toggleRoadmapAccordion(index) {
    const content = document.getElementById(`roadmap-content-${index}`);
    const arrow = document.getElementById(`roadmap-arrow-${index}`);
    
    // Close all other accordions
    document.querySelectorAll('.roadmap-accordion-content').forEach((item, i) => {
        if (i !== index) {
            item.classList.remove('active');
            const otherArrow = document.getElementById(`roadmap-arrow-${i}`);
            if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
        }
    });
    
    // Toggle current accordion
    content.classList.toggle('active');
    arrow.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
}

function createDetailsSection() {
    const section = document.createElement('div');
    section.id = 'careerDetailsSection';
    section.className = 'career-details-section';
    document.getElementById('roadmapSection').appendChild(section);
    return section;
}

function clearJobCache(jobTitle) {
    // Keep all cached data when switching jobs
    return;
}

function hideCareerDetails() {
    const detailsSection = document.getElementById('careerDetailsSection');
    if (detailsSection) {
        detailsSection.style.display = 'none';
    }
}


function retryAIGeneration(tabId, careerTitle) {
    // Clear cache for this specific tab
    const cacheKey = `${careerTitle}_${tabId}`;
    careerDetailsCache.delete(cacheKey);
    
    const tabPane = document.getElementById(tabId);
    tabPane.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">
                <h4>Retrying AI generation...</h4>
                <p>Please wait while we regenerate content for ${careerTitle}</p>
            </div>
        </div>
    `;
    
    // Retry the generation
    showAITab(tabId, careerTitle);
}

function downloadCareerReport(careerTitle) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        // Corporate Header with minimal design
        doc.setFillColor(44, 62, 80);
        doc.rect(0, 0, 210, 35, 'F');
        
        // Title with Inter/Helvetica font
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('CAREER GUIDANCE REPORT', 105, 15, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.text(careerTitle.toUpperCase(), 105, 25, { align: 'center' });
        
        // Minimal metadata
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 20, 45);
        doc.text('EduBot AI Career System', 190, 45, { align: 'right' });
        
        let yPosition = 60;
        const leftMargin = 20;
        const rightMargin = 190;
        const lineHeight = 5;
        
        // Corporate section configuration
        const sections = {
            'overview': { title: 'EXECUTIVE SUMMARY', priority: 1 },
            'pathway': { title: 'EDUCATIONAL PATHWAY', priority: 2 },
            'skills': { title: 'CORE COMPETENCIES', priority: 3 },
            'roadmap': { title: 'DEVELOPMENT ROADMAP', priority: 4 },
            'institute': { title: 'RECOMMENDED INSTITUTIONS', priority: 5 },
            'fees': { title: 'INVESTMENT ANALYSIS', priority: 6 },
            'scholarships': { title: 'FINANCIAL SUPPORT', priority: 7 },
            'jobmarket': { title: 'MARKET ANALYSIS', priority: 8 },
            'certifications': { title: 'PROFESSIONAL CERTIFICATIONS', priority: 9 },
            'salary': { title: 'COMPENSATION STRUCTURE', priority: 10 },
            'experts': { title: 'INDUSTRY INSIGHTS', priority: 11 }
        };
        
        // Sort sections by priority
        const sortedSections = Object.entries(sections)
            .sort(([,a], [,b]) => a.priority - b.priority);
        
        sortedSections.forEach(([section, config]) => {
            const cacheKey = `${careerTitle}_${section}`;
            if (careerDetailsCache.has(cacheKey)) {
                // Check page space
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 25;
                }
                
                // Minimal section header
                doc.setFillColor(248, 249, 250);
                doc.rect(leftMargin - 5, yPosition - 3, rightMargin - leftMargin + 10, 12, 'F');
                
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.5);
                doc.line(leftMargin - 5, yPosition + 9, rightMargin + 5, yPosition + 9);
                
                doc.setTextColor(44, 62, 80);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(config.title, leftMargin, yPosition + 5);
                yPosition += 18;
                
                // Clean content processing
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = careerDetailsCache.get(cacheKey);
                yPosition = processContentForCorporatePDF(tempDiv, doc, yPosition, leftMargin, rightMargin, lineHeight);
                yPosition += 8;
            }
        });
        
        // Minimal footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(20, 282, 180, 282);
            
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(`${i}`, 105, 287, { align: 'center' });
            doc.text('EduBot Career Guidance System', 105, 292, { align: 'center' });
        }
        
        // High-resolution output
        doc.save(`${careerTitle.replace(/[^a-z0-9]/gi, '_')}_Career_Analysis.pdf`);
        
    } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF generation failed. Please try again.');
    }
}

function processContentForCorporatePDF(element, doc, startY, leftMargin, rightMargin, lineHeight) {
    let yPosition = startY;
    const maxWidth = rightMargin - leftMargin;
    
    const processElement = (el) => {
        const tagName = el.tagName;
        const classList = Array.from(el.classList || []);
        const parentClasses = Array.from(el.parentElement?.classList || []);
        
        // Get only direct text content for specific elements to avoid duplication
        let text = '';
        if (classList.includes('analysis-item') || classList.includes('status-text') || 
            classList.includes('demand-label') || classList.includes('percentage-value') || 
            classList.includes('percentage-label') || classList.includes('success-number') || 
            classList.includes('success-label')) {
            // For analysis and chart data, get the full text content
            text = el.textContent?.trim() || '';
        } else if (classList.includes('company-type') || classList.includes('hiring-freq') || classList.includes('package-range')) {
            // For company details, extract text and remove rupee symbol artifacts
            const fullText = el.textContent?.trim() || '';
            const colonIndex = fullText.indexOf(':');
            text = colonIndex !== -1 ? fullText.substring(colonIndex + 1).trim() : fullText;
            // Remove all subscript/superscript Unicode characters
            text = text.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f\u2080-\u208e\u00b0-\u00be]/g, '')
                      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, '')
                      .trim();
        } else if (classList.includes('insight-card')) {
            // For insight cards, get only the insight-text span content
            const insightText = el.querySelector('.insight-text');
            text = insightText ? insightText.textContent?.trim() : '';
        } else {
            text = el.textContent?.trim() || '';
        }
        
        // Enhanced text cleaning - preserve numbers and currency, remove subscripts, preserve URLs
        text = text.replace(/[\u00b9\u00b2\u00b3\u2070-\u209f\u2080-\u208e\u00b0-\u00be]/g, '')
                  .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, '')
                  .replace(/[^\w\s\-.,()%₹:+\/]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .replace(/^[\s\n\r]+|[\s\n\r]+$/g, '')
                  .trim();
        
        if (!text || text.length < 2) return;
        
        // Page break management
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 25;
        }
        
        // Enhanced content categorization
        const isHeading = tagName?.match(/H[2-6]/);
        const isSkillCard = classList.includes('skill-mastery-card');
        const isInAnalysisGrid = parentClasses.includes('analysis-grid');
        const isInCompanyCard = parentClasses.includes('company-card');
        const isInInsightCard = classList.includes('insight-card') || parentClasses.includes('insight-card');
        const isList = tagName === 'LI' || classList.includes('responsibility-item') || classList.includes('goal-item') || 
                      classList.includes('task-item') || classList.includes('progress-item') || classList.includes('certification-item') || 
                      classList.includes('institute-item') || classList.includes('scholarship-item') || classList.includes('loan-item') || 
                      classList.includes('scheme-item') || classList.includes('insight-card') || classList.includes('tip-card') ||
                      classList.includes('analysis-item') || classList.includes('company-type') || classList.includes('hiring-freq') || 
                      classList.includes('package-range') || classList.includes('city-salary-item') || classList.includes('insight-text') ||
                      classList.includes('status-text') || classList.includes('percentage-value') || classList.includes('success-number') ||
                      classList.includes('youtube-video-card');
        const isData = false;
        const isParagraph = tagName === 'P' && text.length > 20;
        
        if (isHeading) {
            doc.setTextColor(52, 73, 94);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(tagName === 'H2' ? 11 : 10);
            
            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 25;
                }
                doc.text(line, leftMargin, yPosition);
                yPosition += lineHeight + 1;
            });
            yPosition += 2;
            
        } else if (isSkillCard) {
            // Process skill card with YouTube link
            const skillName = el.querySelector('h4')?.textContent?.trim();
            const skillDesc = el.querySelector('.skill-outcome')?.textContent?.trim();
            const youtubeLink = el.querySelector('.youtube-search-btn');
            
            if (skillName) {
                doc.setTextColor(70, 70, 70);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(`• ${skillName}`, leftMargin, yPosition);
                yPosition += lineHeight;
                
                if (skillDesc) {
                    doc.setFont('helvetica', 'normal');
                    const descLines = doc.splitTextToSize(skillDesc, maxWidth - 5);
                    descLines.forEach(line => {
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 25;
                        }
                        doc.text(line, leftMargin + 3, yPosition);
                        yPosition += lineHeight;
                    });
                }
                
                if (youtubeLink) {
                    const url = youtubeLink.getAttribute('href');
                    if (url) {
                        doc.setTextColor(52, 152, 219);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                        doc.textWithLink('   [Find Courses on YouTube]', leftMargin + 3, yPosition, { url: url });
                        doc.setTextColor(70, 70, 70);
                        yPosition += lineHeight + 2;
                    }
                }
            }
            
        } else if (isList) {
            doc.setTextColor(70, 70, 70);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            // Extract clickable links from the element
            const linkElement = el.querySelector('a');
            let url = null;
            let linkText = '';
            
            // Check for certification link stored in data attribute
            const certLink = el.getAttribute('data-cert-link');
            if (certLink) {
                url = certLink;
                linkText = 'Enroll Now';
            } else if (linkElement) {
                url = linkElement.getAttribute('href');
                linkText = linkElement.textContent?.trim() || 'View Link';
                // Remove link text from main text to avoid duplication
                text = text.replace(linkText, '').trim();
            }
            
            const bulletText = `• ${text}`;
            const lines = doc.splitTextToSize(bulletText, maxWidth - 5);
            lines.forEach((line, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 25;
                }
                doc.text(line, leftMargin + (index > 0 ? 3 : 0), yPosition);
                yPosition += lineHeight;
            });
            
            // Add clickable link if found
            if (url) {
                doc.setTextColor(52, 152, 219);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.textWithLink(`   [${linkText}]`, leftMargin + 3, yPosition, { url: url });
                doc.setTextColor(70, 70, 70);
                yPosition += lineHeight + 1;
            }
            
        } else if (isParagraph) {
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 25;
                }
                doc.text(line, leftMargin, yPosition);
                yPosition += lineHeight;
            });
            yPosition += 2;
        }
    };
    
    // Enhanced element selection for complete content capture including skill YouTube links and certification links
    const contentSelectors = [
        'h2', 'h3', 'h4', 'h5', 'h6', 'li',
        'p:not(.company-type):not(.hiring-freq):not(.package-range)',
        '.fee-amount', '.total-amount',
        '.analysis-grid .analysis-item',
        '.status-text', '.demand-label', '.percentage-value', '.percentage-label', '.success-number', '.success-label',
        '.company-card h6', '.company-card .company-type', '.company-card .hiring-freq', '.company-card .package-range',
        '.insight-card',
        '.city-salary-item',
        '.expert-name', '.expert-title', '.expert-advice span',
        '.youtube-search-btn',
        '.skill-mastery-card',
        '.certification-item'
    ];
    
    const allElements = element.querySelectorAll(contentSelectors.join(', '));
    
    // Process elements with error handling
    try {
        allElements.forEach(processElement);
    } catch (error) {
        console.error('PDF content processing error:', error);
        // Add error note to PDF
        doc.setTextColor(220, 53, 69);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('Note: Some content may be incomplete due to processing limitations.', leftMargin, yPosition);
        yPosition += lineHeight;
    }
    
    return yPosition;
}



function togglePhaseComplete(index) {
    const phaseCircle = document.getElementById(`phase-${index}`);
    phaseCircle.classList.toggle('completed');
}