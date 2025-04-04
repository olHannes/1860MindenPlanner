from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime
import smtplib
import ssl
import os


load_dotenv()

sender_email = "notification.routineplanner@gmail.com"
receiver_email = "hanni.frille@gmail.com"
email_password = os.getenv("EMAIL_PWD")

def create_mail(reportTitle, report, username, timestamp):
    html_body = f"""
    <html>
    <body>
        <h2>{reportTitle}</h2>
        <p><strong>Bericht:</strong></p>
        <p>{report}</p>
        <br>
        <p><strong>Benutzer:</strong> {username}</p>
        <p><strong>Datum und Uhrzeit:</strong> {timestamp}</p>
    </body>
    </html>
    """
    em = EmailMessage()
    em['From'] = sender_email
    em['To'] = receiver_email
    em['Subject'] = f"Fehlerbericht oder Verbesserungsvorschlag - {reportTitle}"

    em.set_content(f"Fehlerbericht oder Verbesserungsvorschlag von {username}.\n\nBericht:\n{report}")
    em.add_alternative(html_body, subtype='html')

    return em

def send_mail(reportTitle, report, username, timestamp):
    try:
        em = create_mail(reportTitle, report, username, timestamp)

        context = ssl.create_default_context()

        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(sender_email, email_password)
            smtp.sendmail(sender_email, receiver_email, em.as_string())

        print("E-Mail erfolgreich gesendet!")
    except Exception as e:
        print(f"Fehler beim Senden der E-Mail: {e}")