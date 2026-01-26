import re

NAME_RE = re.compile(r"^[A-Za-zÄÖÜäöüß ^\-']+$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def normalize_name(txt: str) -> str:
    if not txt:
        return ""
    txt = " ".join(txt.strip().split())
    return " ".join(w[:1].upper() + w[1:].lower() for w in txt.split(" "))

def normalize_email(email: str) -> str:
    return (email or "").strip().lower()

def validate_registration(first_name, last_name, email, password):
    errors = {}

    fn = normalize_name(first_name)
    ln = normalize_name(last_name)
    em = normalize_email(email)

    if not fn:
        errors["firstName"] = "Vorname fehlt."
    elif not NAME_RE.match(fn):
        errors["firstName"] = "Vorname darf nur Buchstaben und Leerzeichen enthalten."

    if not ln:
        errors["lastName"] = "Nachname fehlt."
    elif not NAME_RE.match(ln):
        errors["lastName"] = "Nachname darf nur Buchstaben und Leerzeichen enthalten."

    if not em:
        errors["email"] = "Email fehlt."
    elif not EMAIL_RE.match(em):
        errors["email"] = "Email ist ungültig."

    if not password:
        errors["password"] = "Passwort fehlt."
    elif len(password) < 4:
        errors["password"] = "Passwort muss mindestens 4 Zeichen lang sein."

    return fn, ln, em, errors