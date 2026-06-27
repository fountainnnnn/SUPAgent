"""Generate the SUPAgent integration & operations runbook PDF for the demo."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

OUT = os.path.join(
    os.path.dirname(__file__), "..", "..", "client", "public", "runbook",
    "SUPAgent-Runbook.pdf",
)
OUT = os.path.abspath(OUT)

INK = colors.HexColor("#1D1D1F")
SOFT = colors.HexColor("#6E6E73")
ACCENT = colors.HexColor("#0A84FF")
LINE = colors.HexColor("#D9D9DE")
CODEBG = colors.HexColor("#F2F2F5")

styles = getSampleStyleSheet()
H = ParagraphStyle("H", parent=styles["Title"], textColor=INK, fontSize=22,
                   spaceAfter=2, leading=26)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], textColor=SOFT, fontSize=10,
                     spaceAfter=2)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=INK, fontSize=13,
                    spaceBefore=14, spaceAfter=6, leading=16)
BODY = ParagraphStyle("BODY", parent=styles["Normal"], textColor=INK, fontSize=10,
                      leading=15, spaceAfter=6)
SMALL = ParagraphStyle("SMALL", parent=styles["Normal"], textColor=SOFT, fontSize=8.5,
                       leading=12)
CODE = ParagraphStyle("CODE", parent=styles["Code"], textColor=INK, fontSize=8.5,
                      leading=12, backColor=CODEBG, borderPadding=8,
                      spaceBefore=4, spaceAfter=8)


def h2(t):
    return Paragraph(t, H2)


def p(t):
    return Paragraph(t, BODY)


def kv_table(rows):
    t = Table([[Paragraph(f"<b>{k}</b>", BODY), Paragraph(v, BODY)] for k, v in rows],
              colWidths=[45 * mm, 120 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def build():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = SimpleDocTemplate(OUT, pagesize=A4, topMargin=18 * mm, bottomMargin=16 * mm,
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            title="SUPAgent Runbook")
    e = []
    e.append(Paragraph("SUPAgent", H))
    e.append(Paragraph("Agent Integration &amp; Operations Runbook", SUB))
    e.append(Paragraph("Brewed Roots Co. — Customer Support Agent &nbsp;·&nbsp; v1.0 &nbsp;·&nbsp; Last updated: January 2026", SUB))
    e.append(Spacer(1, 4))
    e.append(HRFlowable(width="100%", thickness=0.6, color=LINE))

    e.append(h2("1. Overview"))
    e.append(p("This runbook describes how to integrate and operate the customer-support "
               "agent that SUPAgent generated from your documents. The agent reads incoming "
               "support tickets, gathers facts using your connected tools, then resolves the "
               "ticket or escalates it according to your policies. It is delivered two ways: a "
               "hosted API endpoint you can call today, and a version-controlled repository you "
               "own and can hand to your own engineers."))

    e.append(h2("2. Your live endpoint"))
    e.append(p("The agent is reachable at the endpoint below. Send a ticket as JSON; the agent "
               "returns a drafted reply plus the action it took (resolved or escalated)."))
    e.append(Paragraph(
        "POST https://api.agentfactory.dev/brewed-roots/support/tickets<br/>"
        "Authorization: Bearer &lt;YOUR_API_KEY&gt;<br/>"
        "Content-Type: application/json<br/><br/>"
        "{<br/>"
        "&nbsp;&nbsp;\"from\": \"customer@example.com\",<br/>"
        "&nbsp;&nbsp;\"subject\": \"Where is my order #BR-20481?\",<br/>"
        "&nbsp;&nbsp;\"body\": \"Hi, my order hasn't arrived yet...\"<br/>"
        "}", CODE))
    e.append(p("<b>Response</b> — the agent returns its decision, the drafted reply, and whether "
               "a human was looped in:"))
    e.append(Paragraph(
        "{<br/>"
        "&nbsp;&nbsp;\"action\": \"resolved\",<br/>"
        "&nbsp;&nbsp;\"reply\": \"Hi Maya, thanks for reaching out...\",<br/>"
        "&nbsp;&nbsp;\"escalated\": false,<br/>"
        "&nbsp;&nbsp;\"tools_used\": [\"look_up_order\", \"send_email_reply\"]<br/>"
        "}", CODE))

    e.append(h2("3. Authentication"))
    e.append(p("Every request must include your API key as a Bearer token in the "
               "<b>Authorization</b> header. Keep this key secret; rotate it from your SUPAgent "
               "dashboard if it is ever exposed. Never embed it in client-side code."))

    e.append(h2("4. Configuration — values you provide"))
    e.append(p("The agent references the following via environment variables. SUPAgent fills the "
               "platform values; the items marked <b>you provide</b> connect the agent to your own "
               "systems. Add them to the repository's <font face='Courier'>.env</font> file."))
    e.append(kv_table([
        ("EMAIL_PROVIDER_KEY", "you provide — credentials for the mailbox the agent replies from."),
        ("ORDER_DB_URL / KEY", "you provide — read access to your order system for lookups."),
        ("CRM_API_KEY", "you provide — to log subscription and account changes."),
        ("ALLOWED_RECIPIENTS", "you provide — comma-separated list the agent may email."),
        ("REFUND_CAP", "default 100 — refunds at or above this are escalated, not auto-issued."),
    ]))

    e.append(h2("5. Guardrails &amp; safety"))
    e.append(p("These protections are enforced in code, not in the prompt, so a malicious or "
               "manipulative ticket cannot talk the agent past them:"))
    e.append(p("• <b>Recipient allow-list</b> — the agent only sends email to approved addresses.<br/>"
               "• <b>Refund cap</b> — refunds of $100 or more are escalated to the Support Lead.<br/>"
               "• <b>Identity gate</b> — order or account details are released only after the customer "
               "is verified (order number + email on file).<br/>"
               "• <b>Untrusted input</b> — ticket text is treated as data and can never authorize a "
               "privileged action."))

    e.append(h2("6. Escalation routing"))
    e.append(kv_table([
        ("Refund ≥ $100", "Support Lead — Zendesk escalation queue (SLA: 1 business day)."),
        ("Legal / fraud signal", "Legal &amp; Compliance — legal@brewedrootsco.com (SLA: 4 business hours)."),
        ("Account deletion", "Data Privacy team — privacy@brewedrootsco.com."),
    ]))

    e.append(h2("7. Updating the agent"))
    e.append(p("When your policies, brand, or processes change, re-upload the updated documents in "
               "SUPAgent and rebuild. The agent is regenerated, re-tested against its eval suite, and "
               "reviewed by the supervisor before the new version goes live. Your endpoint URL stays "
               "the same."))

    e.append(h2("8. Ownership &amp; support"))
    e.append(p("You own the generated repository outright — there is no platform lock-in. Your "
               "engineers can read, modify, and self-host it at any time. For help, contact your "
               "SUPAgent representative."))

    e.append(Spacer(1, 8))
    e.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
    e.append(Paragraph("Generated by SUPAgent · This runbook accompanies the deployed agent and its repository.", SMALL))

    doc.build(e)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    build()
