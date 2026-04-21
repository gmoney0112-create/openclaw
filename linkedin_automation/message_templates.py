TEMPLATES = {
    "coach_outreach": (
        "Hi {first_name}, I help coaches like yourself automate client follow-ups "
        "and onboarding with AI — saving 5-10 hours/week. Would love to connect "
        "and share what's working for others in your space."
    ),
    "generic": (
        "Hi {first_name}, I came across your profile and would love to connect. "
        "I work on AI automation systems for service businesses."
    ),
}


def get_message(template_key: str, name: str) -> str:
    first_name = name.strip().split()[0] if name and name.strip() else "there"
    template = TEMPLATES.get(template_key, TEMPLATES["generic"])
    return template.format(first_name=first_name)

