import panel as pn
import panel_material_ui as mui
from google import genai
import os
from dotenv import load_dotenv
import time 
import io
import re

import matplotlib
matplotlib.use('Agg')  
import matplotlib.pyplot as plt
import numpy as np

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

load_dotenv()

#=========================================================================
# CSS STYLING
#=========================================================================
global_style = """
body { background-color: #161E2E !important; margin: 0; padding: 20px; font-family: sans-serif; }
"""

transparent_css = """
textarea.bk-input {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #FFFFFF !important;
    font-size: 14px;
    width: 100% !important;
    box-sizing: border-box;
}
textarea.bk-input::placeholder { color: rgba(255, 255, 255, 0.4) !important; }
textarea.bk-input:focus { background-color: rgba(255, 255, 255, 0.1) !important; border-color: #38265C !important; }
"""

transparent_css_input = """
input.bk-input {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    color: #FFFFFF !important;
    font-size: 14px;
    width: 100% !important;
    box-sizing: border-box;
}
input.bk-input::placeholder { color: rgba(255, 255, 255, 0.4) !important; }
input.bk-input:focus { background-color: rgba(255, 255, 255, 0.1) !important; border-color: #38265C !important; }
"""

button_css = """
.bk-btn.bk-btn-primary, .pn-download a {
    background: linear-gradient(90deg, #38265C 0%, #1E3282 100%) !important;
    border: none !important;
    color: white !important;
    font-weight: bold !important;
    font-size: 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.2s ease-in-out !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
}
.bk-btn.bk-btn-primary:hover, .pn-download a:hover { opacity: 0.9 !important; transform: scale(1.02); }
"""

file_download = """
.bk-btn.bk-btn-default {
    background: linear-gradient(90deg, #38265C 0%, #1E3282 100%) !important;
    border: none !important;
    color: white !important;
    font-weight: bold !important;
    font-size: 16px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.2s ease-in-out !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
}
.bk-btn.bk-btn-default:hover { opacity: 0.9 !important; transform: scale(1.02); }
"""

def scroll_chat_to_bottom():
    js = """
    <script>
    setTimeout(() => {
        const containers = document.querySelectorAll(".chat-scroll");
        containers.forEach(c => { c.scrollTop = c.scrollHeight; });
    }, 50);
    </script>
    """
    chat.append(pn.pane.HTML(js, width=0, height=0))

pn.extension(raw_css=[global_style, button_css, file_download])

#=========================================================================
# AI INTEGRATION & CONTENT SANITIZATION
#=========================================================================
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

def ask_gemini(prompt_text):
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_text
        )
        output = response.text
        if "structure engineering" in output.lower():
            return "An error occurred with the response evaluation. Please try again after some time."
        return output
    except Exception as e:
        return "An error occurred while connecting to the assessment engine. Please try again after some time."

#=========================================================================
# STATE & ROUTING CONSTANTS
#=========================================================================
app_state = {"view": "dashboard"}
chat = pn.Column()

q_c = 0
interview_history = []
start_time = 0
end_time = 0
timer_callback = None
conversation_history = []
max_questions_limit = 15
compiled_ai_verdict = ""

current_adaptive_difficulty = "Easy"

#=========================================================================
# ENGINE UTILITIES
#=========================================================================
def get_current_phase_and_difficulty():
    global current_adaptive_difficulty
    if q_c < 5:
        phase = "Non Technical"
    elif q_c < 10:
        phase = "Technical"
    else:
        phase = "Resume Based"
        
    color_map = {"Easy": "#22c55e", "Medium": "#f59e0b", "Hard": "#ef4444", "Clarification Loop": "#3b82f6"}
    color = color_map.get(current_adaptive_difficulty, "#22c55e")
    
    return phase, current_adaptive_difficulty, color

def get_skill_average(skill_name):
    scores = [float(x["scores"][skill_name]) for x in interview_history if skill_name in x["scores"]]
    return round(sum(scores) / len(scores), 1) if scores else 0.0

def get_phase_average(phase_name):
    scores = []
    for x in interview_history:
        if x["phase"] == phase_name:
            turn_avg = sum(x["scores"].values()) / len(x["scores"])
            scores.append(turn_avg)
    return round(sum(scores) / len(scores), 1) if scores else 0.0

def get_authenticity_average():
    scores = [float(x["authenticity_metrics"]["score"]) for x in interview_history if "authenticity_metrics" in x]
    return round(sum(scores) / len(scores), 1) if scores else 100.0

def get_global_average():
    skills = ["Communication", "Problem Solving", "Technical Depth", "Confidence", "Resume Accuracy"]
    averages = [get_skill_average(s) for s in skills]
    return round(sum(averages) / len(averages), 1) if averages else 0.0

#=========================================================================
# MATPLOTLIB CHART GENERATORS (UI + PDF BUFFERS)
#=========================================================================
def generate_radar_chart(dark_mode=True):
    """Generates a closed radar/spider chart for the core skills vector."""
    skills = ["Communication", "Problem Solving", "Technical Depth", "Confidence", "Resume Accuracy"]
    values = [get_skill_average(s) for s in skills]
    
    num_vars = len(skills)
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    
    # Close the radar geometry loop
    values += values[:1]
    angles += angles[:1]
    
    fig, ax = plt.subplots(figsize=(4, 4), subplot_kw=dict(polar=True))
    
    if dark_mode:
        fig.patch.set_facecolor('#172230')
        ax.set_facecolor('#111827')
        ax.tick_params(colors='#94a3b8')
        ax.grid(color='#ffffff26')
    else:
        fig.patch.set_facecolor('#ffffff')
        ax.set_facecolor('#f8fafc')
        ax.tick_params(colors='#1e293b')
        ax.grid(color='#cbd5e1')
        
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)
    
    plt.xticks(angles[:-1], skills, fontsize=9)
    ax.set_rlabel_position(0)
    plt.yticks([2, 4, 6, 8, 10], ["2", "4", "6", "8", "10"], size=7)
    plt.ylim(0, 10)
    
    ax.plot(angles, values, color='#38bdf8', linewidth=2, linestyle='solid')
    ax.fill(angles, values, color='#38bdf8', alpha=0.25)
    
    plt.tight_layout()
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight', dpi=120)
    img_buf.seek(0)
    plt.close(fig)
    return img_buf

