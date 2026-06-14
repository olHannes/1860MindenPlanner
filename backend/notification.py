from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime, timezone
import smtplib
import ssl
import os

load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL")
EMAIL_PWD = os.getenv("EMAIL_PWD")
REPORT_TARGET_EMAIL = os.getenv("TARGET_EMAIL")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = os.getenv("SMTP_PORT", "465")


def build_report(
    reportType, reportTitle, report, username, timestamp, to_email=None
) -> EmailMessage:
    """Baut eine Report-Mail (default: TARGET_EMAIL)"""
    if to_email is None:
        to_email = REPORT_TARGET_EMAIL
    html_body = f"""
        <html><body>
            <h2>{reportTitle}</h2>
            <p><strong>Bericht:</strong></p>
            <p>{report}</p>
            <br>
            <p><strong>Benutzer:</strong> {username}</p>
            <p><strong>Datum und Uhrzeit:</strong> {timestamp}</p>
        </body></html>
    """
    em = EmailMessage()
    em["From"] = SENDER_EMAIL
    em["To"] = to_email
    em["Subject"] = f"{reportType} - {reportTitle}"
    em.set_content(f"{reportType} von {username}.\n\nBericht:\n{report}")
    em.add_alternative(html_body, subtype="html")
    return em


def build_reset(
    to_email: str, code: str, username: str = "", expires_minutes: int = 15
) -> EmailMessage:
    """Baut eine Reset-Passwort Mail"""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    subject = "Passwort zurücksetzen"
    text = (
        f"Hallo {username or ''}\n\n"
        f"Dein Code zum Zurücksetzen des Passworts lautet: {code}\n"
        f"Der Code ist {expires_minutes} Minuten gültig.\n\n"
        f"Zeitpunkt: {now}\n"
        f"Wenn du das nicht warst, ignoriere diese Mail."
    ).strip()
    html = f"""
    <html><body>
        <h2>Passwort zurücksetzen</h2>
        <p>Hallo {username or ""},</p>
        <p>Dein Code zum Zurücksetzen des Passworts lautet:</p>
        <p style="font-size:24px; font-weight:bold; letter-spacing:2px;">{code}</p>
        <p>Der Code ist <strong>{expires_minutes} Minuten</strong> gültig.</p>
        <p><small>Zeitpunkt: {now}</small></p>
        <p>Wenn du das nicht warst, ignoriere diese Mail.</p>
    </body></html>
    """
    em = EmailMessage()
    em["From"] = SENDER_EMAIL
    em["To"] = to_email
    em["Subject"] = subject
    em.set_content(text)
    em.add_alternative(html, subtype="html")
    return em


def build_verify(to_email: str, verify_link: str, username: str = "") -> EmailMessage:
    """Baut eine Account-Verifizierungs-Mail"""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    subject = "Account bestätigen"
    text = (
        f"Hallo {username or ''}\n\n"
        f"bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.\n\n"
        f"Öffne dazu diesen Link:\n"
        f"{verify_link}\n\n"
        f"Zeitpunkt: {now}\n"
        f"Wenn du dich nicht registriert hast, ignoriere diese E-Mail."
    ).strip()
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Account bestätigen</h2>

        <p>Hallo {username or ""},</p>

        <p>
          bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.
        </p>

        <p style="margin: 24px 0;">
          <a href="{verify_link}"
             style="
               background-color: #2563eb;
               color: white;
               padding: 12px 18px;
               text-decoration: none;
               border-radius: 6px;
               font-weight: bold;
               display: inline-block;
             ">
            Account bestätigen
          </a>
        </p>

        <p style="color: #555;">
          <small>Zeitpunkt: {now}</small>
        </p>

        <p style="color: #555;">
          Wenn du dich nicht registriert hast, ignoriere diese E-Mail.
        </p>
      </body>
    </html>
    """
    em = EmailMessage()
    em["From"] = SENDER_EMAIL
    em["To"] = to_email
    em["Subject"] = subject
    em.set_content(text)
    em.add_alternative(html, subtype="html")
    return em


def send_mail(em: EmailMessage) -> None:
    """Sendet eine fertige EmailMessage"""
    if not SENDER_EMAIL or not EMAIL_PWD:
        raise RuntimeError("Mail-Konfiguration unvollständig")
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as smtp:
        smtp.login(SENDER_EMAIL, EMAIL_PWD)
        smtp.send_message(em)
