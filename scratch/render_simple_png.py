import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# 1. Generate SVG & HTML
import subprocess
subprocess.run(["python", "scratch/generate_simple_diagram.py"], check=True)

# 2. Render PNG via Selenium
options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1700,1050")
options.add_argument("--hide-scrollbars")

driver = webdriver.Chrome(options=options)
html_path = os.path.abspath("d:/STEVE/Project NFT Marketplace/design/arsitektur-simple.html")
driver.get(f"file:///{html_path}")

diagram_elem = driver.find_element(By.ID, "diagram-box")
target_png = "d:/STEVE/Project NFT Marketplace/design/arsitektur-simple.png"
diagram_elem.screenshot(target_png)
driver.quit()

if os.path.exists(target_png):
    print(f"SUCCESS: Rendered {target_png} ({os.path.getsize(target_png)} bytes)")
else:
    print("FAILED to create PNG")