def generate_bar_chart(dark_mode=True):
    """Generates a phase performance comparison tracking speed metrics."""
    phases = ["Non Technical", "Technical", "Resume Based"]
    averages = [get_phase_average(p) for p in phases]
    
    fig, ax = plt.subplots(figsize=(4.2, 3.8))
    
    if dark_mode:
        fig.patch.set_facecolor('#172230')
        ax.set_facecolor('#111827')
        ax.tick_params(colors='#94a3b8')
        ax.xaxis.label.set_color('#94a3b8')
        ax.yaxis.label.set_color('#94a3b8')
        edge_color = 'none'
    else:
        fig.patch.set_facecolor('#ffffff')
        ax.set_facecolor('#ffffff')
        ax.tick_params(colors='#1e293b')
        edge_color = '#cbd5e1'

    bars = ax.bar(phases, averages, color=['#a855f7', '#3b82f6', '#10b981'], width=0.5, edgecolor=edge_color)
    ax.set_ylabel('Aggregated Composite Score', fontsize=10)
    ax.set_ylim(0, 10)
    
    # Grid modifications
    ax.yaxis.grid(True, linestyle='--', alpha=0.15 if dark_mode else 0.5)
    ax.set_axisbelow(True)
    
    # Hide the rectangular frame around the chart
    for spine in ['top', 'right', 'left', 'bottom']:
        ax.spines[spine].set_visible(False)
        
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),  
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=9, color='#ffffff' if dark_mode else '#000000', weight='bold')

    plt.tight_layout()
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png', facecolor=fig.get_facecolor(), bbox_inches='tight', dpi=120)
    img_buf.seek(0)
    plt.close(fig)
    return img_buf

#=========================================================================
# DYNAMIC ENGINE PROMPTS
#=========================================================================
def get_next_question_prompt(resume, jd):
    phase, difficulty, _ = get_current_phase_and_difficulty()
    past_questions = [x["question"] for x in interview_history if x["phase"] == phase]
    past_questions_str = "\n".join([f"- {q}" for q in past_questions]) if past_questions else "None"

    if phase == "Non Technical":
        phase_directive = """
- Non Technical / HR: Focus completely and exclusively on communication, leadership, behavioural traits, workplace dynamics, and cultural fit.
- STRICT CRITICAL BOUNDARY: Do NOT look at, reference, or ask questions based on the Job Description or the Resume. Do not ask any technical or programming questions.
"""
    elif phase == "Technical":
        phase_directive = f"""
- Technical Round: Evaluate core technical knowledge, concepts, frameworks, and architecture patterns.
- BASE INPUT CONTEXT: Job Description: {jd} and specific core skills mentioned in the Resume: {resume}.
- STRICT CRITICAL BOUNDARY: Do NOT ask about specific projects, previous companies, or individual work experiences documented on the resume. Keep questions focused solely on core technical and conceptual validation of those skills.
"""
    else:
        phase_directive = f"""
- Resume Based Validation: Target the candidate's core architectural layout decisions, project code bases, validation of work, and personal experience claims.
- BASE INPUT CONTEXT: Candidate's Resume: {resume}.
- STRICT CRITICAL BOUNDARY: Questions must directly challenge project authenticity, implementation difficulties, and real experiences. Avoid generic technical quiz patterns.
"""

    base_prompt = f"""
You are J.A.R.V.I.S., an expert professional recruiter and background verification analyst. You must strictly construct ONLY ONE next question.

CURRENT INTERVIEW STATUS:
- Phase: {phase}
- Requested Adaptive Engine Framework Focus: {difficulty}

PHASE INSTRUCTIONS:
{phase_directive}

 SMART ADAPTIVE INTERVIEWER BRANCH LOGIC:
Evaluate the user's last response. Look at the context of the interview. 
- If the requested focus is 'Clarification Loop', your task is to step back. Formulate an easier clarification question or explicitly say something like: “Can you explain that in simpler terms?” or challenge them to clarify their weak foundation.
- If the requested focus is 'Hard', formulate a rigorous, challenging question that checks the absolute boundaries of their knowledge.
- Otherwise, create a question suited to a standard '{difficulty}' target depth.

CRITICAL ANTI-REPETITION DIRECTIVE:
Review the list of questions already asked in this round below. Do NOT ask the same question or touch upon the same specific sub-topic again. You must introduce a fresh topic variation matching the current focus:
ALREADY ASKED QUESTIONS:
{past_questions_str}

BACKGROUND VERIFICATION & AUTHENTICITY DETECTION:
Analyze the candidate's response against their claims. Check if the candidate is exaggerating, sounds inconsistent with the resume details provided, or introduces conceptual contradictions.

OUTPUT ARCHITECTURE RULES:
Output your response exactly using the explicit uppercase tags specified below. Do not mix or combine sections.

Output Format:
REMARK: (Brief assessment statement evaluating the answer)
COMMUNICATION_SCORE: (An integer or float from 1 to 10)
PROBLEM_SOLVING_SCORE: (An integer or float from 1 to 10)
TECHNICAL_DEPTH_SCORE: (An integer or float from 1 to 10)
CONFIDENCE_SCORE: (An integer or float from 1 to 10)
RESUME_ACCURACY_SCORE: (An integer or float from 1 to 10)
AUTHENTICITY_PERCENTAGE: (An integer or float from 1 to 100 representing how genuine or real the answers sound relative to the resume claims)
AUTHENTICITY_REASON: (A summary sentence justifying the authenticity score)
AUTHENTICITY_RISK: (Identify any exaggeration, structural gap, or explicit contradiction. Write 'None detected' if flawless.)
WHAT WORKED: (Bullet points of strengths)
WHAT TO IMPROVE: (Bullet points of corrections)
REVISED VERSION OF CANDIDATE ANSWER: (A polished professional version)
NEXT QUESTION: (Exactly one question built using the smart adaptive branching rules above, ensuring absolutely no repetition with the list of past questions)
"""
    return base_prompt

