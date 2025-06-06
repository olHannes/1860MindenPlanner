# Routineplanner.de

**Routineplanner.de** ist eine Webanwendung zur Erstellung, Verwaltung und Bewertung von Turnübungen, sowie von Wettkämpfen. Die Plattform ist ein privates Projekt für den Verein SV-1860-Minden.

## Features

### 🔐 Startseite
- **Login:** Anmeldung mit Name und Passwort
- **Registrierung:** Benutzerkonto mit Vorname, Nachname und Passwort erstellen
- **Automatischer Login:** Option zur Speicherung der Anmeldedaten

Zusätzliche Elemente:
- Informationstext zur Nutzung
- Anzeige der neuesten Updates
- Download-Button für PDF-Dateien aller Turnelemente

---

### ⚙️ Einstellungen
- **Profilbild mit individueller Farbe**
- **Accountverwaltung:**
  - Logout
  - Account löschen
- **Profil bearbeiten:**
  - Änderung von Vorname, Nachname und Passwort
  - Anpassung der Profilbildfarbe
  - Checkboxen für automatischen Login & Sichtbarkeit
- **Report-Panel:**
  - Einreichen von Fehlern oder Verbesserungsvorschlägen (Typ, Titel, Beschreibung)
  - Übersicht über bereits gemeldete Reports

---

### Mitgliedsseite

#### 👥 Mitglieder
- Anzeige aller **sichtbaren Mitglieder** mit Namen und Online-Status
- Auswahl eines Mitglieds zeigt:
  - Übungen pro Gerät (Boden, Pauschenpferd, Ringe, Sprung, Barren, Reck)
  - Bewertungen der Übungen (inkl. Bewertungsfunktion)
  - Schwierigkeitswerte der Übungen

---

#### 🏆 Wettkämpfe
- **Übersicht aller Wettkämpfe:**
  - Name, Ort, Datum
- **Teilnahmemanagement:**
  - Anmeldung / Abmeldung für Wettkämpfe
- **Punkteverwaltung:**
  - Eintragen von Punkten pro Gerät
  - Automatische Berechnung und Anzeige der Rangliste:
    - Sortierung nach: Gesamtpunkte, Durchschnittspunkte, Anzahl Geräte

---

### ✍️ Übungserstellung
- Auswahl aus den 6 Geräten
- Anzeige von **geräteabhängigen Informationen**
- Start der **Übungsbearbeitung**:
  - Liste der Elemente (mit Aktionen: hoch, runter, löschen)
  - Speichern der Übung
  - Berechnung: Schwierigkeit, Fehler, Warnungen
  - Bewertungen anderer Nutzer:innen
- Wahl zwischen:
  - **Wettkampfübung**
  - **Wunschübung**
  - Kopieren zwischen beiden Typen

#### ➕ Hinzufügen von Elementen
- Elementliste sortierbar nach:
  - Schwierigkeit
  - Gruppe (auf-/absteigend)
- Filteroptionen:
  - Schwierigkeit, Gruppe, gelernte Elemente, Stichwort
- Klick auf ein Element zeigt:
  - Titel, Bild, Name, Beschreibung, Elementgruppe, Schwierigkeit, Übungsende (gültig: ja/nein)
  - Element als "gelernt" markieren
  - Element zur Übung hinzufügen

---

## 🛠️ Software Umsetzung
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Python mit Flask  
- **Datenbank:** MongoDB  
- **Hosting:**
  - Frontend: GitHub Pages
  - Backend: Render.com (Render Server)
