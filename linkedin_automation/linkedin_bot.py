import random
import time
import os
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError
from message_templates import get_message


class LinkedInBot:
    def __init__(self, user_data_dir: str, profile: str = "Default"):
        self.user_data_dir = user_data_dir
        self.profile = profile
        self.browser = None
        self._pw = None
        self.page = None

    def start(self):
        self._pw = sync_playwright().start()
        self.browser = self._pw.chromium.launch_persistent_context(
            user_data_dir=self.user_data_dir,
            channel="chrome",
            headless=False,
            args=["--profile-directory=" + self.profile],
            viewport={"width": 1280, "height": 800},
        )
        self.page = self.browser.pages[0] if self.browser.pages else self.browser.new_page()
        print("[BOT] Browser started with existing Chrome session.")

    def stop(self):
        if self.browser:
            self.browser.close()
        if self._pw:
            self._pw.stop()
        print("[BOT] Browser closed.")

    def _wait(self, extra: float = 0):
        delay = random.uniform(
            float(os.getenv("DELAY_MIN", 3)),
            float(os.getenv("DELAY_MAX", 7)),
        ) + extra
        time.sleep(delay)

    def _is_logged_in(self) -> bool:
        self.page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
        self._wait()
        return "feed" in self.page.url

    def _go_to_profile(self, url: str) -> bool:
        try:
            self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            self._wait()
            if "linkedin.com/in/" not in self.page.url:
                print(f"  [WARN] Redirected away from profile: {self.page.url}")
                return False
            return True
        except PWTimeoutError:
            print(f"  [ERROR] Timeout loading profile: {url}")
            return False

    CONNECT_SELECTORS = [
        'button[aria-label*="Connect"]',
        'div[data-view-name="profile-action-bar"] button[aria-label*="Connect"]',
        'button:has-text("Connect")',
    ]

    def _find_connect_button(self):
        for selector in self.CONNECT_SELECTORS:
            try:
                btn = self.page.locator(selector).first
                if btn.is_visible(timeout=3000):
                    return btn
            except Exception:
                continue

        # Try "More" dropdown
        try:
            more_btn = self.page.locator('button[aria-label="More actions"]').first
            if more_btn.is_visible(timeout=3000):
                more_btn.click()
                self._wait(1)
                for selector in self.CONNECT_SELECTORS:
                    try:
                        btn = self.page.locator(selector).first
                        if btn.is_visible(timeout=2000):
                            return btn
                    except Exception:
                        continue
        except Exception:
            pass

        return None

    def send_connection(self, name: str, linkedin_url: str, template_key: str) -> dict:
        result = {
            "name": name,
            "url": linkedin_url,
            "status": "UNKNOWN",
            "note": "",
            "timestamp": datetime.now().isoformat(),
        }

        print(f"\n[BOT] Processing: {name}")
        print(f"      URL: {linkedin_url}")

        if not self._go_to_profile(linkedin_url):
            result["status"] = "FAILED_NAVIGATION"
            return result

        try:
            already_connected = self.page.locator('button[aria-label="Message"]').is_visible(timeout=3000)
        except Exception:
            already_connected = False
        if already_connected:
            print(f"  [SKIP] Already connected with {name}")
            result["status"] = "ALREADY_CONNECTED"
            return result

        try:
            pending = self.page.locator('button[aria-label*="Pending"]').is_visible(timeout=2000)
        except Exception:
            pending = False
        if pending:
            print(f"  [SKIP] Request already pending for {name}")
            result["status"] = "ALREADY_PENDING"
            return result

        connect_btn = self._find_connect_button()
        if connect_btn is None:
            print(f"  [WARN] Connect button not found for {name}")
            result["status"] = "CONNECT_BTN_NOT_FOUND"
            return result

        connect_btn.click()
        self._wait(1)

        # Handle "How do you know X?" modal
        try:
            other_btn = self.page.locator('button[aria-label="Other"]').first
            if other_btn.is_visible(timeout=3000):
                other_btn.click()
                self._wait(1)
        except Exception:
            pass

        # Add a note
        try:
            add_note_btn = self.page.locator('button[aria-label="Add a note"]').first
            if not add_note_btn.is_visible(timeout=5000):
                add_note_btn = self.page.locator('button:has-text("Add a note")').first
            add_note_btn.click()
            self._wait(1)
        except Exception:
            print(f"  [WARN] Could not open note field for {name}, sending without note")
            try:
                send_btn = self.page.locator('button[aria-label="Send without a note"]').first
                send_btn.click()
                self._wait(2)
                result["status"] = "SENT_NO_NOTE"
                result["note"] = "(no note)"
                return result
            except Exception as e:
                result["status"] = "FAILED_SEND"
                result["note"] = str(e)
                return result

        message = get_message(template_key, name)
        try:
            note_field = self.page.locator('textarea[name="message"]').first
            note_field.wait_for(state="visible", timeout=5000)
            note_field.fill(message)
            self._wait(1)
        except Exception as e:
            result["status"] = "FAILED_NOTE_FIELD"
            result["note"] = str(e)
            return result

        try:
            send_btn = self.page.locator('button[aria-label="Send invitation"]').first
            if not send_btn.is_visible(timeout=3000):
                send_btn = self.page.locator('button:has-text("Send")').last
            send_btn.click()
            self._wait(2)
        except Exception as e:
            result["status"] = "FAILED_FINAL_SEND"
            result["note"] = str(e)
            return result

        still_has_connect = self._find_connect_button() is not None
        if still_has_connect:
            result["status"] = "UNVERIFIED"
            result["note"] = "Connect button still visible after send attempt"
        else:
            result["status"] = "SUCCESS"
            result["note"] = message[:80]
            print(f"  [SUCCESS] Connection request sent to {name}")

        return result