def get_initial_interview_prompt(resume, jd):
    return """
You are J.A.R.V.I.S — an expert interviewer initializing a structured evaluation.
Your target is to ask Question 1 belonging entirely to Phase 1: Non Technical at an Easy difficulty level.

STRICT CRITICAL BOUNDARY: Focus exclusively on foundational behavioral or communication dynamics. Do NOT ask questions based on the Job Description or technical skills from the resume yet.

OUTPUT FORMAT:
Only output the question. No extra text, numbering, or surrounding markdown code tags.
"""

def generate_ai_verdict():
    global compiled_ai_verdict, interview_history
    if not interview_history:
        compiled_ai_verdict = "No explicit response data evaluated to build deep recruitment analytics metrics."
        return

    history_payload = ""
    for idx, log in enumerate(interview_history, 1):
        history_payload += f"Q{idx} [{log['phase']}]: {log['question']}\nCandidate Answer: {log['answer']}\nMetrics -> Comm: {log['scores']['Communication']}, Prob: {log['scores']['Problem Solving']}, Tech: {log['scores']['Technical Depth']}, Conf: {log['scores']['Confidence']}, Resume: {log['scores']['Resume Accuracy']}, Authenticity: {log['authenticity_metrics']['score']}%\nRisk Profile: {log['authenticity_metrics']['risk']}\n\n"

    verdict_prompt = f"""
You are an elite Lead Executive Recruiting System and background integrity analyst analyzing a complete interview dataset transcript.
Based on the full timeline data below, build a definitive global review. Pay extreme attention to the verification consistency and integrity vectors.

TRANSCRIPT TIMELINE DATA SET:
{history_payload}

OUTPUT FORMAT COMPLIANCE:
Structure your response output systematically with clean, highly distinct Markdown components matching the template exactly:

###  Executive Summary
(Provide a comprehensive 3-4 sentence high-level overview of the candidate's core communication efficacy, speed of thought, domain confidence, and technical architecture familiarity.)

###  Hiring Decision
**Status:** [Select only one: Strong Hire / Conditional Hire / No Hire]
**Rationale:** (A clear business reason justifying the status choice)

###  AI Background Integrity & Authenticity Analysis
**Global Authenticity Rating:** [Compute aggregate percentage]%
**Verification Insights:** (Detailed analysis explaining if the candidate is exaggerating, matching resume statements perfectly, or showing critical engineering contradictions)
**Risk Gaps:** (Document explicit contradictions or implementation holes flagged across the entire discussion)

###  Strengths & Weaknesses
* **Key Strength:** (Detailed bullet point)
* **Key Strength:** (Detailed bullet point)
* **Observed Gaps:** (Bullet mapping exact missing logic or conceptual gaps)
* **Observed Gaps:** (Bullet mapping exact missing logic or conceptual gaps)

###  Skill-Wise Matrix Overview
* **Communication:** Summary analytical performance statement
* **Problem Solving:** Summary analytical performance statement
* **Technical Depth:** Summary analytical performance statement
* **Confidence:** Summary analytical performance statement
* **Resume Accuracy:** Summary analytical performance statement

###  Final Recruiter Verdict
(A definitive, authoritative summary sentence explaining whether this candidate should advance to direct team sync stages or internal pipelines.)
"""
    compiled_ai_verdict = ask_gemini(verdict_prompt)

