"""
DataPrivacy Doctor — synthetic demo dataset generator.

Produces a realistic volunteer-registration CSV that contains:
- Direct identifiers: full_name, email, phone, date_of_birth, postcode
- Quasi-identifiers: age, city, occupation, gender
- Sensitive attributes: health_conditions
- Free text: notes
- Low-risk columns: volunteer_id, joined_date, skills (category)
"""

import csv
import io
import random
import uuid

FIRST_NAMES = [
    "Amara",
    "James",
    "Sofia",
    "Kwame",
    "Elena",
    "Tariq",
    "Nadia",
    "Oliver",
    "Fatima",
    "Lucas",
    "Chiara",
    "Akosua",
    "Ben",
    "Priya",
    "Samuel",
]
LAST_NAMES = [
    "Osei",
    "Davies",
    "Reyes",
    "Ibrahim",
    "Novak",
    "Walsh",
    "Morgan",
    "Okafor",
    "Chen",
    "Patel",
    "Rossi",
    "Mensah",
    "Clarke",
    "Singh",
    "Ali",
]
CITIES = ["London", "Birmingham", "Manchester", "Leeds", "Bristol", "Edinburgh", "Cardiff"]
OCCUPATIONS = [
    "Teacher",
    "Nurse",
    "Software Engineer",
    "Social Worker",
    "Journalist",
    "Student",
    "Lawyer",
    "Doctor",
    "Researcher",
    "Artist",
]
HEALTH_CONDITIONS = [
    "",
    "",
    "",
    "",
    "",  # most volunteers have blank
    "Asthma",
    "Diabetes (Type 2)",
    "Anxiety",
    "None declared",
]
SKILLS = ["Communications", "Finance", "Legal", "Tech", "Logistics", "Fundraising", "Research"]
NOTES_TEMPLATES = [
    "Available weekends only.",
    "Speaks French and Arabic.",
    "Contact via email: {email}. Prefers afternoon shifts.",
    "Has own transport. Can cover {city} area.",
    "Disability support needed — please contact before assigning.",
    "Previous NGO experience. Very reliable.",
    "Phone {phone} is best before 6pm.",
    "",
]

_rng = random.Random(42)


def generate_synthetic_volunteer_csv(num_rows: int = 60) -> bytes:
    """
    Generate a synthetic volunteer-registration CSV as bytes.
    Intentionally includes privacy risks for demo purposes.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "volunteer_id",
            "full_name",
            "email",
            "phone",
            "date_of_birth",
            "age",
            "gender",
            "city",
            "postcode",
            "occupation",
            "health_conditions",
            "skills",
            "notes",
            "joined_date",
        ]
    )

    postcodes = ["E1 6RF", "B2 4QA", "M1 3FF", "LS1 2AD", "BS1 5TR", "EH1 1BB", "CF10 1GH"]

    for _i in range(num_rows):
        first = _rng.choice(FIRST_NAMES)
        last = _rng.choice(LAST_NAMES)
        email = f"{first.lower()}.{last.lower()}{_rng.randint(1, 99)}@volunteer.example"
        phone = f"+44 7{_rng.randint(100, 999)} {_rng.randint(100, 999)} {_rng.randint(1000, 9999)}"
        birth_year = _rng.randint(1960, 2002)
        birth_month = _rng.randint(1, 12)
        birth_day = _rng.randint(1, 28)
        age = 2025 - birth_year
        city = _rng.choice(CITIES)
        postcode = _rng.choice(postcodes)
        occupation = _rng.choice(OCCUPATIONS)
        health = _rng.choice(HEALTH_CONDITIONS)
        skills = _rng.choice(SKILLS)
        note_tmpl = _rng.choice(NOTES_TEMPLATES)
        note = note_tmpl.format(email=email, city=city, phone=phone) if note_tmpl else ""
        joined = f"2024-{_rng.randint(1, 12):02d}-{_rng.randint(1, 28):02d}"
        vol_id = str(uuid.UUID(int=_rng.getrandbits(128)))[:8].upper()

        writer.writerow(
            [
                vol_id,
                f"{first} {last}",
                email,
                phone,
                f"{birth_year}-{birth_month:02d}-{birth_day:02d}",
                age,
                _rng.choice(["Male", "Female", "Non-binary", "Prefer not to say"]),
                city,
                postcode,
                occupation,
                health,
                skills,
                note,
                joined,
            ]
        )

    return output.getvalue().encode("utf-8")
