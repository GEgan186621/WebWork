# WebWork
#Checks each site URL in your CSV to determine if it’s searchable for roles matching your criteria (Senior/Business Analyst, Data Insights, AI-related; Remote / Portland-based / U.S. remote).

#Appends the result (“Yes” if searchable, “No” if not) into a new column called Connect.
##Web Crawler for Job Sites

%pip install requests BeautifulSoup4

import pandas as pd
import requests
from bs4 import BeautifulSoup

# Load the CSV
df = pd.read_csv(r"C:\Users\egan0\OneDrive\Documents\Resume 2025\Jobs folder\updated_job_websites.csv")

# Function to test if a site returns search results
def test_site_search(url):
    try:
        # Simulate a basic GET or search query
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return False, None

        # Check if search function exists on the page
        html = BeautifulSoup(resp.text, "html.parser")
        keywords = ["search", "job", "role", "query", "position"]
        has_search = any(html.find(lambda tag: tag.name in ["form", "input"] and tag.get("name") in keywords)
                         for tag in html.find_all())

        # For quick validation, look for keyword strings on the landing page
        candidates = ["analyst", "data", "insight", "ai", "business"]
        text = html.get_text(separator=" ").lower()
        found = any(word in text for word in candidates)

        return has_search or found, "; ".join([w for w in candidates if w in text][:3])
    except Exception as e:
        return False, None

# Create the new columns
df["Connect"] = ""
df["ExampleRoles"] = ""

# Loop through each URL
for idx, row in df.iterrows():
    url = row["URL"]  # or adjust to your actual column name
    ok, examples = test_site_search(url)
    df.at[idx, "Connect"] = "Yes" if ok else "No"
    df.at[idx, "ExampleRoles"] = examples or ""

# Save the updated CSV
df.to_csv("updated_job_websites_with_connect.csv", index=False)
print("✅ Completed. 'Connect' column added, CSV saved.")
