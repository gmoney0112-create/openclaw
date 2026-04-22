import csv
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

from linkedin_bot import LinkedInBot

load_dotenv()

PROSPECTS_FILE = "prospects.csv"
RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)


def load_prospects(filepath: str) -> list[dict]:
    with open(filepath, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_results(results: list[dict], filepath: Path):
    if not results:
        return
    fieldnames = list(results[0].keys())
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    print(f"\n[RESULTS] Saved to {filepath}")


def main():
    user_data_dir = os.getenv("CHROME_USER_DATA_DIR")
    profile = os.getenv("CHROME_PROFILE", "Default")
    max_connections = int(os.getenv("MAX_CONNECTIONS", 15))

    if not user_data_dir:
        print("[ERROR] CHROME_USER_DATA_DIR not set in .env")
        sys.exit(1)

    prospects = load_prospects(PROSPECTS_FILE)
    print(f"[RUN] Loaded {len(prospects)} prospects. Max to process: {max_connections}")

    bot = LinkedInBot(user_data_dir=user_data_dir, profile=profile)

    try:
        bot.start()

        if not bot._is_logged_in():
            print("[ERROR] Not logged in to LinkedIn. Open Chrome, log in manually, then re-run.")
            sys.exit(1)

        print("[RUN] LinkedIn session confirmed. Starting outreach...\n")

        results = []
        sent_count = 0

        for prospect in prospects:
            if sent_count >= max_connections:
                print(f"\n[STOP] Reached max connections limit ({max_connections})")
                break

            result = bot.send_connection(
                name=prospect["name"],
                linkedin_url=prospect["linkedin_url"],
                template_key=prospect.get("message_template_key", "generic"),
            )
            results.append(result)

            if result["status"] == "SUCCESS":
                sent_count += 1

        success = sum(1 for r in results if r["status"] == "SUCCESS")
        skipped = sum(1 for r in results if "ALREADY" in r["status"])
        failed = sum(
            1 for r in results
            if "FAILED" in r["status"] or r["status"] in ("CONNECT_BTN_NOT_FOUND", "UNVERIFIED")
        )

        print(f"\n{'='*50}")
        print(f"  DONE — {len(results)} processed")
        print(f"  SUCCESS:  {success}")
        print(f"  SKIPPED:  {skipped}")
        print(f"  FAILED:   {failed}")
        print(f"{'='*50}")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_results(results, RESULTS_DIR / f"results_{timestamp}.csv")

    finally:
        bot.stop()


if __name__ == "__main__":
    main()
