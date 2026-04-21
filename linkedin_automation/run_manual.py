import csv
import os
import random
import sys
import time
import webbrowser
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

from message_templates import get_message


@dataclass(frozen=True)
class Prospect:
    name: str
    title: str
    company: str
    linkedin_url: str
    message_template_key: str


PROSPECTS_FILE = Path("prospects.csv")
RESULTS_DIR = Path("results")


def _wait():
    delay_min = float(os.getenv("DELAY_MIN", "3"))
    delay_max = float(os.getenv("DELAY_MAX", "7"))
    time.sleep(random.uniform(delay_min, delay_max))


def load_prospects(filepath: Path) -> list[Prospect]:
    with filepath.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        prospects: list[Prospect] = []
        for row in reader:
            prospects.append(
                Prospect(
                    name=(row.get("name") or "").strip(),
                    title=(row.get("title") or "").strip(),
                    company=(row.get("company") or "").strip(),
                    linkedin_url=(row.get("linkedin_url") or "").strip(),
                    message_template_key=(row.get("message_template_key") or "generic").strip()
                    or "generic",
                )
            )
        return prospects


def save_results(rows: list[dict], out_path: Path) -> None:
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    load_dotenv()

    if not PROSPECTS_FILE.exists():
        print(f"[ERROR] Missing {PROSPECTS_FILE}")
        return 1

    max_prospects = int(os.getenv("MAX_PROSPECTS", "15"))
    prospects = load_prospects(PROSPECTS_FILE)[:max_prospects]
    print(f"[RUN] Loaded {len(prospects)} prospects (max {max_prospects}).")

    RESULTS_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_path = RESULTS_DIR / f"results_{stamp}.csv"
    messages_dir = RESULTS_DIR / f"messages_{stamp}"
    messages_dir.mkdir(exist_ok=True)

    rows: list[dict] = []

    for idx, prospect in enumerate(prospects, start=1):
        if not prospect.linkedin_url.startswith("https://www.linkedin.com/in/"):
            status = "SKIP_BAD_URL"
            note = "Expected a direct profile URL like https://www.linkedin.com/in/<handle>/"
            print(f"[{idx}/{len(prospects)}] {prospect.name}: {status}")
            rows.append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "name": prospect.name,
                    "linkedin_url": prospect.linkedin_url,
                    "status": status,
                    "note": note,
                }
            )
            continue

        message = get_message(prospect.message_template_key, prospect.name)
        msg_path = messages_dir / f"{idx:03d}_{prospect.name.replace(' ', '_')}.txt"
        msg_path.write_text(message, encoding="utf-8")

        print(f"\n[{idx}/{len(prospects)}] {prospect.name} — {prospect.title} @ {prospect.company}")
        print(f"URL: {prospect.linkedin_url}")
        print(f"Message file: {msg_path}")
        print("Opening profile in your browser...")
        webbrowser.open(prospect.linkedin_url, new=2)

        print("\nMANUAL STEP:")
        print("- Review the profile")
        print("- Click Connect (and 'Add a note' if desired)")
        print("- Paste the message from the file above")
        print("- Send the invitation")

        choice = input("Enter result [s=sent, p=pending/already, k=skip, f=fail, q=quit]: ").strip().lower()
        if choice == "q":
            break

        status_map = {
            "s": "SENT_MANUAL",
            "p": "ALREADY_PENDING_OR_CONNECTED",
            "k": "SKIPPED",
            "f": "FAILED",
        }
        status = status_map.get(choice, "UNKNOWN")
        rows.append(
            {
                "timestamp": datetime.now().isoformat(),
                "name": prospect.name,
                "linkedin_url": prospect.linkedin_url,
                "status": status,
                "note": prospect.message_template_key,
                "message_preview": message[:120],
            }
        )
        _wait()

    save_results(rows, results_path)
    print(f"\n[RESULTS] Saved: {results_path}")
    print(f"[RESULTS] Messages: {messages_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

