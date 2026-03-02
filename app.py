import sqlite3
import json
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import time
import logging

class EducationBot:
    def __init__(self):
        self.setup_ai()
        self.init_database()
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def setup_ai(self):
        self.api_keys = [
            'AIzaSyA0-hhtMn1S-28GWxU_q0YrHgMi3y6Befw',
            'AIzaSyCxnX42-eXv0ZSR6bVu7XDH_y_J2wkIKOA'
        ]
        self.current_api_index = 0
        self.model = None
        self.current_model_name = None
        self.api_failures = {}

    def get_working_model(self):
        """Dynamically find and return a working model from available APIs"""
        for attempt in range(len(self.api_keys)):
            api_key = self.api_keys[self.current_api_index]
            
            # Skip recently failed APIs for a cooldown period
            if api_key in self.api_failures:
                if time.time() - self.api_failures[api_key] < 300:  # 5 min cooldown
                    self.current_api_index = (self.current_api_index + 1) % len(self.api_keys)
                    continue
                else:
                    del self.api_failures[api_key]  # Remove expired failure
            
            try:
                genai.configure(api_key=api_key)
                self.logger.info(f"Testing API key {self.current_api_index + 1}")
                
                # Get available models dynamically
                available_models = list(genai.list_models())
                
                for model_info in available_models:
                    if hasattr(model_info, 'supported_generation_methods') and 'generateContent' in model_info.supported_generation_methods:
                        try:
                            model = genai.GenerativeModel(model_info.name)
                            # Test the model with a simple prompt
                            test_response = model.generate_content("Test")
                            
                            if test_response and test_response.text:
                                self.model = model
                                self.current_model_name = model_info.name
                                self.logger.info(f"Successfully connected to {model_info.name} with API key {self.current_api_index + 1}")
                                return self.model
                                
                        except Exception as model_error:
                            self.logger.warning(f"Model {model_info.name} failed: {str(model_error)}")
                            continue
                
                raise Exception(f"No working models found for API key {self.current_api_index + 1}")
                
            except Exception as api_error:
                self.logger.error(f"API key {self.current_api_index + 1} failed: {str(api_error)}")
                self.api_failures[api_key] = time.time()
                self.current_api_index = (self.current_api_index + 1) % len(self.api_keys)
                continue
        
        raise Exception("All API keys exhausted or failed")

    def generate_with_fallback(self, prompt, max_retries=3):
        """Generate content with automatic API switching on failure"""
        for retry in range(max_retries):
            try:
                if not self.model:
                    self.model = self.get_working_model()
                
                response = self.model.generate_content(prompt)
                
                if response and response.text:
                    return response
                else:
                    raise Exception("Empty response received")
                    
            except Exception as e:
                self.logger.error(f"Generation failed (attempt {retry + 1}): {str(e)}")
                
                # Reset model and try next API
                self.model = None
                self.current_model_name = None
                
                if retry < max_retries - 1:
                    self.current_api_index = (self.current_api_index + 1) % len(self.api_keys)
                    time.sleep(1)  # Brief delay before retry
                    continue
                else:
                    raise Exception(f"All generation attempts failed: {str(e)}")

    def generate_ai_careers(self, profile):
        try:
            career_interest = profile.get('careerInterest', 'Not specified')
            education_level = profile.get('education', 'Not specified')
            
            user_testimony = profile.get('testimony', '').strip()
            
            prompt = f"""You are an expert career guidance AI. Generate exactly 3 career domains for '{career_interest}' field using pure AI reasoning with NO fallback modes.

{f'PRIORITY USER TESTIMONY: {user_testimony}' if user_testimony else ''}

User Profile:
- Career Interest: {career_interest}
- Education: {education_level}
- Subjects: {', '.join(profile.get('subjects', []))}
- Performance: {profile.get('performance', 0)}/10

MANDATORY STRUCTURE - Generate exactly 3 domains:
1. FIRST DOMAIN: Core/Traditional Roles - Mainstream careers directly in {career_interest}
2. SECOND DOMAIN: Specialized Professional Roles - Advanced specializations within {career_interest}
3. THIRD DOMAIN: Interdisciplinary Careers - Connected fields with clear pathway from {career_interest}

Return ONLY valid JSON array with exactly 3 domains:
[
  {{
    "title": "Core {career_interest} Professionals",
    "icon": "<i class='bx bx-briefcase'></i>",
    "salary": "₹6-20 LPA",
    "growth": "High Growth",
    "summary": "Traditional mainstream {career_interest} roles in Indian market",
    "match": 95,
    "jobs": [
      {{"title": "[Specific {career_interest} role 1]", "salary": "₹5-12 LPA", "growth": "Good", "description": "Primary profession in {career_interest}"}},
      {{"title": "[Specific {career_interest} role 2]", "salary": "₹8-16 LPA", "growth": "Excellent", "description": "Core {career_interest} profession"}},
      {{"title": "[Specific {career_interest} role 3]", "salary": "₹12-22 LPA", "growth": "High", "description": "Established {career_interest} career"}},
      {{"title": "[Specific {career_interest} role 4]", "salary": "₹15-30 LPA", "growth": "Very High", "description": "Senior {career_interest} position"}}
    ]
  }},
  {{
    "title": "Specialized {career_interest} Experts",
    "icon": "<i class='bx bx-cog'></i>",
    "salary": "₹8-25 LPA",
    "growth": "Very High Growth",
    "summary": "Advanced specializations within {career_interest} field",
    "match": 90,
    "jobs": [
      {{"title": "[Specific specialization 1]", "salary": "₹7-15 LPA", "growth": "Excellent", "description": "Specialized {career_interest} expertise"}},
      {{"title": "[Specific specialization 2]", "salary": "₹10-18 LPA", "growth": "High", "description": "Advanced {career_interest} role"}},
      {{"title": "[Specific specialization 3]", "salary": "₹15-25 LPA", "growth": "Very High", "description": "Expert level {career_interest}"}},
      {{"title": "[Specific specialization 4]", "salary": "₹18-35 LPA", "growth": "Excellent", "description": "Senior specialist role"}}
    ]
  }},
  {{
    "title": "Interdisciplinary {career_interest} Careers",
    "icon": "<i class='bx bx-network-chart'></i>",
    "salary": "₹6-18 LPA",
    "growth": "Good Growth",
    "summary": "Adjacent careers with clear pathway from {career_interest}",
    "match": 85,
    "jobs": [
      {{"title": "[Connected role 1]", "salary": "₹5-10 LPA", "growth": "Good", "description": "Adjacent career to {career_interest}"}},
      {{"title": "[Connected role 2]", "salary": "₹7-13 LPA", "growth": "Good", "description": "Interdisciplinary {career_interest} role"}},
      {{"title": "[Connected role 3]", "salary": "₹10-16 LPA", "growth": "Excellent", "description": "Cross-functional career"}},
      {{"title": "[Connected role 4]", "salary": "₹12-20 LPA", "growth": "High", "description": "Advanced interdisciplinary role"}}
    ]
  }}
]

CRITICAL: Replace ALL bracketed placeholders with actual job titles. System is fully AI-driven - no fallback modes allowed."""
            
            response = self.generate_with_fallback(prompt)
            
            if not response or not response.text:
                raise Exception("AI service completely unavailable - system is fully AI-driven")
            
            response_text = response.text.strip()
            
            # Enhanced JSON cleaning
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            # Remove any text before first [ or {
            start_idx = min([i for i in [response_text.find('['), response_text.find('{')] if i != -1] or [0])
            if start_idx > 0:
                response_text = response_text[start_idx:]
            
            # Remove any text after last ] or }
            end_idx = max(response_text.rfind(']'), response_text.rfind('}'))
            if end_idx != -1:
                response_text = response_text[:end_idx + 1]
            
            # Clean problematic characters
            import re
            response_text = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', response_text)
            response_text = response_text.replace('&quot;', '"').replace('&#39;', "'")
            response_text = re.sub(r'\s+', ' ', response_text).strip()
            
            # Fix JSON formatting
            response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
            response_text = re.sub(r',\s*,', ',', response_text)
            
            if not response_text or response_text in ['{}', '[]', 'null']:
                raise Exception("AI generated empty response - system is fully AI-driven")
            
            try:
                careers = json.loads(response_text)
            except json.JSONDecodeError as e:
                self.logger.error(f"JSON decode error: {str(e)}")
                self.logger.error(f"Raw response: {response_text[:500]}...")
                raise Exception("AI JSON parsing failed - system is fully AI-driven")
            
            if not isinstance(careers, list):
                raise Exception("AI must return JSON array - system is fully AI-driven")
            
            if len(careers) != 3:
                raise Exception(f"AI must return exactly 3 career domains, got {len(careers)} - system is fully AI-driven")
            
            # Validate all required fields - no fallback defaults
            for i, career in enumerate(careers):
                required_fields = ['title', 'summary', 'icon', 'salary', 'growth', 'match', 'jobs']
                for field in required_fields:
                    if not career.get(field):
                        raise Exception(f"AI must generate complete career data including {field} - system is fully AI-driven")
                
                if not isinstance(career.get('jobs'), list) or len(career.get('jobs')) == 0:
                    raise Exception("AI must generate complete job arrays - system is fully AI-driven")
                
                # Validate job structure
                for job in career['jobs']:
                    job_fields = ['title', 'salary', 'growth', 'description']
                    for field in job_fields:
                        if not job.get(field):
                            raise Exception(f"AI must generate complete job data including {field} - system is fully AI-driven")
            
            self.logger.info(f"Successfully generated 3 career domains using pure AI - system is fully AI-driven")
            return careers
            
        except Exception as e:
            self.logger.error(f"AI career generation failed: {str(e)}")
            raise Exception(f"Fully AI-driven career generation failed: {str(e)}")
    
    def generate_detailed_content(self, career_title, section_type, user_profile):
        """Generate AI-driven content for specific career detail sections"""
        try:
            user_testimony = user_profile.get('testimony', '').strip()
            testimony_context = f"\nPRIORITY USER TESTIMONY: {user_testimony}\n" if user_testimony else ""
            
            prompts = {
                'overview': f"""{testimony_context}Generate comprehensive overview for {career_title} based on user profile.
User Profile: {user_profile}

Provide detailed JSON with complete job role information:
{{"overview": {{"role_description": "2-3 line concise description of what this professional does daily and their work environment", "key_responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3", "Responsibility 4"], "why_suitable": "2-3 line concise explanation of why this career matches user's profile and interests"}}}}

Make descriptions concise and personalized.""",
                'pathway': f"""Generate educational pathway for {career_title} starting from user's current education level.
User Profile: {user_profile}
Current Education Level: {user_profile.get('education', 'undergraduate')}

CRITICAL: Generate specific higher education pathway steps based on user's current level:
- If Class 10: Generate "Class 11-12 (Science/Commerce)", "Bachelor's Degree", "Master's Degree"
- If Class 12: Generate "Bachelor's Degree in [Field]", "Master's Degree/Specialization", "Professional Certification"
- If Undergraduate: Generate "Complete Bachelor's Degree", "Master's Degree in [Specialization]", "PhD/Advanced Certification"
- If Graduate: Generate "Master's Degree in [Advanced Field]", "Professional Certification", "PhD/Research"

Provide JSON with educational sequence:
{{"pathway": [{{"level": "Specific degree/course name for next step", "duration": "Duration", "focus": "Specialization area", "description": "What to study and achieve", "key_subjects": ["Subject 1", "Subject 2", "Subject 3"], "entrance_prep": "Entrance exams needed"}}]}}

Generate 2-3 specific pathway steps with actual degree names.""",
                
                'skills': f"""Generate classified skills for {career_title} with BONUS skills strictly at the end AND YOUTUBE SEARCH LINKS.
User Profile: {user_profile}

CRITICAL REQUIREMENTS:
1. Each skill MUST include YouTube search link to find courses for that skill
2. Use YouTube search URL format: https://www.youtube.com/results?search_query=SKILL_NAME+tutorial
3. Replace spaces with + in search query
4. This ensures links NEVER result in 404 or page not found errors

Provide JSON with skills classified by priority with YOUTUBE SEARCH LINKS:
{{"skills": {{"high": [{{"name": "Python Programming", "description": "Why this skill is essential for career success", "youtube_search_url": "https://www.youtube.com/results?search_query=Python+Programming+tutorial+course"}}], "medium": [{{"name": "Data Analysis", "description": "Supporting skill description", "youtube_search_url": "https://www.youtube.com/results?search_query=Data+Analysis+tutorial+course"}}], "low": [{{"name": "Git Version Control", "description": "Additional skill benefits", "youtube_search_url": "https://www.youtube.com/results?search_query=Git+Version+Control+tutorial+course"}}]}}}}

CRITICAL: Generate YouTube search URLs by replacing skill name spaces with +. System is fully AI-driven - no fallback modes. Focus on 3-4 skills per priority level.""",
                
                'roadmap': f"""Create professional 90-day learning roadmap for {career_title} with clear phases and progress tracking.
User Profile: {user_profile}

Provide JSON with structured learning plan:
{{"roadmap": {{"total_duration": "90 days", "overview": "AI-curated step-by-step career development plan", "phase1": {{"title": "Foundation Phase (Days 1-30)", "goals": ["Master fundamental concepts", "Build core knowledge base"], "tasks": ["Complete basic courses", "Practice daily exercises"], "progress_indicators": ["Complete 5 modules", "Pass assessment test"]}}, "phase2": {{"title": "Building Phase (Days 31-60)", "goals": ["Apply knowledge practically", "Develop intermediate skills"], "tasks": ["Work on real projects", "Join study groups"], "progress_indicators": ["Complete 3 projects", "Achieve 80% score"]}}, "phase3": {{"title": "Mastery Phase (Days 61-90)", "goals": ["Achieve professional competency", "Prepare for career transition"], "tasks": ["Build portfolio", "Network with professionals"], "progress_indicators": ["Complete capstone project", "Get industry certification"]}}}}}}

Ensure each phase has clear goals, tasks, and measurable progress indicators.""",
                
                'institute': f"""Generate Indian educational institutes for {career_title}.

Provide JSON with institutes across categories:
{{"institutes": {{
    "government": [
        {{"name": "IIT Delhi", "location": "New Delhi", "specialization": "Engineering & Technology", "rating": "4.8/5", "website": "https://home.iitd.ac.in/"}},
        {{"name": "NIT Trichy", "location": "Tiruchirappalli", "specialization": "Engineering", "rating": "4.5/5", "website": "https://www.nitt.edu/"}}
    ],
    "private": [
        {{"name": "BITS Pilani", "location": "Pilani", "specialization": "Engineering & Sciences", "rating": "4.6/5", "website": "https://www.bits-pilani.ac.in/"}},
        {{"name": "VIT Vellore", "location": "Vellore", "specialization": "Multi-disciplinary", "rating": "4.3/5", "website": "https://vit.ac.in/"}}
    ],
    "distance": [
        {{"name": "IGNOU", "location": "New Delhi", "specialization": "Distance Education", "rating": "4.0/5", "website": "https://www.ignou.ac.in/"}},
        {{"name": "Symbiosis Distance Learning", "location": "Pune", "specialization": "Distance MBA & Courses", "rating": "4.1/5", "website": "https://www.scdl.net/"}}
    ],
    "online": [
        {{"name": "NPTEL", "location": "Online", "specialization": "Technical Courses", "rating": "4.5/5", "website": "https://nptel.ac.in/"}},
        {{"name": "Coursera", "location": "Online", "specialization": "Global Courses", "rating": "4.6/5", "website": "https://www.coursera.org/"}}
    ]
}}}}

Generate 2-4 institutes per category. System is fully AI-driven.""",
                
                'fees': f"""Generate realistic fee structure for {career_title} career from user's current education level.
User Profile: {user_profile}
Current Education Level: {user_profile.get('education', 'undergraduate')}

CRITICAL: Calculate fees from user's CURRENT education level only. Provide realistic costs in India.

Provide JSON with simplified cost breakdown:
{{"fees": {{"total_investment": "Rs 8-15 Lakhs (AI Estimated Average)", "breakdown": [{{"category": "Bachelor's Degree", "range": "Rs 3-6 Lakhs", "duration": "3-4 years"}}, {{"category": "Master's Degree", "range": "Rs 2-5 Lakhs", "duration": "2 years"}}, {{"category": "Professional Courses", "range": "Rs 1-3 Lakhs", "duration": "6-12 months"}}], "note": "AI-calculated averages suitable for families in India"}}}}

Keep breakdown to 3 essential cost categories only. Focus on realistic costs in India.""",
                
                'scholarships': f"""Generate comprehensive financial support for {career_title} in India with DISTINCT scholarships, loans, and government schemes.
User Profile: {user_profile}

CRITICAL REQUIREMENTS:
1. SCHOLARSHIPS: Merit/need-based awards from private organizations, trusts, foundations WITH WORKING LINKS
2. LOANS: Bank education loans with interest rates WITH WORKING BANK LINKS
3. GOVERNMENT SCHEMES: Central/State government welfare programs WITH WORKING GOVERNMENT LINKS

Provide JSON with DISTINCT financial assistance including exactly 3 scholarships, 3 loans, and 5 government schemes WITH VALID WORKING WEBSITE LINKS:
{{"financial_support": {{
    "scholarships": [
        {{"name": "Tata Trusts Scholarship Programme", "amount": "Rs 20,000-30,000 per year", "eligibility": "85%+ marks in 12th", "link": "https://www.tatatrusts.org/our-work/individual-grants-programme/education-grants"}},
        {{"name": "Reliance Foundation Undergraduate Scholarship", "amount": "Rs 2,00,000 per year", "eligibility": "Family income below Rs 6 lakhs", "link": "https://www.reliancefoundation.org/education.html"}},
        {{"name": "Aditya Birla Scholarship Programme", "amount": "Rs 1,75,000 per year", "eligibility": "Top 1% students", "link": "https://www.adityabirlascholars.net/"}}
    ],
    "loans": [
        {{"provider": "State Bank of India Education Loan", "max_amount": "Rs 30 Lakhs", "interest_rate": "8.5-9.5% per annum", "link": "https://sbi.co.in/web/personal-banking/loans/education-loans"}},
        {{"provider": "HDFC Credila Education Loan", "max_amount": "Rs 25 Lakhs", "interest_rate": "9.0-10.0% per annum", "link": "https://www.hdfccredila.com/"}},
        {{"provider": "Axis Bank Education Loan", "max_amount": "Rs 20 Lakhs", "interest_rate": "8.8-9.8% per annum", "link": "https://www.axisbank.com/retail/loans/education-loan"}}
    ],
    "government_schemes": [
        {{"name": "National Scholarship Portal", "benefit": "Rs 10,000-50,000 per year", "eligibility": "Various categories", "link": "https://scholarships.gov.in/"}},
        {{"name": "Post Matric Scholarship SC/ST/OBC", "benefit": "Full tuition + Rs 1,000/month", "eligibility": "SC/ST/OBC students", "link": "https://scholarships.gov.in/"}},
        {{"name": "Central Sector Scholarship Scheme", "benefit": "Rs 20,000 per year", "eligibility": "Top 20% students", "link": "https://scholarships.gov.in/"}},
        {{"name": "Prime Minister Scholarship Scheme", "benefit": "Rs 25,000 per year", "eligibility": "Children of armed forces", "link": "https://ksb.gov.in/"}},
        {{"name": "Begum Hazrat Mahal National Scholarship", "benefit": "Rs 12,000 per year", "eligibility": "Minority girl students", "link": "https://scholarships.gov.in/"}}
    ]
}}}}

CRITICAL: Generate DISTINCT items with VALID WORKING LINKS. Scholarships from private organizations, loans from banks, schemes from government. System is fully AI-driven - no fallback modes.""",                 
                'jobmarket': f"""Generate comprehensive Indian job market analysis for {career_title}.
User Profile: {user_profile}

Return ONLY valid JSON without special characters:
{{"jobmarket": {{"demand": "High demand in Indian market", "demand_percentage": 85, "growth_rate": "22% annual growth", "success_rate": "87% placement rate", "top_companies": [{{"name": "Tata Consultancy Services", "type": "IT Services", "hiring_frequency": "Monthly hiring drives", "package_range": "₹4-12 LPA"}}, {{"name": "Infosys Limited", "type": "Technology Services", "hiring_frequency": "Quarterly recruitment", "package_range": "₹5-15 LPA"}}, {{"name": "Wipro Technologies", "type": "Digital Solutions", "hiring_frequency": "Continuous hiring", "package_range": "₹4-14 LPA"}}, {{"name": "HCL Technologies", "type": "IT Services", "hiring_frequency": "Bi-monthly drives", "package_range": "₹4-13 LPA"}}], "key_insights": ["High demand in Indian tech sector", "Remote work opportunities increasing rapidly", "Skills-based hiring trending in India", "Government digitization driving growth"]}}}}

Generate realistic Indian companies and market data. Include demand_percentage as integer 50-95 based on actual {career_title} market demand in India.""",
                
                'salary': f"""Generate Indian salary progression for {career_title} with 4 experience levels.
User Profile: {user_profile}

Return JSON with exactly these 4 levels:
{{"salary": {{"fresher_level": {{"experience": "0-1 years", "range": "Rs 2.5-5 LPA", "cities": {{"bangalore": "Rs 3-5 LPA", "mumbai": "Rs 3.5-5.5 LPA", "delhi": "Rs 3-5 LPA", "pune": "Rs 2.5-4.5 LPA"}}}}, "5years_level": {{"experience": "5 years", "range": "Rs 8-15 LPA", "cities": {{"bangalore": "Rs 10-15 LPA", "mumbai": "Rs 11-16 LPA", "delhi": "Rs 9-14 LPA", "pune": "Rs 8-13 LPA"}}}}, "10years_level": {{"experience": "10 years", "range": "Rs 18-30 LPA", "cities": {{"bangalore": "Rs 20-30 LPA", "mumbai": "Rs 22-32 LPA", "delhi": "Rs 18-28 LPA", "pune": "Rs 16-26 LPA"}}}}, "15years_level": {{"experience": "15 years", "range": "Rs 30-60+ LPA", "cities": {{"bangalore": "Rs 35-60+ LPA", "mumbai": "Rs 40-70+ LPA", "delhi": "Rs 32-55+ LPA", "pune": "Rs 28-50+ LPA"}}}}, "growth_tips": ["Switch companies for growth", "Get certifications", "Move to tech hubs"]}}}}

Ensure valid JSON with exactly these 4 levels only.""",
                
                'experts': f"""Generate detailed Indian industry expert profiles for {career_title}.
User Profile: {user_profile}

Provide comprehensive JSON with complete expert information:
{{"experts": [{{"name": "Rajesh Kumar Sharma", "designation": "Senior Vice President - Technology", "company": "Tata Consultancy Services", "experience": "18+ years in {career_title}", "expertise": "Digital transformation, enterprise architecture, team leadership in {career_title} domain", "achievements": "Led 50+ successful {career_title} projects, mentored 200+ professionals, published 15 research papers", "education": "IIT Delhi, MBA from IIM Ahmedabad", "key_advice": "Focus on continuous learning and adapt to emerging technologies in {career_title}"}}, {{"name": "Priya Mehta", "designation": "Chief Technology Officer", "company": "Infosys Limited", "experience": "15+ years in {career_title}", "expertise": "Innovation strategy, product development, cross-functional leadership in {career_title}", "achievements": "Launched 10+ market-leading {career_title} products, awarded 'Tech Leader of the Year 2023', holds 8 patents", "education": "NIT Trichy, MS from Stanford University", "key_advice": "Build strong fundamentals and focus on problem-solving skills in {career_title}"}}], "industry_insights": ["Indian {career_title} market growing at 25% annually", "Remote work has increased opportunities by 40%", "Skills-based hiring is the new trend in {career_title}", "Government initiatives supporting {career_title} sector growth", "Startup ecosystem creating new {career_title} opportunities"]}}}}

Generate realistic Indian expert profiles with complete details including education, achievements, and specific advice.""",
                
                "certifications": f"""Generate industry-recognized certifications directly related to {career_title} career with DIRECT COURSE LINKS.

CRITICAL REQUIREMENTS:
1. Generate certifications from platforms: Coursera, Udemy, edX, Udacity, AWS, Google, Microsoft
2. Each certification MUST have a direct link to the course page
3. Links will be validated - invalid links will be replaced with platform search URLs

Provide JSON with certification details:
{{"certifications": [
    {{"name": "Google Data Analytics Professional Certificate", "provider": "Coursera", "duration": "6 months", "cost": "Rs 3,000-5,000", "difficulty": "Beginner", "career_impact": "High", "link": "https://www.coursera.org/professional-certificates/google-data-analytics"}},
    {{"name": "Python for Everybody Specialization", "provider": "Coursera", "duration": "8 months", "cost": "Rs 4,000-6,000", "difficulty": "Beginner", "career_impact": "Very High", "link": "https://www.coursera.org/specializations/python"}},
    {{"name": "AWS Certified Solutions Architect", "provider": "Amazon Web Services", "duration": "3 months", "cost": "Rs 12,000-15,000", "difficulty": "Intermediate", "career_impact": "Very High", "link": "https://aws.amazon.com/certification/certified-solutions-architect-associate/"}}
]}}

Generate 3-5 relevant certifications with DIRECT COURSE LINKS. System is fully AI-driven.""",
                
                'marketoverview': f"""Generate market overview for {career_title} in India.
User Profile: {user_profile}

Provide JSON with market analysis:
{{"market_overview": {{"job_demand": "High demand", "growth_rate": "15 percent annual growth", "average_salary": "Rs 8-15 LPA", "key_insights": ["High demand in tech sector", "Remote work increasing", "Skills-based hiring"], "employment_outlook": "Positive growth expected", "geographic_hotspots": ["Bangalore", "Mumbai", "Delhi NCR", "Pune"]}}}}

Focus on realistic Indian market data for {career_title}."""
            }
            
            if section_type not in prompts:
                return None
                
            response = self.generate_with_fallback(prompts[section_type])
            
            if not response or not response.text:
                return None
                
            response_text = response.text.strip()
            
            # Clean response text more thoroughly
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            # Remove any text before first { or [
            start_idx = min([i for i in [response_text.find('{'), response_text.find('[')] if i != -1] or [0])
            if start_idx > 0:
                response_text = response_text[start_idx:]
            
            # Remove any text after last } or ]
            end_idx = max(response_text.rfind('}'), response_text.rfind(']'))
            if end_idx != -1:
                response_text = response_text[:end_idx + 1]
            
            # Enhanced sanitization for job market content
            import re
            # Remove all control characters and problematic characters
            response_text = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', response_text)
            # Remove HTML entities and problematic quotes
            response_text = response_text.replace('&quot;', '"').replace('&#39;', "'")
            response_text = response_text.replace("'", "'")
            response_text = response_text.replace('"', '"')
            response_text = response_text.replace('\\n', ' ').replace('\\r', ' ').replace('\\t', ' ')
            # Remove extra whitespace and normalize
            response_text = re.sub(r'\s+', ' ', response_text).strip()
            
            # Fix trailing commas and malformed JSON
            response_text = re.sub(r',\s*([}\]])', r'\1', response_text)
            response_text = re.sub(r',\s*,', ',', response_text)
            # Additional validation for empty response
            if not response_text.strip() or response_text.strip() in ['{}', '[]', 'null', 'undefined']:
                raise Exception(f"AI failed to generate content for {section_type} - system is fully AI-driven")
                
            try:
                parsed_content = json.loads(response_text)
                if not parsed_content:
                    raise Exception(f"AI content generation failed for {section_type} - system is fully AI-driven")
                
                # Validate certification links if this is certifications section
                if section_type == 'certifications' and 'certifications' in parsed_content:
                    validated_certs = []
                    for cert in parsed_content['certifications']:
                        if 'link' in cert and cert['link']:
                            validated_link, is_fallback = self.validate_certification_link(
                                cert['link'], 
                                cert.get('name', ''), 
                                cert.get('provider', '')
                            )
                            cert['link'] = validated_link
                            if is_fallback:
                                cert['fallback_link'] = validated_link
                        validated_certs.append(cert)
                    parsed_content['certifications'] = validated_certs
                
                return parsed_content
            except json.JSONDecodeError as json_error:
                raise Exception(f"AI JSON generation failed for {section_type} - system is fully AI-driven")
            
        except Exception as e:
            self.logger.error(f"AI content generation failed for {section_type}: {str(e)}")
            raise Exception(f"Fully AI-driven system failed for {section_type}: {str(e)}")

    def init_database(self):
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

    def signup_user(self, username, password):
        try:
            conn = sqlite3.connect('users.db')
            cursor = conn.cursor()
            cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
            conn.commit()
            conn.close()
            return {'success': True, 'message': 'Account created successfully'}
        except sqlite3.IntegrityError:
            return {'success': False, 'message': 'Username already exists'}
        except:
            return {'success': False, 'message': 'Signup failed'}

    def login_user(self, username, password):
        try:
            conn = sqlite3.connect('users.db')
            cursor = conn.cursor()
            cursor.execute('SELECT password FROM users WHERE username = ?', (username,))
            result = cursor.fetchone()
            conn.close()
            
            if not result:
                return {'success': False, 'message': 'Username not found'}
            if result[0] != password:
                return {'success': False, 'message': 'Invalid password'}
            
            return {'success': True, 'message': 'Login successful'}
        except:
            return {'success': False, 'message': 'Login failed'}
    
    def validate_certification_link(self, link, cert_name, provider):
        """Validate certification link and return filtered search URL if invalid"""
        try:
            response = requests.head(link, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                return link, False
            else:
                return self.generate_platform_search_url(cert_name, provider), True
        except:
            return self.generate_platform_search_url(cert_name, provider), True
    
    def generate_platform_search_url(self, cert_name, provider):
        """Generate platform-specific search URL for certification"""
        import urllib.parse
        search_query = urllib.parse.quote(f"{cert_name}")
        
        platform_urls = {
            'coursera': f"https://www.coursera.org/search?query={search_query}",
            'udemy': f"https://www.udemy.com/courses/search/?q={search_query}",
            'edx': f"https://www.edx.org/search?q={search_query}",
            'udacity': f"https://www.udacity.com/courses/all?search={search_query}",
            'pluralsight': f"https://www.pluralsight.com/search?q={search_query}",
            'linkedin': f"https://www.linkedin.com/learning/search?keywords={search_query}",
            'aws': f"https://aws.amazon.com/certification/?nc1=h_ls",
            'google': f"https://grow.google/certificates/",
            'microsoft': f"https://learn.microsoft.com/en-us/certifications/",
            'amazon web services': f"https://aws.amazon.com/certification/?nc1=h_ls"
        }
        
        provider_lower = provider.lower()
        for key, url in platform_urls.items():
            if key in provider_lower:
                return url
        
        return f"https://www.coursera.org/search?query={search_query}"
    
    def generate_skill_resources(self, skill_name, career_context=""):
        """AI-driven skill resource generation with no fallback modes"""
        try:
            prompt = f"""You are an AI learning curator. Generate comprehensive learning resources for '{skill_name}' in {career_context} context.

Return ONLY valid JSON:
{{
    "resources": {{
        "courses": [{{"title": "Course Name", "provider": "Platform", "duration": "Duration", "level": "Beginner/Intermediate/Advanced"}}],
        "videos": [{{"title": "Video Title", "url": "https://youtube.com/embed/VIDEO_ID", "duration": "Duration"}}],
        "documentation": [{{"title": "Doc Title", "description": "What you'll learn", "type": "Official/Tutorial/Guide"}}],
        "practice_paths": [{{"title": "Practice Path", "description": "Hands-on exercises", "difficulty": "Easy/Medium/Hard"}}]
    }}
}}

CRITICAL: System is fully AI-driven - no fallback modes allowed. Must generate valid learning resources."""
            
            response = self.generate_with_fallback(prompt)
            
            if not response or not response.text:
                raise Exception("AI resource generation failed - system is fully AI-driven")
            
            response_text = response.text.strip()
            
            # Clean JSON response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            import re
            response_text = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', response_text)
            response_text = response_text.replace('&quot;', '"').replace('&#39;', "'")
            response_text = re.sub(r'\s+', ' ', response_text).strip()
            
            try:
                resource_data = json.loads(response_text)
                if not resource_data.get('resources'):
                    raise Exception("AI failed to generate resources - system is fully AI-driven")
                return resource_data
            except json.JSONDecodeError:
                raise Exception("AI JSON generation failed - system is fully AI-driven")
            
        except Exception as e:
            self.logger.error(f"AI resource generation failed: {str(e)}")
            raise Exception(f"Fully AI-driven resource generation failed: {str(e)}")

app = Flask(__name__, static_folder='static')
CORS(app)
bot = EducationBot()

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/api/career-details', methods=['POST'])
def get_career_details():
    try:
        data = request.json
        if not data or 'career_title' not in data or 'section_type' not in data:
            return jsonify({'success': False, 'error': 'Career title and section type required'})
        
        career_title = data['career_title']
        section_type = data['section_type']
        user_profile = data.get('profile', {})
        
        content = bot.generate_detailed_content(career_title, section_type, user_profile)
        
        if content:
            return jsonify({'success': True, 'content': content})
        else:
            return jsonify({'success': False, 'error': 'AI content generation failed - system is fully AI-driven'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/career-recommendations', methods=['POST'])
def get_career_recommendations():
    try:
        data = request.json
        if not data or 'profile' not in data:
            return jsonify({'success': False, 'error': 'Profile data required'})
        
        careers = bot.generate_ai_careers(data['profile'])
        return jsonify({'success': True, 'careers': careers})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    if not data.get('username') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Username and password required'})
    
    return jsonify(bot.signup_user(data['username'], data['password']))

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data.get('username') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Username and password required'})
    
    return jsonify(bot.login_user(data['username'], data['password']))

@app.route('/api/generate-skill-resources', methods=['POST'])
def generate_skill_resources():
    try:
        data = request.json
        if not data or 'skill_name' not in data:
            return jsonify({'success': False, 'error': 'Skill name required for AI resource generation'})
        
        skill_name = data['skill_name']
        career_context = data.get('career_context', '')
        
        resource_data = bot.generate_skill_resources(skill_name, career_context)
        return jsonify({'success': True, 'resources': resource_data})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'Fully AI-driven resource generation failed: {str(e)}'})

@app.route('/logout', methods=['POST'])
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)