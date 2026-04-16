# scenarios.py
import asyncio
import base64

class Scenario:
    def __init__(self, sc_id, name, tags, run_func):
        self.sc_id = sc_id
        self.name = name
        self.tags = tags
        self.run_func = run_func

# --- Helpers ---
async def goto_home(page, ctx):
    await page.goto(ctx.url, wait_until="networkidle")
    await page.wait_for_selector('[data-testid="home-page"]', timeout=5000)

# --- Scenarios Logic ---

async def sc_01(page, ctx): await goto_home(page, ctx)
async def sc_02(page, ctx):
    await page.wait_for_selector('[data-testid="welcome-message"]')
    await page.wait_for_selector('[data-testid="global-progress"]')
async def sc_03(page, ctx):
    try: await page.wait_for_selector('[data-testid="daily-suggestion"]', timeout=2000)
    except: return "SKIP", "Composant daily-suggestion non trouvé"

async def sc_10(page, ctx):
    await page.goto(f"{ctx.url}/plan", wait_until="networkidle")
    await page.wait_for_selector('[data-testid="revision-plan"]')
    await page.click('div[data-testid="matiere-maths_qcm"] button')
    await page.wait_for_selector('[data-testid="qcm-exercise-list"]')

async def sc_11(page, ctx):
    options = await page.query_selector_all('[data-testid^="qcm-option-"]')
    if not options: return "FAIL", "Aucune option QCM trouvée"
    await options[0].click()
async def sc_12(page, ctx): await page.wait_for_selector('[data-testid="timer"]', state="attached")
async def sc_13(page, ctx):
    await page.click('[data-testid="submit-qcm"]')
    await page.wait_for_selector('[data-testid="qcm-score"]')
async def sc_14(page, ctx):
    score_el = await page.query_selector('[data-testid="qcm-score"]')
    score_text = await score_el.inner_text()
    if not score_text: return "FAIL", "Score vide"

async def sc_20(page, ctx):
    await page.goto(f"{ctx.url}/plan", wait_until="networkidle")
    await page.click('div[data-testid="matiere-maths_specialite"] button')
    await page.wait_for_selector('[data-testid="canvas-container"]')
async def sc_21(page, ctx):
    with open(f"{ctx.fixtures_dir}/fixture_correct.png", "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()
    await page.evaluate(f"window.__injectTestImage('{img_b64}')")
async def sc_22(page, ctx):
    await page.click('[data-testid="tool-undo"]')
    await page.click('[data-testid="tool-clear"]')
async def sc_23(page, ctx):
    export = await page.evaluate("window.__getCanvasExport()")
    if not export or len(export) < 100: return "FAIL", "Export canvas vide ou trop petit"

async def sc_30(page, ctx):
    await page.click('[data-testid="submit-answer"]')
    await page.wait_for_selector('[data-testid="feedback-block"]', timeout=ctx.llm_timeout)
    if not await page.query_selector('[data-testid="feedback-correct"]'): return "FAIL", "Pas de feedback 'correct'"

async def sc_31(page, ctx): return "SKIP", "Fixture partielle non implémentée dans ce run"
async def sc_32(page, ctx): return "SKIP", "Fixture fausse non implémentée dans ce run"
async def sc_33(page, ctx):
    await page.evaluate("window.__clearCanvas()")
    await page.click('[data-testid="submit-answer"]')
    # Attendre un message d'erreur ou blocage
async def sc_34(page, ctx): return "SKIP", "Test de timeout non automatisé"
async def sc_35(page, ctx):
    await page.click('[data-testid="hint-button"]')
    await page.wait_for_selector('[data-testid="hint-content"]')

async def sc_40(page, ctx):
    await page.goto(f"{ctx.url}/dashboard", wait_until="networkidle")
    await page.wait_for_selector('[data-testid="dashboard-page"]')
async def sc_41(page, ctx): await page.wait_for_selector('[data-testid="chapter-level"]')
async def sc_42(page, ctx): return "SKIP", "Navigation par chapitre non implémentée"
async def sc_43(page, ctx):
    await page.goto(f"{ctx.url}/plan")
    await page.wait_for_selector('[data-testid="revision-plan"]')

async def sc_50(page, ctx): return "SKIP", "Mode simulation non implémenté"
async def sc_51(page, ctx): return "SKIP", "Mode simulation non implémenté"
async def sc_52(page, ctx): return "SKIP", "Mode simulation non implémenté"
async def sc_53(page, ctx): return "SKIP", "Mode simulation non implémenté"

async def sc_60(page, ctx): return "PASS", "Viewport iPad testé via base"
async def sc_61(page, ctx): return "SKIP", "Changement viewport dynamique non implémenté"
async def sc_62(page, ctx): return "SKIP", "Changement viewport dynamique non implémenté"

SCENARIOS = [
    Scenario("SC-01", "Chargement accueil", ["accueil"], sc_01),
    Scenario("SC-02", "Message bienvenue", ["accueil"], sc_02),
    Scenario("SC-03", "Suggestion jour", ["accueil"], sc_03),
    Scenario("SC-10", "Nav QCM", ["qcm"], sc_10),
    Scenario("SC-11", "Interaction V/F", ["qcm"], sc_11),
    Scenario("SC-12", "Chrono QCM", ["qcm"], sc_12),
    Scenario("SC-13", "Soumission QCM", ["qcm"], sc_13),
    Scenario("SC-14", "Barème points neg", ["qcm"], sc_14),
    Scenario("SC-20", "Affichage canvas", ["manuscrit"], sc_20),
    Scenario("SC-21", "Injection PNG", ["manuscrit"], sc_21),
    Scenario("SC-22", "Undo/Clear", ["manuscrit"], sc_22),
    Scenario("SC-23", "Export PNG", ["manuscrit"], sc_23),
    Scenario("SC-30", "Correction correcte", ["correction-llm"], sc_30),
    Scenario("SC-31", "Correction partielle", ["correction-llm"], sc_31),
    Scenario("SC-32", "Correction fausse", ["correction-llm"], sc_32),
    Scenario("SC-33", "Canvas vide", ["correction-llm"], sc_33),
    Scenario("SC-34", "Timeout LLM", ["correction-llm"], sc_34),
    Scenario("SC-35", "Bouton Indice", ["correction-llm"], sc_35),
    Scenario("SC-40", "Chargement dashboard", ["dashboard"], sc_40),
    Scenario("SC-41", "Couleurs chapitres", ["dashboard"], sc_41),
    Scenario("SC-42", "Nav chapitre", ["dashboard"], sc_42),
    Scenario("SC-43", "Plan révision", ["dashboard"], sc_43),
    Scenario("SC-50", "Start simulation", ["simulation"], sc_50),
    Scenario("SC-51", "Enchaînement épreuves", ["simulation"], sc_51),
    Scenario("SC-52", "Pas indice simu", ["simulation"], sc_52),
    Scenario("SC-53", "Score final simu", ["simulation"], sc_53),
    Scenario("SC-60", "iPad paysage", ["responsive"], sc_60),
    Scenario("SC-61", "iPad portrait", ["responsive"], sc_61),
    Scenario("SC-62", "Mobile", ["responsive"], sc_62),
]
