"""
Generate 4 demo PDFs for Brewed Roots Co.
All strings use only ASCII to avoid encoding issues.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

BRAND_BROWN = colors.HexColor("#3B2A1A")
BRAND_TAN   = colors.HexColor("#C8A97A")
BODY_GRAY   = colors.HexColor("#3D3D3D")
MUTED_GRAY  = colors.HexColor("#7A7A7A")
CREAM       = colors.HexColor("#FAF6F0")
RULE_COLOR  = colors.HexColor("#C8A97A")
GRID_COLOR  = colors.HexColor("#D9D0C5")


def make_styles():
    base = getSampleStyleSheet()
    header_top = ParagraphStyle(
        "HeaderTop", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=9,
        textColor=BRAND_TAN, spaceAfter=1, leading=11,
    )
    header_title = ParagraphStyle(
        "HeaderTitle", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=18,
        textColor=BRAND_BROWN, spaceBefore=2, spaceAfter=2, leading=22,
    )
    header_sub = ParagraphStyle(
        "HeaderSub", parent=base["Normal"],
        fontName="Helvetica", fontSize=8.5,
        textColor=MUTED_GRAY, spaceAfter=6,
    )
    h1 = ParagraphStyle(
        "H1", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=11.5,
        textColor=BRAND_BROWN, spaceBefore=14, spaceAfter=4, leading=14,
    )
    h2 = ParagraphStyle(
        "H2", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=10,
        textColor=BRAND_BROWN, spaceBefore=10, spaceAfter=3, leading=13,
    )
    body = ParagraphStyle(
        "Body", parent=base["Normal"],
        fontName="Helvetica", fontSize=9.5,
        textColor=BODY_GRAY, leading=14, spaceAfter=5,
    )
    bullet = ParagraphStyle(
        "Bullet", parent=body,
        leftIndent=14, bulletIndent=4, spaceAfter=3,
    )
    note = ParagraphStyle(
        "Note", parent=body,
        fontSize=8.5, textColor=MUTED_GRAY, leftIndent=14, spaceAfter=3,
    )
    return dict(
        header_top=header_top, header_title=header_title, header_sub=header_sub,
        h1=h1, h2=h2, body=body, bullet=bullet, note=note,
    )


def doc_header(story, s, company, title, version_line):
    story.append(Paragraph(company.upper(), s["header_top"]))
    story.append(Paragraph(title, s["header_title"]))
    story.append(Paragraph(version_line, s["header_sub"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=RULE_COLOR, spaceAfter=10))


def new_doc(filename, title):
    path = os.path.join(OUT_DIR, filename)
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=2.4*cm, rightMargin=2.4*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title=title, author="Brewed Roots Co.",
    )
    return doc, path


def make_table(data, col_widths):
    tbl = Table(data, colWidths=col_widths)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), BRAND_BROWN),
        ("TEXTCOLOR",      (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
        ("GRID",           (0, 0), (-1, -1), 0.5, GRID_COLOR),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 7),
    ]))
    return tbl


def boxed(text_para):
    tbl = Table([[text_para]], colWidths=["100%"])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), CREAM),
        ("BOX",           (0, 0), (-1, -1), 1.5, BRAND_TAN),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
    ]))
    return tbl


# ─────────────────────────────────────────────────────────────────────────────
# 1) SUPPORT SOP v4.1
# ─────────────────────────────────────────────────────────────────────────────
def gen_sop(s):
    doc, path = new_doc("Brewed-Roots-Support-SOP-v4.1.pdf", "Customer Support SOP v4.1")
    story = []

    doc_header(story, s,
               "Brewed Roots Co.",
               "Customer Support SOP v4.1",
               "Version 4.1  -  Last Updated: January 2026  -  Internal: Support Team Use Only")

    story.append(Paragraph("Overview", s["h1"]))
    story.append(Paragraph(
        "This Standard Operating Procedure defines how the Brewed Roots Co. support team "
        "handles customer interactions across all channels. All agents must follow this SOP "
        "consistently. Business hours: <b>Mon-Fri, 09:00-18:00 SGT.</b>",
        s["body"]
    ))

    # Section 1
    story.append(Paragraph("1. Greeting &amp; Verification", s["h1"]))
    story.append(Paragraph(
        "Every inbound interaction must begin with a warm greeting and identity verification "
        "before any order or account information is disclosed.",
        s["body"]
    ))
    for item in [
        "Greet the customer by first name if available.",
        "Request the customer's <b>order number</b> AND the <b>email address on file</b>. "
        "Both must match before sharing any account or order details.",
        "If verification fails after two attempts, politely ask the customer to contact us "
        "from their registered email address.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    # Section 2
    story.append(Paragraph("2. Order Inquiries", s["h1"]))
    story.append(Paragraph("For all order-related questions, follow these steps after verification:", s["body"]))
    for item in [
        "Look up the order in the <b>Order Database</b> using the verified order number.",
        "Share the carrier tracking number and link if available.",
        "Do <b>not</b> promise or imply a specific delivery date. Refer to standard shipping "
        "SLAs in the Policies document.",
        "If the order shows an error or is stuck, escalate to the fulfilment queue in Zendesk.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    # Section 3
    story.append(Paragraph("3. Refunds &amp; Returns", s["h1"]))
    story.append(Paragraph(
        "The standard return window is <b>30 days from the delivery date</b>, applicable to "
        "all products. Process refunds as follows:",
        s["body"]
    ))
    tbl_data = [
        [Paragraph("<b>Refund Amount</b>", s["body"]),
         Paragraph("<b>Approval</b>", s["body"]),
         Paragraph("<b>Process</b>", s["body"])],
        [Paragraph("Under $100", s["body"]),
         Paragraph("Auto-approved", s["body"]),
         Paragraph("Agent processes directly in Billing system; confirm with customer via email.", s["body"])],
        [Paragraph("$100 or more", s["body"]),
         Paragraph("Support Lead required", s["body"]),
         Paragraph("Escalate via Zendesk escalation queue. SLA: 1 business day. "
                   "Notify customer that review is in progress.", s["body"])],
    ]
    story.append(Spacer(1, 6))
    story.append(make_table(tbl_data, ["25%", "25%", "50%"]))
    story.append(Spacer(1, 6))

    # Section 4
    story.append(Paragraph("4. Subscription Management", s["h1"]))
    for item in [
        "Customers may <b>pause, modify, or cancel</b> their subscription at any time.",
        "Cancellations take effect at the <b>end of the current billing cycle</b>. "
        "No partial refunds are issued for the current period.",
        "All changes must be logged in the CRM with a timestamp and agent ID.",
        "Confirm every change to the customer by email before closing the ticket.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    # Section 5
    story.append(Paragraph("5. Brewing Gear &amp; Product Questions", s["h1"]))
    for item in [
        "Answer from the <b>Knowledge Base / FAQ</b> first.",
        "If the answer is not covered in any internal document, do not guess. "
        "Inform the customer and follow up by email <b>within 2 business days</b>.",
        "Do not make product claims beyond what is documented.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    # Section 6
    story.append(Paragraph("6. Tone &amp; Voice", s["h1"]))
    for item in [
        "Keep all responses <b>warm, concise, and helpful</b>.",
        "Never use the word <b>'cheapest'</b> -- use 'best value' or 'most affordable' instead.",
        "Never state or imply a <b>guaranteed delivery date</b>.",
        'Every AI-assisted reply must include the disclosure: '
        '<i>"This response was assisted by an AI support agent."</i>',
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    # Section 7
    story.append(Paragraph("7. Escalation Paths", s["h1"]))
    esc_data = [
        [Paragraph("<b>Situation</b>", s["body"]),
         Paragraph("<b>Escalate To</b>", s["body"]),
         Paragraph("<b>SLA</b>", s["body"])],
        [Paragraph("Refund >= $100", s["body"]),
         Paragraph("Support Lead -- Zendesk escalation queue", s["body"]),
         Paragraph("1 business day", s["body"])],
        [Paragraph("Legal, regulatory, or suspected fraud", s["body"]),
         Paragraph("Legal &amp; Compliance\nlegal@brewedrootsco.com", s["body"]),
         Paragraph("4 business hours", s["body"])],
        [Paragraph("Account deletion request", s["body"]),
         Paragraph("Data Privacy\nprivacy@brewedrootsco.com", s["body"]),
         Paragraph("Per data-privacy SLA", s["body"])],
    ]
    story.append(Spacer(1, 6))
    story.append(make_table(esc_data, ["35%", "40%", "25%"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Questions about this SOP? Contact your team lead or email hello@brewedrootsco.com.",
        s["note"]
    ))

    doc.build(story)
    return path


# ─────────────────────────────────────────────────────────────────────────────
# 2) BRAND & VOICE GUIDE
# ─────────────────────────────────────────────────────────────────────────────
def gen_brand(s):
    doc, path = new_doc("Brewed-Roots-Brand-and-Voice-Guide.pdf", "Brand & Voice Guide")
    story = []

    doc_header(story, s,
               "Brewed Roots Co.",
               "Brand &amp; Voice Guide",
               "Version 2.0  -  Last Updated: January 2026  -  Internal")

    story.append(Paragraph("Who We Are", s["h1"]))
    story.append(Paragraph(
        "Brewed Roots Co. is a direct-to-consumer specialty coffee brand offering "
        "single-origin beans, curated brewing gear, and flexible subscription coffee plans. "
        "We exist to make exceptional coffee accessible, approachable, and enjoyable -- "
        "from seed to cup.",
        s["body"]
    ))

    story.append(Paragraph("Brand Personality", s["h1"]))
    for trait, desc in [
        ("Warm",     "We treat every customer like a regular at their favourite neighbourhood cafe."),
        ("Curious",  "We geek out on origins, processes, and flavour profiles -- and share that passion."),
        ("Grounded", "Honest, unpretentious, and straightforward. No fuss, no jargon overload."),
        ("Helpful",  "We solve problems quickly and leave people feeling good about the interaction."),
    ]:
        story.append(Paragraph("<b>" + trait + "</b> -- " + desc, s["bullet"]))

    story.append(Paragraph("Tone of Voice", s["h1"]))
    story.append(Paragraph(
        "Our tone is <b>warm, concise, and helpful</b>. Whether we are writing an order "
        "confirmation, a support reply, or a social caption, we sound like a knowledgeable "
        "friend -- not a corporation.",
        s["body"]
    ))

    story.append(Paragraph("Tone in Practice", s["h2"]))
    tone_data = [
        [Paragraph("<b>Instead of ...</b>", s["body"]),
         Paragraph("<b>Say ...</b>", s["body"])],
        [Paragraph("Your request has been received and will be processed.", s["body"]),
         Paragraph("Got it! We're on it and will keep you posted.", s["body"])],
        [Paragraph("We cannot guarantee delivery dates.", s["body"]),
         Paragraph("Delivery times vary -- we'll share tracking as soon as it's available.", s["body"])],
        [Paragraph("The cheapest option is ...", s["body"]),
         Paragraph("Our most affordable option is ...", s["body"])],
    ]
    story.append(Spacer(1, 6))
    story.append(make_table(tone_data, ["50%", "50%"]))

    story.append(Paragraph("Words &amp; Phrases to Avoid", s["h1"]))
    for item in [
        "<b>'cheapest'</b> -- use 'most affordable' or 'best value' instead.",
        "<b>'guaranteed delivery date'</b> -- we never promise specific arrival dates.",
        "<b>Jargon or acronyms</b> without explanation -- keep it accessible.",
        "<b>Overly formal language</b> -- avoid phrases like 'Please be advised' or 'In regards to'.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    story.append(Paragraph("Required Email Signature", s["h1"]))
    story.append(Paragraph(
        "Every customer-facing email must close with the following signature block:",
        s["body"]
    ))
    sig_style = ParagraphStyle(
        "Sig", fontName="Helvetica-Bold", fontSize=9.5, textColor=BRAND_BROWN,
        leading=15,
    )
    story.append(Spacer(1, 6))
    story.append(boxed(Paragraph(
        "The Brewed Roots Team<br/>hello@brewedrootsco.com  |  brewedrootsco.com",
        sig_style
    )))

    story.append(Paragraph("AI Transparency Policy", s["h1"]))
    story.append(Paragraph(
        "Brewed Roots Co. uses AI tools to assist our support team. We are committed to "
        "transparency with our customers. Any reply that was drafted or materially assisted "
        "by an AI system must include the following disclosure:",
        s["body"]
    ))
    ai_style = ParagraphStyle(
        "AI", fontName="Helvetica-Oblique", fontSize=9.5, textColor=BRAND_BROWN, leading=15,
    )
    story.append(Spacer(1, 6))
    story.append(boxed(Paragraph(
        '"This response was assisted by an AI support agent."',
        ai_style
    )))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "This disclosure must appear at the bottom of the message body, before the signature.",
        s["note"]
    ))

    story.append(Paragraph("Languages", s["h1"]))
    story.append(Paragraph(
        "All customer communications are conducted in <b>English</b>. "
        "If a customer writes in another language, respond warmly in English and offer to "
        "clarify if needed.",
        s["body"]
    ))

    doc.build(story)
    return path


# ─────────────────────────────────────────────────────────────────────────────
# 3) POLICIES
# ─────────────────────────────────────────────────────────────────────────────
def gen_policies(s):
    doc, path = new_doc("Brewed-Roots-Policies.pdf", "Refund, Returns & Shipping Policies")
    story = []

    doc_header(story, s,
               "Brewed Roots Co.",
               "Refund, Returns &amp; Shipping Policies",
               "Version 3.2  -  Last Updated: January 2026  -  Customer-Facing &amp; Internal")

    story.append(Paragraph("1. Refund Policy", s["h1"]))
    story.append(Paragraph(
        "We want every Brewed Roots purchase to be a great experience. "
        "If something isn't right, here is how refunds work:",
        s["body"]
    ))
    for item in [
        "<b>Refunds under $100</b> are automatically approved and processed by the Support "
        "team in the Billing system. Customers receive confirmation within 1 business day.",
        "<b>Refunds of $100 or more</b> require approval from a Support Lead. The case is "
        "escalated via the Zendesk escalation queue with a maximum SLA of <b>1 business day</b>. "
        "The customer is notified that the review is in progress.",
        "Refunds are issued to the original payment method. Processing time is 3-5 business "
        "days depending on the issuing bank.",
        "Refunds are not available for digital products (gift cards, downloadable guides) "
        "after redemption.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    story.append(Paragraph("2. Returns Policy", s["h1"]))
    story.append(Paragraph(
        "All Brewed Roots products are eligible for return within "
        "<b>30 days of the delivery date</b>, subject to the conditions below.",
        s["body"]
    ))
    for item in [
        "Items must be unused and in original packaging where applicable.",
        "Opened coffee bags are eligible for return only if the product was defective or incorrect.",
        "To initiate a return, customers must contact support with their order number and "
        "reason for return.",
        "Once a return is approved, customers will receive instructions for sending items back.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    story.append(Paragraph("3. Subscription Cancellation Policy", s["h1"]))
    for item in [
        "Customers may pause, modify, or cancel their subscription at any time via their "
        "account dashboard or by contacting support.",
        "Cancellations are effective at the <b>end of the current billing cycle</b>. "
        "No partial refunds are issued for the remaining period.",
        "Customers who cancel will continue to receive any orders already dispatched before "
        "the cancellation was processed.",
        "All cancellation requests are logged in the CRM.",
    ]:
        story.append(Paragraph("- " + item, s["bullet"]))

    story.append(Paragraph("4. Shipping Policy", s["h1"]))
    story.append(Paragraph(
        "Brewed Roots ships to all major markets. Shipping SLAs below are estimates and "
        "are not guaranteed delivery dates.",
        s["body"]
    ))
    ship_data = [
        [Paragraph("<b>Shipping Method</b>", s["body"]),
         Paragraph("<b>Estimated Transit Time</b>", s["body"]),
         Paragraph("<b>Notes</b>", s["body"])],
        [Paragraph("Standard", s["body"]),
         Paragraph("5-8 business days", s["body"]),
         Paragraph("Tracking provided when dispatched.", s["body"])],
        [Paragraph("Express", s["body"]),
         Paragraph("2-3 business days", s["body"]),
         Paragraph("Available for most destinations; additional charges apply.", s["body"])],
    ]
    story.append(Spacer(1, 6))
    story.append(make_table(ship_data, ["28%", "32%", "40%"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Note: Brewed Roots does not provide guaranteed delivery dates. "
        "Delays due to customs, carrier disruptions, or public holidays are outside our control.",
        s["note"]
    ))

    story.append(Paragraph("5. Account Deletion", s["h1"]))
    story.append(Paragraph(
        "Account deletion requests must be directed to the <b>Data Privacy team</b> at "
        "privacy@brewedrootsco.com. The Support team cannot process account deletions directly. "
        "Requests are handled in accordance with applicable data protection laws.",
        s["body"]
    ))

    story.append(Paragraph("6. Data Retention &amp; Compliance", s["h1"]))
    story.append(Paragraph(
        "Brewed Roots Co. complies with the Personal Data Protection Act (PDPA) and applicable "
        "regional privacy regulations. Customer interaction logs are retained for "
        "<b>24 months</b> from the date of the interaction, after which they are securely "
        "deleted unless a legal hold is in effect. "
        "For data access or deletion requests, contact privacy@brewedrootsco.com.",
        s["body"]
    ))

    doc.build(story)
    return path


# ─────────────────────────────────────────────────────────────────────────────
# 4) KNOWLEDGE BASE / FAQ
# ─────────────────────────────────────────────────────────────────────────────
def gen_faq(s):
    doc, path = new_doc("Brewed-Roots-Knowledge-Base-FAQ.pdf", "Knowledge Base & FAQ")
    story = []

    doc_header(story, s,
               "Brewed Roots Co.",
               "Knowledge Base &amp; FAQ",
               "Version 1.8  -  Last Updated: January 2026  -  Support Team Reference")

    story.append(Paragraph(
        "This document is the primary reference for product and service questions. "
        "Use it to answer customer inquiries accurately and consistently.",
        s["body"]
    ))

    faqs = [
        ("Orders &amp; Tracking", [
            ("How do I track my order?",
             "Once your order is dispatched, you will receive a shipping confirmation email "
             "with a tracking number and a link to the carrier's tracking page. "
             "Allow up to 24 hours for tracking to activate after dispatch."),
            ("My tracking has not updated in several days -- what should I do?",
             "Tracking can occasionally stall during transit or customs clearance. "
             "If there has been no update for more than 5 business days on a Standard shipment "
             "or 3 business days on an Express shipment, contact our support team and we will "
             "investigate with the carrier."),
            ("Can I change my delivery address after placing an order?",
             "Address changes are possible only before the order has been dispatched. "
             "Contact support immediately with your order number and the new address. "
             "Once an order is in transit, we cannot redirect it."),
        ]),
        ("Our Coffee", [
            ("Where are your beans sourced?",
             "All Brewed Roots beans are single-origin, sourced directly from small farms "
             "and cooperatives across Ethiopia, Colombia, Guatemala, and Sumatra. "
             "Each product page includes the specific farm, region, altitude, and processing "
             "method for full transparency."),
            ("Do you offer decaf options?",
             "Yes. We carry a Swiss Water Process decaf sourced from Colombia, available in "
             "whole bean and ground. It is naturally decaffeinated with no chemical solvents "
             "-- great for evening brews without compromising on flavour."),
            ("What grind options are available?",
             "We offer: Whole Bean, Coarse (French press, cold brew), Medium (drip, pour-over), "
             "and Fine (espresso, AeroPress). Select your grind at checkout. For the freshest "
             "cup, we recommend ordering whole bean and grinding at home."),
            ("How should I store my coffee?",
             "Store in an airtight container at room temperature, away from direct sunlight, "
             "heat, and moisture. Avoid refrigerating or freezing unless you have bought in "
             "bulk -- moisture from the fridge can affect flavour. For best results, consume "
             "within 3-4 weeks of the roast date."),
        ]),
        ("Subscriptions", [
            ("How does the subscription work?",
             "Choose your preferred coffee, bag size, grind, and frequency (every 2, 4, or "
             "6 weeks). Your order ships automatically on schedule and your card is charged "
             "at the time of each dispatch. You can modify, pause, or cancel anytime from "
             "your account dashboard."),
            ("Can I skip a delivery?",
             "Yes. Log in to your account, navigate to Subscriptions, and select "
             "'Skip Next Delivery' at least 2 business days before your next scheduled "
             "dispatch date. You will not be charged for skipped deliveries."),
        ]),
        ("Brewing Tips", [
            ("What coffee-to-water ratio do you recommend?",
             "A good starting point is 1:15 (coffee to water by weight) -- for example, "
             "20 g of coffee to 300 ml of water. Adjust to taste: more coffee for a stronger "
             "brew, less for something lighter. Our Brew Guides on the website cover "
             "pour-over, French press, AeroPress, espresso, and cold brew step by step."),
        ]),
        ("Returns, Damage &amp; Other Topics", [
            ("My order arrived damaged -- what should I do?",
             "We are sorry to hear that. Please contact support within 7 days of delivery "
             "with your order number and a photo of the damaged item and packaging. "
             "We will arrange a replacement or refund at no additional cost to you."),
            ("Do you offer wholesale or bulk purchasing?",
             "Yes. We work with cafes, offices, and retailers. For wholesale enquiries, "
             "email hello@brewedrootsco.com with the subject line 'Wholesale Enquiry' and "
             "include your business name and estimated monthly volume. Our team will respond "
             "within 3 business days."),
            ("What payment methods do you accept?",
             "We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, "
             "and Apple Pay / Google Pay where supported. "
             "All transactions are processed securely over SSL."),
        ]),
    ]

    for section, items in faqs:
        story.append(Paragraph(section, s["h1"]))
        for q, a in items:
            story.append(Paragraph("Q: " + q, s["h2"]))
            story.append(Paragraph(a, s["body"]))
            story.append(Spacer(1, 2))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRID_COLOR, spaceAfter=6))
    story.append(Paragraph(
        "Can't find the answer here? Email hello@brewedrootsco.com or follow up with the "
        "customer within 2 business days.",
        s["note"]
    ))

    doc.build(story)
    return path


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    s = make_styles()
    paths = [gen_sop(s), gen_brand(s), gen_policies(s), gen_faq(s)]
    print("Generated:")
    for p in paths:
        size = os.path.getsize(p)
        print("  %s  (%s bytes)" % (os.path.basename(p), "{:,}".format(size)))