#=========================================================================
# REPORT LAB PDF GENERATION (WITH GRAPHICAL PLOT INCLUSION)
#=========================================================================
def generate_pdf_report():
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=(612, 792), rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=22, leading=26, textColor=colors.HexColor('#1E3282'), alignment=1)
    h2_style = ParagraphStyle('SectionHeader', parent=styles['Heading2'], fontSize=13, leading=16, textColor=colors.HexColor('#38265C'), spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle('CustomBody', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#1e293b'))
    verdict_md_style = ParagraphStyle('VerdictBody', parent=styles['Normal'], fontSize=9.5, leading=13.5, textColor=colors.HexColor('#0f172a'))

    story = []
    
    story.append(Paragraph("J.A.R.V.I.S AI Executive Recruitment Report", title_style))
    story.append(Spacer(1, 15))
    
    avg_score = get_global_average()
    verdict = "Recommended" if avg_score >= 7.5 else "Recommended with Gaps" if avg_score >= 5.5 else "Not Recommended"
    
    summary_data = [
        [Paragraph("<b>ATS Skill Vector Matrix</b>", body_style), Paragraph("<b>Rolling Score Metric</b>", body_style)],
        [Paragraph("Global Composite Average", body_style), Paragraph(f"<b>{avg_score} / 10</b>", body_style)],
        [Paragraph("System Assessment Status", body_style), Paragraph(f"<b>{verdict}</b>", body_style)],
        [Paragraph("Communication Metric", body_style), Paragraph(f"{get_skill_average('Communication')}/10", body_style)],
        [Paragraph("Problem Solving Metric", body_style), Paragraph(f"{get_skill_average('Problem Solving')}/10", body_style)],
        [Paragraph("Technical Depth Metric", body_style), Paragraph(f"{get_skill_average('Technical Depth')}/10", body_style)],
        [Paragraph("Confidence Metric", body_style), Paragraph(f"{get_skill_average('Confidence')}/10", body_style)],
        [Paragraph("Resume Accuracy Metric", body_style), Paragraph(f"{get_skill_average('Resume Accuracy')}/10", body_style)],
        [Paragraph("<b>Resume Authenticity Check</b>", body_style), Paragraph(f"<b>{get_authenticity_average()}% Genuineness</b>", body_style)]
    ]
    
    summary_table = Table(summary_data, colWidths=[230, 270])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1'))
    ]))
    
    story.append(Paragraph("ATS Core Capabilities Score Breakdown", h2_style))
    story.append(summary_table)
    story.append(Spacer(1, 15))
    
    # Append the Generated Data Visualizations inside the PDF Structure
    story.append(Paragraph("Visual Performance Metrics", h2_style))
    try:
        radar_buf = generate_radar_chart(dark_mode=False)
        bar_buf = generate_bar_chart(dark_mode=False)
        
        chart_table_data = [
            [Image(radar_buf, width=220, height=220), Image(bar_buf, width=230, height=210)]
        ]
        chart_table = Table(chart_table_data, colWidths=[250, 250])
        chart_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        story.append(chart_table)
    except Exception as e:
        story.append(Paragraph(f"Visual dashboard generation skipped: {str(e)}", body_style))
    
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("AI Recruiter Final Verdict & Deep Analysis", h2_style))
    clean_verdict_html = compiled_ai_verdict.replace("\n", "<br/>")
    story.append(Paragraph(clean_verdict_html, verdict_md_style))
    story.append(Spacer(1, 15))

    story.append(Paragraph("Detailed Question Log Review", h2_style))
    for i, item in enumerate(interview_history, start=1):
        q_text = f"<b>Q{i} [{item['phase']}]: {item['question']}</b>"
        story.append(Paragraph(q_text, body_style))
        story.append(Spacer(1, 3))
        
        detail_text = f"""
        <b>Candidate Answer:</b> {item['answer']}<br/>
        <b>Turn Vector Scores:</b> Comm: {item['scores']['Communication']} | Prob: {item['scores']['Problem Solving']} | Tech: {item['scores']['Technical Depth']} | Conf: {item['scores']['Confidence']} | Resume: {item['scores']['Resume Accuracy']}<br/>
        <b>Verification Layer:</b> Authenticity: {item['authenticity_metrics']['score']}% | Risk: {item['authenticity_metrics']['risk']}<br/>
        <b>Remark:</b> {item['remark']}<br/>
        <b>AI Revised Baseline:</b> {item.get('revised_answer', 'N/A')}
        """
        story.append(Paragraph(detail_text, body_style))
        story.append(Spacer(1, 8))
        
    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer

#=========================================================================
# GLOBAL WIDGETS
#=========================================================================
resume_box = pn.widgets.TextAreaInput(placeholder="Copy Paste Your Resume Content", height=110, stylesheets=[transparent_css], sizing_mode="stretch_width")
jd_box = pn.widgets.TextAreaInput(placeholder="Copy Paste Your job Description Content", height=110, stylesheets=[transparent_css], sizing_mode="stretch_width")

input_box = pn.widgets.TextInput(placeholder="Enter your Answer and press Enter...", stylesheets=[transparent_css_input], sizing_mode="stretch_width")
btn = pn.widgets.Button(name="Send", button_type="primary", height=45, width=120)
stop_btn = pn.widgets.Button(name="Stop Interview", button_type="primary", height=45, width=140)
progress_bar = pn.indicators.Progress(name='Processing Tasks', value=0, max=100, bar_color='success', width=240)

difficulty_text = pn.pane.HTML('')
skill_matrix_display = pn.pane.HTML('')
time_text = pn.pane.HTML('')

def update_sidebar():
    global start_time, q_c
    phase, difficulty, color = get_current_phase_and_difficulty()
        
    difficulty_text.object = f'<p style="background:{color}; padding:6px 14px; border-radius:20px; display:inline-block; color:white; font-weight:bold; margin:0;">{difficulty} ({phase})</p>'
    progress_bar.value = int((q_c / max_questions_limit) * 100)
    
    skill_matrix_display.object = f"""
    <div style="color: white; line-height: 1.6; font-size: 14px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Communication:</span><b style="color:#60A5FA;">{get_skill_average('Communication')}/10</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Problem Solving:</span><b style="color:#60A5FA;">{get_skill_average('Problem Solving')}/10</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Technical Depth:</span><b style="color:#60A5FA;">{get_skill_average('Technical Depth')}/10</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Confidence:</span><b style="color:#60A5FA;">{get_skill_average('Confidence')}/10</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Resume Accuracy:</span><b style="color:#60A5FA;">{get_skill_average('Resume Accuracy')}/10</b></div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.15); padding-top:4px; margin-top:4px;"><span>Authenticity Layer:</span><b style="color:#10B981;">{get_authenticity_average()}%</b></div>
    </div>
    """
        
    if start_time > 0:
        elapsed = int(time.time() - start_time)
        mins, secs = elapsed // 60, elapsed % 60
        time_text.object = f'<p style="font-size:18px; font-weight:bold; color:white; margin:0;">{mins:02}:{secs:02}</p>'

