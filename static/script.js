class EduBotInteractive {
    constructor() {
        this.currentStep = 1;
        this.checkAuthentication();
        this.init();
        this.showStep(1);
        this.initializeResponsiveFeatures();
    }
    
    initializeResponsiveFeatures() {
        // Responsive font size adjustment
        this.adjustFontSizes();
        
        // Listen for window resize
        window.addEventListener('resize', () => {
            this.adjustFontSizes();
            this.adjustGaugeCharts();
        });
        
        // Initialize gauge animations
        setTimeout(() => {
            this.adjustGaugeCharts();
        }, 500);
    }
    
    adjustFontSizes() {
        const viewportWidth = window.innerWidth;
        const root = document.documentElement;
        
        // Dynamic font scaling based on viewport
        if (viewportWidth < 480) {
            root.style.setProperty('--base-font-size', '14px');
            root.style.setProperty('--heading-scale', '1.2');
        } else if (viewportWidth < 768) {
            root.style.setProperty('--base-font-size', '15px');
            root.style.setProperty('--heading-scale', '1.3');
        } else if (viewportWidth < 1200) {
            root.style.setProperty('--base-font-size', '16px');
            root.style.setProperty('--heading-scale', '1.4');
        } else {
            root.style.setProperty('--base-font-size', '16px');
            root.style.setProperty('--heading-scale', '1.5');
        }
    }
    
    adjustGaugeCharts() {
        // Ensure gauge needles and fills are synchronized
        const gauges = document.querySelectorAll('.demand-gauge');
        gauges.forEach(gauge => {
            const fill = gauge.querySelector('.gauge-fill');
            const needle = gauge.querySelector('.gauge-needle');
            
            if (fill && needle) {
                const percentage = parseFloat(fill.style.getPropertyValue('--demand-percentage')) || 50;
                
                // Synchronize needle and fill
                fill.style.setProperty('--demand-percentage', percentage);
                needle.style.setProperty('--demand-percentage', percentage);
                
                // Animate on load
                setTimeout(() => {
                    fill.style.transition = 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                    needle.style.transition = 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                }, 100);
            }
        });
    }
    
    checkAuthentication() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }
    }
    
    init() {
        this.setupFormNavigation();
        this.setupRangeSliders();
        this.setupLogout();
    }
    
    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Clear all stored data
                localStorage.clear();
                sessionStorage.clear();
                
                // Show confirmation
                alert('You have been logged out successfully!');
                
                // Redirect to login page
                window.location.href = '/login.html';
            });
        }
    }
    
    setupFormNavigation() {
        const nextBtn = document.getElementById('nextBtn');
        const nextBtn2 = document.getElementById('nextBtn2');
        const prevBtn = document.getElementById('prevBtn');
        const prevBtn2 = document.getElementById('prevBtn2');
        const generateBtn = document.getElementById('generateBtn');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (nextBtn2) nextBtn2.addEventListener('click', () => this.nextStep2());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (prevBtn2) prevBtn2.addEventListener('click', () => this.prevStep2());
        if (generateBtn) generateBtn.addEventListener('click', () => this.generateRoadmap());
        
        this.updateProgress();
    }
    
    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        // Show current step
        document.getElementById(`step${step}`).classList.add('active');
        this.currentStep = step;
        this.updateProgress();
        
        // Scroll to top of form container
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    nextStep() {
        if (this.validateStep(1)) {
            this.showStep(2);
        }
    }
    
    nextStep2() {
        if (this.validateStep(2)) {
            this.showStep(3);
        }
    }
    
    prevStep() {
        this.showStep(1);
    }
    
    prevStep2() {
        this.showStep(2);
    }
    
    validateStep(step) {
        if (step === 1) {
            const education = document.getElementById('educationLevel').value;
            const career = document.querySelector('input[name="careerInterest"]:checked');
            
            if (!education || !career) {
                alert('Please fill all required fields in Student Profile');
                return false;
            }
        }
        if (step === 2) {
            const commitment = document.querySelector('input[name="learningCommitment"]:checked');
            const priority = document.querySelector('input[name="careerPriority"]:checked');
            
            if (!commitment || !priority) {
                alert('Please fill all required fields in Preferences');
                return false;
            }
        }
        return true;
    }
    
    updateProgress() {
        const progress = (this.currentStep / 3) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = `Step ${this.currentStep} of 3 - ${Math.round(progress)}%`;
    }
    
    async generateRoadmap() {
        const userProfile = UserProfile.fromFormData();
        
        if (!userProfile.isValid()) {
            alert('Please complete your profile before generating AI recommendations');
            return;
        }
        
        localStorage.setItem('userProfile', JSON.stringify(userProfile.toJSON()));
        
        this.showLoadingScreen();
        
        try {
            const careers = await CareerMatcher.getRecommendations(userProfile);
            this.hideLoadingScreen();
            
            const roadmapSection = document.getElementById('roadmapSection');
            roadmapSection.style.display = 'block';
            roadmapSection.scrollIntoView({ behavior: 'smooth' });
            
            CareerMatcher.renderTop3(careers);
        } catch (error) {
            this.hideLoadingScreen();
            console.error('AI Career Generation Error:', error);
            const careerCards = document.getElementById('careerCards');
            careerCards.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545; font-size: 18px;">
                    <i class='bx bx-error-circle' style='font-size: 48px;'></i><br>
                    AI Career Generation Failed<br>
                    <small style="font-size: 14px; margin-top: 10px; display: block;">${error.message}</small>
                    <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;"><i class='bx bx-refresh'></i> Retry AI Generation</button>
                </div>
            `;
        }
    }
    
    showLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        const percentage = document.getElementById('loadingPercentage');
        
        overlay.style.display = 'flex';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress > 95) progress = 95;
            percentage.textContent = `${Math.round(progress)}%`;
        }, 500);
        
        this.loadingInterval = interval;
    }
    
    hideLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        const percentage = document.getElementById('loadingPercentage');
        
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        
        percentage.textContent = '100%';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
    
    setupRangeSliders() {
        const performance = document.getElementById('academicPerformance');
        const performanceValue = document.getElementById('performanceValue');
        
        if (performance && performanceValue) {
            performance.addEventListener('input', (e) => {
                performanceValue.textContent = `${e.target.value}/10`;
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EduBotInteractive();
});