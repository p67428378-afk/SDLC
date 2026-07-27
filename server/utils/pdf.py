import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_pdf_statement(
    account_id: str,
    account_holder: str,
    account_number: str,
    statement_period: str,
    opening_balance: float,
    closing_balance: float,
    transactions: list,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#3525cd"),
        spaceAfter=12,
    )

    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0b1c30"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#464555"),
    )

    bold_style = ParagraphStyle(
        "BoldTextCustom", parent=body_style, fontName="Helvetica-Bold"
    )

    # Title
    story.append(Paragraph("ApexBank Account Statement", title_style))
    story.append(Spacer(1, 12))

    # Account Info Table
    info_data = [
        [
            Paragraph("<b>Account Holder:</b>", body_style),
            Paragraph(account_holder, body_style),
            Paragraph("<b>Statement Period:</b>", body_style),
            Paragraph(statement_period, body_style),
        ],
        [
            Paragraph("<b>Account Number:</b>", body_style),
            Paragraph(account_number, body_style),
            Paragraph("<b>Opening Balance:</b>", body_style),
            Paragraph(f"${opening_balance:,.2f}", body_style),
        ],
        [
            "",
            "",
            Paragraph("<b>Closing Balance:</b>", body_style),
            Paragraph(f"${closing_balance:,.2f}", body_style),
        ],
    ]

    info_table = Table(info_data, colWidths=[120, 150, 120, 150])
    info_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(info_table)
    story.append(Spacer(1, 20))

    # Transactions Section
    story.append(Paragraph("Transaction History", h2_style))
    story.append(Spacer(1, 6))

    # Transactions Table
    tx_data = [
        [
            Paragraph("<b>Date</b>", bold_style),
            Paragraph("<b>Description</b>", bold_style),
            Paragraph("<b>Type</b>", bold_style),
            Paragraph("<b>Amount</b>", bold_style),
        ]
    ]

    for tx in transactions:
        date_str = tx.transaction_date.strftime("%Y-%m-%d %H:%M:%S")
        desc = tx.description or ""
        tx_type = tx.type.upper()

        if tx.source_account_id == account_id:
            amt_str = f"-${tx.amount:,.2f}"
            amt_color = colors.HexColor("#ba1a1a")  # Red
        else:
            amt_str = f"+${tx.amount:,.2f}"
            amt_color = colors.HexColor("#15803d")  # Green

        amt_style = ParagraphStyle(
            "AmtStyle",
            parent=body_style,
            textColor=amt_color,
            fontName="Helvetica-Bold",
        )

        tx_data.append(
            [
                Paragraph(date_str, body_style),
                Paragraph(desc, body_style),
                Paragraph(tx_type, body_style),
                Paragraph(amt_str, amt_style),
            ]
        )

    tx_table = Table(tx_data, colWidths=[130, 230, 80, 100])
    tx_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#0b1c30")),
                ("LINEBELOW", (0, 1), (-1, -1), 0.5, colors.HexColor("#e5eeff")),
            ]
        )
    )
    story.append(tx_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