#=========================================================================
# UI LAYOUT BUILDERS
#=========================================================================
def create_header():
    return pn.pane.HTML("""<div style="background: linear-gradient(90deg,#38265C 0%,#3D2F74 25%,#2C2F79 50%,#263281 75%,#1E3282 100%); box-sizing: border-box; color: white; padding: 20px; text-align: center; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="font-size: 32px; margin: 0;">🤖</h1>
            <h1 style="margin: 5px 0 0 0; font-size: 26px; letter-spacing: 1px;">J.A.R.V.I.S</h1>
            <h3 style="margin: 5px 0; font-weight: 400; opacity: 0.9; font-size: 18px;">AI Structured Interview Coach</h3>
        </div>""", sizing_mode="stretch_width")

def create_instruction_card():
    return pn.pane.HTML("""<div style="background-color: #1F2A38; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; color: white; height: 100%; box-sizing: border-box;">
            <h3 style="margin-top: 0; color: #FFFFFF; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; font-size: 18px;">Evaluation Architecture</h3>
            <ul style="padding-left: 20px; line-height: 1.6; margin-bottom: 0; color: #E5E7EB; font-size: 14px;">
                <li><b>Phase 1:</b> Non-Technical (Q1-Q5)</li>
                <li><b>Phase 2:</b> Technical Foundations (Q6-Q10)</li>
                <li><b>Phase 3:</b> Resume Project Parsing (Q11-Q15)</li>
                <li>ATS Multi-Dimensional Skill Vector Extraction Engine</li>
                <li> <b>AI Integrity Background Verification Layer Enabled</b></li>
                <li> <b>Industry-Grade Visual Chart Metrics Added</b></li>
            </ul>
        </div>""", sizing_mode="stretch_width")

def user_details():
    card_title = pn.pane.HTML("<h3 style='color: #FFFFFF; margin: 0 0 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; font-size: 18px;'>👤 Setup Profiles</h3>", sizing_mode="stretch_width")
    resume_title = pn.pane.HTML("<h4 style='color: #9CA3AF; margin: 0 0 6px 0; font-size: 14px;'>Enter Resume Details (text)</h4>", sizing_mode="stretch_width")
    jd_title = pn.pane.HTML("<h4 style='color: #9CA3AF; margin: 12px 0 6px 0; font-size: 14px;'>Paste Job Description</h4>", sizing_mode="stretch_width")
    
    return pn.Column(
        card_title, resume_title, resume_box, jd_title, jd_box, 
        sizing_mode="stretch_width",
        styles={"background-color": "#1F2A38", "padding": "20px", "border": "1px solid rgba(255,255,255,0.1)", "border-radius": "12px", "box-sizing": "border-box"}
    )

def create_sidebar_layout():
    role = pn.pane.HTML('<div style="color:white"><h3 style="color:#9CA3AF; margin-top:0;">Evaluation Model</h3><p style="font-size:18px;font-weight:bold; margin-bottom:15px;">Target Framework Engine</p><h3 style="color:#9CA3AF; margin-top:0; margin-bottom:8px;">Progress</h3></div>')
    other = pn.Column(
        pn.pane.HTML('<h3 style="color:#9CA3AF; margin-bottom:8px;">Section Difficulty</h3>'), difficulty_text,
        pn.pane.HTML('<h3 style="color:#9CA3AF; margin-top:12px; margin-bottom:8px;">ATS Rolling Competencies</h3>'), skill_matrix_display,
        pn.pane.HTML('<h3 style="color:#9CA3AF; margin-top:12px; margin-bottom:8px;">Time Tracked</h3>'), time_text,
        margin=0
    )
    return pn.Column(role, progress_bar, other, width=280, styles={"background": "#1F2A38", "padding": "20px", "border-radius": "12px", "border": "1px solid rgba(255,255,255,0.1)"})

def create_assistant_message(text):
    return pn.pane.HTML(f'<div style="width: 100%; text-align: left; margin: 10px 0; box-sizing: border-box;"><div style="color:#9CA3AF; font-size:12px; margin-bottom:4px; padding-left: 5px;">🤖 J.A.R.V.I.S</div><div style="background:#1F2A38; color:white; padding:14px 18px; border-radius:12px; display:inline-block; max-width:75%; line-height: 1.5; font-size: 15px; border: 1px solid rgba(255,255,255,0.05);">{text}</div></div>', sizing_mode="stretch_width")

def create_candidate_message(text):
    return pn.pane.HTML(f'<div style="width: 100%; text-align: right; margin: 10px 0; box-sizing: border-box;"><div style="color:#9CA3AF; font-size:12px; margin-bottom:4px; padding-right: 5px;">👤 Candidate</div><div style="background:#263281; color:white; padding:14px 18px; border-radius:12px; display:inline-block; max-width:75%; text-align: left; line-height: 1.5; font-size: 15px;">{text}</div></div>', sizing_mode="stretch_width")

