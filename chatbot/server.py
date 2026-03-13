"""
TSH Chatbot API Server
Proxies chat requests to Claude API with TSH-specific system prompt.
Run: ANTHROPIC_API_KEY=sk-ant-... python3 chatbot/server.py
"""
import os, json, datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from anthropic import Anthropic

app = Flask(__name__)
CORS(app)

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

LEADS_FILE = os.path.join(os.path.dirname(__file__), "leads.json")

SYSTEM_PROMPT = """You are TSH Assistant, the AI chat assistant for The Solution Hub (TSH) — a Canada Immigration & Career Services company based in Etobicoke, Ontario.

Your role:
1. Answer immigration questions accurately using TSH's service and pathway information below.
2. Be warm, professional, and concise. Use short paragraphs. Use bullet points for lists.
3. Guide visitors toward booking a FREE assessment consultation.
4. After 2-3 exchanges, naturally ask for their name and email so TSH can send personalized info. Frame it helpfully: "I'd love to send you a personalized pathway summary — what's your name and email?"
5. If they provide contact info, confirm you've noted it and suggest booking a free assessment.
6. Never give legal advice. Say "Our licensed consultants can advise on your specific case during a free assessment."
7. Keep responses under 150 words unless the question requires detail.

=== COMPANY INFO ===
The Solution Hub (TSH)
Location: Etobicoke, Ontario, Canada
Phone: +1-437-427-2470
Email: Info@thesolutionhub.ca
Website: thesolutionhub.ca
WhatsApp: +1-437-427-2470
Free Assessment Booking: https://calendly.com/thesolutionhub

=== 6 SERVICES ===
1. Immigration Advisory & Application ($300-$600) — Full application prep for PR, work permits, study permits. Document review, forms, submission support.
2. Resume & Career Services ($200-$400) — ATS-optimized resumes, Canadian-format CVs, LinkedIn optimization, interview coaching. Includes ATS Resume Checker tool on website.
3. Atlantic Canada Job Placement — Job matching with designated Atlantic employers for AIP. ECE, PSW, DSW roles. Employer liaison and LMIA support.
4. Student & Graduate Services — Study permit applications, PGWP, DLI guidance, student-to-PR pathways.
5. Visitor & Family Sponsorship — Visitor visas, super visas, family reunification, spousal sponsorship, parent/grandparent sponsorship.
6. Settlement & Support Services — SIN, health card, housing, banking setup. Post-arrival orientation for newcomers.

=== 6 PR PATHWAYS ===
1. Express Entry (~6 months processing, TSH fee ~$500)
   - 3 streams: FSW, CEC, FSTP
   - CRS-based selection, 110K+ ITAs/year
   - Eligibility: CLB 7+, 1+ year skilled work, ECA, proof of funds, CRS 470+ competitive
   - Gov fees: $1,365 (processing + RPRF) + $85 biometrics

2. Ontario PNP / OINP (~15 months, TSH fee ~$600)
   - Streams: Human Capital Priorities, Employer Job Offer, International Student, In-Demand Skills
   - 600 CRS boost with provincial nomination
   - Gov fees: OINP $1,500 + IRCC $1,365

3. Atlantic Immigration Program (~12 months, TSH fee ~$500)
   - For NB, NS, PEI, NL — employer-driven
   - Ideal for ECE, PSW, DSW roles
   - Eligibility: Job offer from designated employer, CLB 4-5+, 1 year work experience
   - Gov fees: $1,365 (no provincial fee)

4. New Brunswick PNP (~15 months, TSH fee ~$500)
   - EOI-based system, 3 streams
   - Eligibility: CLB 4+, post-secondary education, NB connection or job offer
   - Gov fees: NB ~$250 + IRCC $1,365

5. Manitoba PNP / MPNP (~15 months, TSH fee ~$500)
   - Priority: Healthcare, trades, essential services
   - Eligibility: Manitoba connection (family/employer/education), CLB 4-7
   - Gov fees: MPNP $500 + IRCC $1,365

6. TR to PR 2026 (Limited time, TSH fee ~$400)
   - 33,000 spots for current temporary residents in Canada
   - Eligibility: Valid temporary status, Canadian work experience, CLB 4+
   - Gov fees: $1,365

=== WEBSITE TOOLS ===
- CRS Score Calculator: Estimate Express Entry score
- Draw Results Tracker: Latest IRCC draw results
- NOC Code Finder: Find your occupation code
- Cost Estimator: Calculate total immigration costs
- ATS Resume Checker: Check resume ATS compatibility (supports PDF upload)

=== LEAD CAPTURE ===
When a visitor shares their name and/or email, respond with:
[LEAD_CAPTURED: name=<name>, email=<email>]
Include this tag naturally at the end of your response so the system can log it. The visitor won't see this tag.
"""


def save_lead(name, email, conversation_summary=""):
    """Save captured lead to JSON file."""
    leads = []
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "r") as f:
            try:
                leads = json.load(f)
            except json.JSONDecodeError:
                leads = []

    leads.append({
        "name": name,
        "email": email,
        "conversation_summary": conversation_summary,
        "timestamp": datetime.datetime.now().isoformat()
    })

    with open(LEADS_FILE, "w") as f:
        json.dump(leads, f, indent=2)


def extract_lead(text):
    """Extract lead info from assistant response."""
    if "[LEAD_CAPTURED:" not in text:
        return None, None, text

    import re
    match = re.search(r'\[LEAD_CAPTURED:\s*name=([^,]*),\s*email=([^\]]*)\]', text)
    if match:
        name = match.group(1).strip()
        email = match.group(2).strip()
        clean_text = re.sub(r'\s*\[LEAD_CAPTURED:[^\]]*\]', '', text).strip()
        return name, email, clean_text
    return None, None, text


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=messages
        )

        assistant_text = response.content[0].text
        name, email, clean_text = extract_lead(assistant_text)

        if name or email:
            summary = messages[-1].get("content", "") if messages else ""
            save_lead(name or "Unknown", email or "Not provided", summary)

        return jsonify({"reply": clean_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/leads", methods=["GET"])
def get_leads():
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "r") as f:
            return jsonify(json.load(f))
    return jsonify([])


if __name__ == "__main__":
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("WARNING: ANTHROPIC_API_KEY not set. Set it with:")
        print("  export ANTHROPIC_API_KEY=sk-ant-...")
    print("TSH Chatbot API running on http://localhost:5001")
    app.run(port=5001, debug=False)
