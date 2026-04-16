# polytech_e2e.py
import asyncio
import argparse
import os
import json
import time
import sys
from datetime import datetime
from playwright.async_api import async_playwright

# Ajouter le dossier courant au path pour importer scenarios.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from scenarios import SCENARIOS
except ImportError:
    SCENARIOS = []

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_URL = "http://localhost:5173"
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")
FIXTURES_DIR = os.path.join(BASE_DIR, "fixtures")

class ScenarioResult:
    def __init__(self, sc_id, name, status="SKIP", duration=0, message="", screenshot=None):
        self.sc_id = sc_id
        self.name = name
        self.status = status
        self.duration = duration
        self.message = message
        self.screenshot = screenshot
        self.console_errors = []
        self.network_errors = []

class Context:
    def __init__(self, url, fixtures_dir, llm_timeout):
        self.url = url
        self.fixtures_dir = fixtures_dir
        self.llm_timeout = llm_timeout

class E2ETestRunner:
    def __init__(self, args):
        self.args = args
        self.results = []
        self.ctx = Context(args.url, FIXTURES_DIR, args.llm_timeout)
        
    async def run(self):
        os.makedirs(REPORTS_DIR, exist_ok=True)
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
        
        # Filtrage des scénarios
        to_run = []
        if self.args.all:
            to_run = SCENARIOS
        elif self.args.tag:
            to_run = [s for s in SCENARIOS if any(t in self.args.tag for t in s.tags)]
        elif self.args.sc:
            to_run = [s for s in SCENARIOS if s.sc_id in self.args.sc]
        elif self.args.rerun_fails:
            try:
                fails_path = os.path.join(BASE_DIR, "fails.json")
                with open(fails_path, "r") as f:
                    failed_ids = json.load(f).get("fails", [])
                to_run = [s for s in SCENARIOS if s.sc_id in failed_ids]
            except:
                print("Aucun fichier fails.json trouvé. Lancez --all d'abord.")
                return

        if not to_run:
            print("Aucun scénario à lancer.")
            return

        print(f"Lancement de {len(to_run)} scénarios...")
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context(viewport={'width': 1024, 'height': 768})
            page = await context.new_page()
            
            # Capture console errors
            page.on("console", lambda msg: self.log_console(msg))
            page.on("requestfailed", lambda req: self.log_network_fail(req))

            for sc in to_run:
                print(f"[{sc.sc_id}] {sc.name}...", end="", flush=True)
                start = time.time()
                try:
                    # Timeout global par scénario de 60s
                    result = await asyncio.wait_for(sc.run_func(page, self.ctx), timeout=60.0)
                    duration = (time.time() - start) * 1000
                    
                    if isinstance(result, tuple):
                        status, msg = result
                    else:
                        status, msg = "PASS", ""
                        
                    res = ScenarioResult(sc.sc_id, sc.name, status, duration, msg)
                    if self.args.verbose or status != "PASS":
                        if not self.args.no_screenshots:
                            shot_name = f"{sc.sc_id}_{status.lower()}.png"
                            shot_path = os.path.join(SCREENSHOTS_DIR, shot_name)
                            await page.screenshot(path=shot_path)
                            res.screenshot = os.path.relpath(shot_path, BASE_DIR)
                    print(f" {status}")
                    self.results.append(res)
                except asyncio.TimeoutError:
                    duration = (time.time() - start) * 1000
                    shot_name = f"{sc.sc_id}_timeout.png"
                    shot_path = os.path.join(SCREENSHOTS_DIR, shot_name)
                    await page.screenshot(path=shot_path)
                    print(f" TIMEOUT")
                    self.results.append(ScenarioResult(sc.sc_id, sc.name, "FAIL", duration, "Scénario timeout (60s)", os.path.relpath(shot_path, BASE_DIR)))
                except Exception as e:
                    duration = (time.time() - start) * 1000
                    shot_name = f"{sc.sc_id}_fail.png"
                    shot_path = os.path.join(SCREENSHOTS_DIR, shot_name)
                    await page.screenshot(path=shot_path)
                    print(f" FAIL")
                    self.results.append(ScenarioResult(sc.sc_id, sc.name, "FAIL", duration, str(e), os.path.relpath(shot_path, BASE_DIR)))

            await browser.close()
            
        self.generate_report()

    def log_console(self, msg):
        if msg.type == "error":
            if self.results:
                self.results[-1].console_errors.append(msg.text)

    def log_network_fail(self, req):
        if self.results:
            self.results[-1].network_errors.append({"url": req.url, "error": req.failure})

    def generate_report(self):
        now_str = datetime.now().strftime("%Y-%m-%d_%H%M")
        report_name = f"CR_E2E_{now_str}.md"
        report_path = os.path.join(REPORTS_DIR, report_name)
        
        with open(report_path, "w") as f:
            f.write("# CR Test E2E — PolytechRevision\n")
            f.write(f"Date : {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
            f.write(f"URL : {self.args.url}\n\n")
            
            f.write("## Résumé\n")
            f.write("| ID | Scénario | Statut | Durée | Message |\n")
            f.write("|----|----------|--------|-------|---------|\n")
            for r in self.results:
                f.write(f"| {r.sc_id} | {r.name} | {r.status} | {r.duration:.0f}ms | {r.message} |\n")
            
            f.write("\n## Détail des erreurs\n")
            for r in [r for r in self.results if r.status == "FAIL"]:
                f.write(f"### ❌ {r.sc_id} : {r.name}\n")
                f.write(f"- Message : {r.message}\n")
                if r.screenshot:
                    f.write(f"- Screenshot : `{r.screenshot}`\n")
                if r.console_errors:
                    f.write("- Console JS :\n  ```\n  " + "\n  ".join(r.console_errors) + "\n  ```\n")
                f.write("\n")

        print(f"\nRapport généré : {report_path}")
        
        # fails.json
        fails = [r.sc_id for r in self.results if r.status in ("FAIL", "WARN")]
        fails_path = os.path.join(BASE_DIR, "fails.json")
        with open(fails_path, "w") as f:
            json.dump({"fails": fails, "last_report": report_path}, f)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--tag", action="append")
    parser.add_argument("--sc", action="append")
    parser.add_argument("--rerun-fails", action="store_true")
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--llm-timeout", type=int, default=45000)
    parser.add_argument("--no-screenshots", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    
    asyncio.run(E2ETestRunner(args).run())