def create_feedback_card(text):
    """Refines the text-heavy AI evaluation block into a beautifully structured, 
    highly readable markdown card with clear, highlighted section headers.
    """
    # Clean up raw engine tags into crisp, user-friendly highlighted headers
    refined_text = text
    refined_text = refined_text.replace("REMARK:", "###  J.A.R.V.I.S Evaluation Remark\n")
    refined_text = refined_text.replace("AUTHENTICITY_REASON:", "\n** Authenticity Justification:**")
    refined_text = refined_text.replace("AUTHENTICITY_RISK:", "\n**Detected Integrity Risks:**")
    refined_text = refined_text.replace("WHAT WORKED:", "\n---\n### What Worked Well")
    refined_text = refined_text.replace("WHAT TO IMPROVE:", "\n---\n###  Areas to Improve")
    refined_text = refined_text.replace("REVISED VERSION OF CANDIDATE ANSWER:", "\n---\n###  Recommended Professional Polish\n>")

    # Strip out the raw score lines since they are already elegantly shown in the sidebar dashboard
    refined_text = re.sub(r"[A-Z_]+_SCORE:\s*[\d\.]+", "", refined_text)
    refined_text = re.sub(r"AUTHENTICITY_PERCENTAGE:\s*[\d\.]+", "", refined_text)
    
    # Clean up double line breaks for tighter spacing
    refined_text = re.sub(r'\n\s*\n', '\n\n', refined_text).strip()

    markdown_content = pn.pane.Markdown(
        refined_text, 
        sizing_mode="stretch_width", 
        styles={"color": "#E5E7EB", "font-size": "15px", "line-height": "1.6"}
    )
    
    return pn.Column(
        pn.pane.HTML("""
            <div style="width: 100%; text-align: left; margin-top: 12px; box-sizing: border-box;">
                <div style="background: #0F172A; padding: 16px 20px 0 20px; border-top-left-radius: 12px; border-top-right-radius: 12px; border-left: 5px solid #3b82f6; max-width: 85%; box-sizing: border-box;">
                    <div style="font-weight: bold; color: #60A5FA; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Live Evaluation Breakdown</div>
                </div>
            </div>
        """, sizing_mode="stretch_width"),
        pn.Row(
            markdown_content, 
            sizing_mode="stretch_width", 
            styles={"background": "#0F172A", "padding": "0px 20px 16px 25px", "border-bottom-left-radius": "12px", "border-bottom-right-radius": "12px", "border-left": "5px solid #3b82f6", "max-width": "85%", "box-sizing": "border-box"}
        ),
        margin=0, sizing_mode="stretch_width"
    )

def create_thinking_indicator():
    return pn.pane.HTML("""<div style="width: 100%; text-align: left; margin: 10px 0; box-sizing: border-box;"><div style="color:#9CA3AF; font-size:12px; margin-bottom:4px; padding-left: 5px;">🤖 Assistant</div><div style="background:#1F2A38; color:#9CA3AF; padding:14px 18px; border-radius:12px; display:inline-flex; align-items:center; gap:8px; max-width:75%; font-size: 14px; border: 1px solid rgba(255,255,255,0.05); font-style: italic;"><div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #60A5FA; border-radius: 50%; animation: spin 0.8s linear infinite;"></div><span>⚡ Running adaptive interview branching & scoring parameters...</span></div></div><style>@keyframes spin { to { transform: rotate(360deg); } }</style>""", sizing_mode="stretch_width")

def create_input_area():
    return pn.Row(input_box, btn, stop_btn, sizing_mode="stretch_width", styles={"padding": "10px", "background": "#0B1220", "border-radius": "10px", "margin-top": "10px", "gap": "10px"})

#=========================================================================
# CALLBACK ENGINE LOGIC
#=========================================================================
def handle_stop_interview(event):
    global end_time, timer_callback
    
    end_time = time.time()
    if timer_callback:
        timer_callback.stop()

    if not interview_history:
        go_to_dashboard()
        return

    main.clear()
    main.append(
        pn.Column(
            header,
            pn.pane.HTML("<div style='color: #60A5FA; font-size: 16px; font-weight: bold; margin-bottom: 15px;'> Consolidating final interview history data & generating ATS analytics...</div>"),
            pn.Row(download_btn, continue_btn, restart_btn, styles={"gap": "15px", "margin-top": "20px"})
        )
    )
    
    generate_ai_verdict()
    
    main.clear()
    main.append(
        pn.Column(
            header,
            create_final_report(),
            pn.Row(download_btn, continue_btn, restart_btn, styles={"gap": "15px", "margin-top": "20px"})
        )
    )

