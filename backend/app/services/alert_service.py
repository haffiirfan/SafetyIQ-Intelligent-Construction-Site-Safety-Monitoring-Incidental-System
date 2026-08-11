import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from datetime import datetime

class AlertService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_pass = settings.smtp_pass

    async def send_violation_alert(self, violation_type, zone, confidence, camera_id):
        if not self.smtp_user:
            print(f"Alert skipped - SMTP not configured")
            print(f"Violation: {violation_type} in {zone} (confidence: {confidence:.2f})")
            return

        subject = f"SafetyIQ Alert: {violation_type} in {zone}"
        body = f"""
SafetyIQ Safety Alert
Violation Type : {violation_type}
Zone           : {zone}
Camera         : Camera {camera_id}
Confidence     : {confidence:.1%}
Time           : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Risk Level     : {self._get_risk(violation_type)}
Please take immediate action.
        """
        try:
            msg = MIMEMultipart()
            msg['From']    = self.smtp_user
            msg['To']      = self.smtp_user
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            print(f"Alert sent for {violation_type} in {zone}")
        except Exception as e:
            print(f"Alert failed: {e}")

    def _get_risk(self, violation_type):
        risk_map = {
            "NO-Hardhat":     "CRITICAL",
            "NO-Safety Vest": "HIGH",
            "NO-Mask":        "MEDIUM",
            "NO-Gloves":      "LOW",
        }
        return risk_map.get(violation_type, "UNKNOWN")

alert_service = AlertService()
