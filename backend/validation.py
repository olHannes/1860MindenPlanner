import re
from typing import Any, Dict, List, Union

ValidationResult = Dict[str, Any]

NAME_RE = re.compile(r"^[A-Za-zÄÖÜäöüß ^\-']+$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

ROUTINE_MIN_ELEMENTS = 7


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


def validate_login(email, password):
    errors = {}
    em = normalize_email(email)

    if not em:
        errors["email"] = "Email fehlt."
    elif not EMAIL_RE.match(em):
        errors["email"] = "Email ist ungültig."

    if not password:
        errors["password"] = "Passwort fehlt."
    elif len(password) < 4:
        errors["password"] = "Passwort muss mindestens 4 Zeichen lang sein."

    return em, errors


################################################################################################### Routine Validation and Rating
def validate_routine(device: str, element_list: List[Dict[str, Any]]) -> ValidationResult:
    if not device or not isinstance(device, str):
        raise ValueError("device darf nicht leer sein")

    device = device.strip().upper()

    if device == "VA":
        return _validate_routine_va(element_list)

    return _analyze_routine_elements(device, element_list)


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _group_sort_key(g: Union[str, int]) -> float:
    try:
        return float(g)
    except Exception:
        return float("inf")


def _validate_routine_va(element_list: List[Dict[str, Any]]) -> ValidationResult:
    warnings: List[str] = []
    errors: List[str] = []
    highest_difficulty = 0.0
    group_list = ""

    if len(element_list) == 0:
        errors.append("❌ Eine Sprung-Übung muss nur ein Element enthalten.")
    elif len(element_list) > 1:
        errors.append("❌ Eine Sprung-Übung darf nur ein Element enthalten.")

    for el in element_list:
        highest_difficulty = max(highest_difficulty, _to_float(el.get("wertigkeit", 0)))

    element_group = element_list[0].get("elementegruppe") if element_list else None
    if element_group is not None:
        group_list = str(element_group)

    total_difficulty = 10 + highest_difficulty

    return {
        "warnings": warnings,
        "errors": errors,
        "totalDifficulty": round(total_difficulty, 2),
        "totalElements": len(element_list),
        "groupList": group_list,
        "isComplete": len(errors) == 0,
        "baseDifficulty": highest_difficulty,
        "groupBonus": 0,
        "dismountBonus": 0,
    }


def _analyze_routine_elements(device: str, element_list: List[Dict[str, Any]]) -> ValidationResult:
    required_groups = {
        "FL": {"1", "2", "3"},
        "RI": {"1", "2", "3", "4"},
        "PA": {"1", "2", "3", "4"},
        "HI": {"1", "2", "3", "4"},
        "VA": set(),
    }
    total_difficulty = 10.0

    element_groups: Dict[str, int] = {}
    seen_elements: Dict[str, int] = {}
    difficulties: List[float] = []
    warnings: List[str] = []
    errors: List[str] = []

    has_dismount = False
    is_dismount_at_end = False
    dismount_value = 0.0

    for i, element in enumerate(element_list):
        wertigkeit = _to_float(element.get("wertigkeit", 0))
        gruppe = element.get("elementegruppe")
        is_dismount = bool(element.get("dismount"))
        name = element.get("bezeichnung")

        if gruppe is not None:
            g = str(gruppe)
            element_groups[g] = element_groups.get(g, 0) + 1

        if name:
            name = str(name).strip()
            if name:
                seen_elements[name] = seen_elements.get(name, 0) + 1

        if is_dismount:
            has_dismount = True
            dismount_value = wertigkeit
            if i == len(element_list) - 1:
                is_dismount_at_end = True
            else:
                difficulties.append(wertigkeit)
        else:
            difficulties.append(wertigkeit)

    top_six = sorted(difficulties, reverse=True)[:6]
    base_difficulty = (sum(top_six) + dismount_value) * 2

    required_set = required_groups.get(device, set())
    missing_groups = [g for g in required_set if g not in element_groups]

    group_bonus = 0.5 * len(element_groups)
    dismount_bonus = 0.5 if dismount_value >= 0.2 else (0.3 if dismount_value >= 0.1 else 0.0)

    total_difficulty += base_difficulty + group_bonus + dismount_bonus
    total_elements = len(element_list)
    group_list = ", ".join(sorted(element_groups.keys(), key=_group_sort_key))

    is_complete = (
        len(missing_groups) == 0 and total_elements >= 7 and has_dismount and is_dismount_at_end
    )

    if total_elements > ROUTINE_MIN_ELEMENTS:
        warnings.append(f"⚠️ Übung enthält mehr als {ROUTINE_MIN_ELEMENTS} Elemente.")

    for group, count in element_groups.items():
        if count > 3:
            warnings.append(f"⚠️ Elementegruppe {group} kommt sehr oft vor ({count}x).")
    duplicates = [f"{name} ({count}x)" for name, count in seen_elements.items() if count > 1]
    if duplicates:
        warnings.append("⚠️ Mehrface Elemente: " + ", ".join(duplicates))

    if total_elements < ROUTINE_MIN_ELEMENTS:
        errors.append(f"❌ Zu wenig Elemente: {total_elements}! Minimum: {ROUTINE_MIN_ELEMENTS}")
    if missing_groups:
        errors.append(
            f"❌ Fehlende Gruppen: " + ", ".join(sorted(missing_groups, key=_group_sort_key))
        )
    if not has_dismount:
        errors.append("❌ Kein Abgang vorhanden!")
    if has_dismount and not is_dismount_at_end:
        errors.append("❌ Der Abgang muss am Ende der Übung sein!")

    return {
        "warnings": warnings,
        "errors": errors,
        "totalDifficulty": round(total_difficulty, 2),
        "totalElements": total_elements,
        "groupList": group_list,
        "isComplete": is_complete,
        "baseDifficulty": round(base_difficulty, 2),
        "groupBonus": group_bonus,
        "dismountBonus": dismount_bonus,
    }
