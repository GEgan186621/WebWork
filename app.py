from flask import Flask, render_template, jsonify, request, send_file
import requests
from bs4 import BeautifulSoup
import csv
import re
import time
import os
import threading
from datetime import datetime
import json

app = Flask(__name__)

# Global variables to store scan results and status
scan_results = []
scan_status = {"running": False, "progress": 0, "current_site": ""}

# Define job boards and search queries
job_boards = {
    "Indeed": "https://www.indeed.com/jobs?q=Senior+Business+Analyst+Data+AI&l=Portland&remotejob=1",
    "Remote OK": "https://remoteok.com/remote-business-analyst-jobs",
    "Built In": "https://builtin.com/jobs/portland/data-analytics?f%5B0%5D=job-category_data-analytics",
    "PortlandTech": "https://portlandtech.org/jobs",
    "The Silicon Forest": "https://www.thesiliconforest.com/jobs"
}

# Resume keywords to match
resume_keywords = {
    "Excel", "Power BI", "SQL", "Python", "UAT", "Agile", "Jira",
    "Azure", "Dashboards", "Data", "Business Process", "SDLC", "Reporting"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
}

def scan_job_boards():
    """Background function to scan job boards"""
    global scan_results, scan_status
    
    scan_status["running"] = True
    scan_status["progress"] = 0
    scan_results = []
    
    total_boards = len(job_boards)
    
    for i, (name, url) in enumerate(job_boards.items()):
        scan_status["current_site"] = name
        scan_status["progress"] = int((i / total_boards) * 100)
        
        print(f"Checking {name}...")
        try:
            for attempt in range(3):  # retry loop
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 429:  # rate-limited
                    print(f"Rate limited. Retrying {name} in 5 seconds...")
                    time.sleep(5)
                else:
                    break

            status = "Healthy" if response.status_code == 200 else f"Error {response.status_code}"

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                text = soup.get_text().lower()
                found_jobs = bool(re.search(r'business analyst|data analyst|senior analyst|ai', text))

                match_keywords = set()
                if found_jobs:
                    for word in resume_keywords:
                        if word.lower() in text:
                            match_keywords.add(word)

                    match_percent = round((len(match_keywords) / len(resume_keywords)) * 100, 2)
                    print(f"Matched keywords on {name}: {sorted(match_keywords)}")
                else:
                    match_percent = 0
                    match_keywords = set()
            else:
                found_jobs = False
                match_percent = 0
                match_keywords = set()

            result = {
                "name": name,
                "url": url,
                "status": status,
                "jobs_found": found_jobs,
                "match_percent": match_percent,
                "matched_keywords": sorted(list(match_keywords)),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            scan_results.append(result)

        except Exception as e:
            result = {
                "name": name,
                "url": url,
                "status": "Error",
                "jobs_found": False,
                "match_percent": 0,
                "matched_keywords": [],
                "error": str(e),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            scan_results.append(result)
            print(f"Error checking {name}: {e}")
        
        time.sleep(1)  # Be respectful to servers

    scan_status["running"] = False
    scan_status["progress"] = 100
    scan_status["current_site"] = "Complete"
    
    # Save to CSV
    save_to_csv()

def save_to_csv():
    """Save results to CSV file"""
    filename = f"job_board_matches_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    with open(filename, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Job Board", "URL", "Status", "Jobs Found", "Match Percent", "Matched Keywords", "Timestamp"])
        
        for result in scan_results:
            writer.writerow([
                result["name"],
                result["url"],
                result["status"],
                "Yes" if result["jobs_found"] else "No",
                f"{result['match_percent']}%",
                ", ".join(result["matched_keywords"]),
                result["timestamp"]
            ])
    
    print(f"Results saved to {filename}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/start-scan', methods=['POST'])
def start_scan():
    global scan_status
    
    if scan_status["running"]:
        return jsonify({"error": "Scan already in progress"}), 400
    
    # Start scan in background thread
    thread = threading.Thread(target=scan_job_boards)
    thread.daemon = True
    thread.start()
    
    return jsonify({"message": "Scan started"})

@app.route('/api/scan-status')
def get_scan_status():
    return jsonify(scan_status)

@app.route('/api/results')
def get_results():
    return jsonify(scan_results)

@app.route('/api/download-csv')
def download_csv():
    if not scan_results:
        return jsonify({"error": "No results available"}), 400
    
    filename = f"job_board_matches_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    with open(filename, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Job Board", "URL", "Status", "Jobs Found", "Match Percent", "Matched Keywords", "Timestamp"])
        
        for result in scan_results:
            writer.writerow([
                result["name"],
                result["url"],
                result["status"],
                "Yes" if result["jobs_found"] else "No",
                f"{result['match_percent']}%",
                ", ".join(result["matched_keywords"]),
                result["timestamp"]
            ])
    
    return send_file(filename, as_attachment=True)

@app.route('/api/keywords')
def get_keywords():
    return jsonify(list(resume_keywords))

@app.route('/api/job-boards')
def get_job_boards():
    return jsonify(job_boards)

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    app.run(debug=True, host='0.0.0.0', port=5000)