def send_answer(event):
    global q_c, end_time, conversation_history, max_questions_limit, current_adaptive_difficulty

    if hasattr(event, 'new'):
        answer = event.new.strip()
    else:
        answer = input_box.value.strip()
        
    if not answer:
        return

    input_box.value = ""
    input_box.disabled = True
    btn.disabled = True

    chat.append(create_candidate_message(answer))
    thinking_indicator = create_thinking_indicator()
    chat.append(thinking_indicator)
    scroll_chat_to_bottom()

    current_phase, _, _ = get_current_phase_and_difficulty()
    active_question_text = conversation_history[-1]["content"] if conversation_history else "Introductory Question"

    conversation_history.append({"role": "user", "content": answer})

    r_val = resume_box.value if resume_box.value else "Not Provided"
    j_val = jd_box.value if jd_box.value else "Not Provided"
    
    engine_prompt = get_next_question_prompt(r_val, j_val)
    execution_context = [{"role": "system", "content": engine_prompt}] + conversation_history[-2:]
    response = ask_gemini(str(execution_context))

    if thinking_indicator in chat.objects:
        chat.remove(thinking_indicator)

    if "try again after some time" in response:
        chat.append(create_assistant_message(response))
        scroll_chat_to_bottom()
        input_box.disabled = False
        btn.disabled = False
        return

    def extract_score(pattern, text, default=7.0):
        m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        try: return float(m.group(1)) if m else default
        except: return default

    def extract_string(pattern, text, default="N/A"):
        m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        return m.group(1).strip() if m else default

    s_comm = extract_score(r"COMMUNICATION_SCORE:\s*([\d\.]+)", response)
    s_prob = extract_score(r"PROBLEM_SOLVING_SCORE:\s*([\d\.]+)", response)
    s_tech = extract_score(r"TECHNICAL_DEPTH_SCORE:\s*([\d\.]+)", response)
    s_conf = extract_score(r"CONFIDENCE_SCORE:\s*([\d\.]+)", response)
    s_res  = extract_score(r"RESUME_ACCURACY_SCORE:\s*([\d\.]+)", response)
    
    auth_pct = extract_score(r"AUTHENTICITY_PERCENTAGE:\s*([\d\.]+)", response, default=100.0)
    auth_reason = extract_string(r"AUTHENTICITY_REASON:\s*(.*?)\s*(?=AUTHENTICITY_RISK:|$)", response)
    auth_risk = extract_string(r"AUTHENTICITY_RISK:\s*(.*?)\s*(?=WHAT WORKED:|$)", response)

    revised_search = re.search(r"REVISED VERSION OF CANDIDATE ANSWER:\s*(.*?)\s*(?=NEXT QUESTION:|$)", response, re.IGNORECASE | re.DOTALL)
    extracted_revision = revised_search.group(1).strip() if revised_search else "N/A"

    remark_search = re.search(r"REMARK:\s*(.*?)\s*(?=COMMUNICATION_SCORE:|$)", response, re.IGNORECASE | re.DOTALL)
    extracted_remark = remark_search.group(1).strip() if remark_search else "Processed successfully"

    interview_history.append({
        "phase": current_phase,
        "question": active_question_text,
        "answer": answer,
        "remark": extracted_remark,
        "revised_answer": extracted_revision,
        "scores": {
            "Communication": s_comm,
            "Problem Solving": s_prob,
            "Technical Depth": s_tech,
            "Confidence": s_conf,
            "Resume Accuracy": s_res
        },
        "authenticity_metrics": {
            "score": auth_pct,
            "reason": auth_reason,
            "risk": auth_risk
        }
    })

    # Adaptive routing branching checks
    turn_composite = (s_comm + s_prob + s_tech) / 3.0
    if turn_composite < 5.0:
        current_adaptive_difficulty = "Clarification Loop"
    elif turn_composite >= 8.2:
        current_adaptive_difficulty = "Hard"
    else:
        current_adaptive_difficulty = "Medium"

    next_q = ""
    feedback_display = response
    match = re.search(r"NEXT QUESTION:\s*(.*)", response, re.IGNORECASE | re.DOTALL)

    if match:
        next_q = match.group(1).strip()
        feedback_display = re.sub(r"NEXT QUESTION:.*", "", response, flags=re.IGNORECASE | re.DOTALL).strip()
    else:
        next_q = "Could you expand on your statement in simpler architectural terms?"

    chat.append(create_feedback_card(feedback_display))
    chat.append(create_assistant_message(next_q))
    scroll_chat_to_bottom()

    conversation_history.append({"role": "assistant", "content": next_q})

    q_c += 1
    update_sidebar()

    input_box.disabled = False
    btn.disabled = False

    if q_c >= max_questions_limit:
        end_time = time.time()
        if timer_callback:
            timer_callback.stop()

        main.clear()
        main.append(
            pn.Column(
                header,
                pn.pane.HTML("<div style='color: #60A5FA; font-size: 16px; font-weight: bold; margin-bottom: 15px;'> Complete limit reached. Assembling strategic hiring report metrics...</div>"),
                pn.Row(download_btn, continue_btn, restart_btn, styles={"gap": "15px", "margin-top": "20px"})
            )
        )
        
        generate_ai_verdict()
        
        main.clear()
        main.append(
            pn.Column(
                header,
                create_final_report(),
                pn.Row(download_btn, continue_btn, restart_btn, styles={"gap": "15px", "margin-top": "20px"})
            )
        )

#=========================================================================
# INTERVIEW SECTIONS EXTENSION ROUTINE
#=========================================================================
def continue_interview(event):
    global max_questions_limit, timer_callback
    max_questions_limit += 5 
    main.clear()
    main.append(build_interview())
    timer_callback = pn.state.add_periodic_callback(update_sidebar, period=1000)
    update_sidebar()
    scroll_chat_to_bottom()

#=========================================================================
# NAVIGATION & FLOW MANAGEMENT
#=========================================================================
def go_to_interview(event=None):
    global q_c, start_time, timer_callback, conversation_history, max_questions_limit, current_adaptive_difficulty
    start_button.disabled = True
    
    q_c = 0
    max_questions_limit = 15
    current_adaptive_difficulty = "Easy"
    interview_history.clear()
    chat.clear()
    conversation_history.clear()
    
    main.clear()
    main.append(build_interview())
    
    init_loader = pn.pane.HTML("""<div style='width: 100%; text-align: left; margin: 10px 0;'><div style='background:#1F2A38; color:#cbd5e1; padding:14px 18px; border-radius:12px; display:inline-flex; align-items:center; gap:8px;'><span> J.A.R.V.I.S is assembling phase matrix lines...</span></div></div>""", sizing_mode="stretch_width")
    chat.append(init_loader)
    
    r_val = resume_box.value if resume_box.value else "Not Provided"
    j_val = jd_box.value if jd_box.value else "Not Provided"
    
    init_prompt = get_initial_interview_prompt(r_val, j_val)
    first_question = ask_gemini(init_prompt)    
    
    if init_loader in chat.objects:
        chat.remove(init_loader)
        
    chat.append(create_assistant_message(first_question))
    scroll_chat_to_bottom()
    conversation_history.append({"role": "assistant", "content": first_question})
    
    start_time = time.time()
    update_sidebar()
    timer_callback = pn.state.add_periodic_callback(update_sidebar, period=1000)
    start_button.disabled = False

def go_to_dashboard(event=None):
    main.clear()
    main.append(build_dashboard())

#=========================================================================
# FINAL REPORT ANALYTICS TEMPLATE (WITH ATS GRAPHICAL DASHBOARD DISPLAY)
#=========================================================================
def create_final_report():
    global start_time, end_time, compiled_ai_verdict
    total_seconds = int(end_time - start_time) if end_time > start_time else 0
    time_taken = f"{total_seconds // 60}m {total_seconds % 60}s"
    
    avg_score = get_global_average()
    recommendation, stars = ("Strong Hire", "⭐⭐⭐⭐⭐") if avg_score >= 8 else (("Conditional Hire", "⭐⭐⭐⭐") if avg_score >= 6 else ("No Hire", "⭐⭐"))
    
    custom_card_style = "background:#172230; border:1px solid #233349; border-radius:16px; padding:24px; color:#f8fafc; font-family:sans-serif; height:100%; box-sizing:border-box; display:flex; flex-direction:column;"
    
    score_card = pn.pane.HTML(f'<div style="{custom_card_style} justify-content: center; align-items: center; text-align: center;"><div style="font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 12px;"> COMPOSITE RATING</div><div style="font-size: 48px; font-weight: 800; color: #38bdf8;">{avg_score}<span style="font-size: 18px; color: #64748b;">/10</span></div></div>', sizing_mode="stretch_both")
    
    area_card = pn.pane.HTML(f"""
    <div style="{custom_card_style} justify-content: space-between;">
        <div style="font-size: 13px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 8px;">ATS SKILL VECTOR LOGIC</div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 2px;"><span>Communication:</span><b>{get_skill_average('Communication')}</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 2px;"><span>Problem Solving:</span><b>{get_skill_average('Problem Solving')}</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 2px;"><span>Technical Depth:</span><b>{get_skill_average('Technical Depth')}</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 2px;"><span>Confidence:</span><b>{get_skill_average('Confidence')}</b></div>
        <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>Resume Accuracy:</span><b>{get_skill_average('Resume Accuracy')}</b></div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.15); padding-top:4px; color: #10B981;"><span>AI Authenticity Metric:</span><b>{get_authenticity_average()}%</b></div>
    </div>
    """, sizing_mode="stretch_both")
    
    mid_card = pn.pane.HTML(f'<div style="{custom_card_style}"><div style="font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">ATS System Logic Verdict</div><div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">{recommendation}</div><div style="color: #fbbf24; font-size: 18px;">{stars}</div></div>', sizing_mode="stretch_width")
    stats_card = pn.pane.HTML(f'<div style="{custom_card_style}"><div style="display: flex; justify-content: space-between;"><div>QUESTIONS COMPLETED: <b>{len(interview_history)}</b></div><div>TOTAL DURATION: <b>{time_taken}</b></div></div></div>', sizing_mode="stretch_width")
    
    # Render Dashboard Matplotlib charts inside the active UI view layer
    radar_chart_pane = pn.pane.PNG(generate_radar_chart(dark_mode=True), width=340, align='center')
    bar_chart_pane = pn.pane.PNG(generate_bar_chart(dark_mode=True), width=340, align='center')
    
    visual_dashboard_row = pn.Row(
        radar_chart_pane, bar_chart_pane, 
        sizing_mode="stretch_width", 
        styles={"background": "#172230", "padding": "15px", "border-radius": "16px", "justify-content": "space-around"}
    )
    
    ai_dossier_pane = pn.pane.Markdown(
        compiled_ai_verdict, 
        sizing_mode="stretch_width",
        styles={"background": "#0F172A", "padding": "24px", "border-radius": "16px", "border-left": "6px solid #1E3282", "color": "#E2E8F0"}
    )

    grid = pn.GridSpec(ncols=2, nrows=1, height=200, sizing_mode="stretch_width")
    grid[0, 0] = score_card
    grid[0, 1] = area_card
    
    return pn.Column(
        grid, 
        pn.layout.Spacer(height=12), 
        mid_card, 
        pn.layout.Spacer(height=12), 
        stats_card, 
        pn.layout.Spacer(height=16),
        pn.pane.HTML("<h2 style='color:#FFFFFF; margin:5px 0;'>Performance Distribution Dashboards</h2>"),
        visual_dashboard_row,
        pn.layout.Spacer(height=16),
        pn.pane.HTML("<h2 style='color:#FFFFFF; margin:5px 0;'> Executive Assessment Dossier</h2>"),
        ai_dossier_pane,
        sizing_mode="stretch_width"
    )

#=========================================================================
# INTERFACE SETUP & ATTACHMENT BINDINGS
#=========================================================================
header = create_header()
card = create_instruction_card()
details = user_details()

sidebar_container = pn.Column(create_sidebar_layout())

chat_container = pn.Column(
    chat, height=500, scroll=True, css_classes=["chat-scroll"], sizing_mode="stretch_width",
    styles={"background": "#111827", "padding": "15px", "border-radius": "12px"}
)
card_details = pn.Row(card, details, sizing_mode="stretch_width", height=440, styles={'gap': '20px'})
input_area = create_input_area()

input_box.param.watch(send_answer, 'value')

start_button = pn.widgets.Button(name="Start Interview", button_type="primary", height=50, width=250)
start_button.on_click(go_to_interview)

restart_btn = pn.widgets.Button(name="Restart Dashboard", button_type="primary", height=45, width=160)
restart_btn.on_click(go_to_dashboard)

continue_btn = pn.widgets.Button(name="Continue Interview", button_type="primary", height=45, width=160)
continue_btn.on_click(continue_interview)

download_btn = pn.widgets.FileDownload(
    filename="Interview_Report.pdf", callback=generate_pdf_report,
    button_type="primary", label="Download PDF", height=45, width=160, embed=False
)
button_container = pn.Row(pn.Spacer(), start_button, sizing_mode="stretch_width", margin=(25, 0))
btn.on_click(send_answer)
stop_btn.on_click(handle_stop_interview)

def build_dashboard():
    return pn.Column(header, card_details, button_container, sizing_mode="stretch_width", max_width=1200)

def build_interview():
    return pn.Column(header, pn.Row(sidebar_container, pn.Column(chat_container, input_area, sizing_mode="stretch_width"), sizing_mode="stretch_width", styles={"gap": "20px"}), sizing_mode="stretch_width", max_width=1200)

main = pn.Column(build_dashboard())
main.servable()
