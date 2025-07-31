import React, { useState, useEffect } from 'react';
import { Play, Download, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface ScanResult {
  name: string;
  url: string;
  status: string;
  jobsFound: boolean;
  matchPercent: number;
  matchedKeywords: string[];
  timestamp: string;
  error?: string;
  jobTitles: string[];
  applicationUrls: string[];
}

interface ScanStatus {
  running: boolean;
  progress: number;
  currentSite: string;
}

const JOB_BOARDS = {
  "Indeed": "https://www.indeed.com/jobs?q=Senior+Business+Analyst+Data+AI&l=Portland&remotejob=1",
  "Remote OK": "https://remoteok.com/remote-business-analyst-jobs",
  "Built In": "https://builtin.com/jobs/portland/data-analytics?f%5B0%5D=job-category_data-analytics",
  "PortlandTech": "https://portlandtech.org/jobs",
  "The Silicon Forest": "https://www.thesiliconforest.com/jobs",
  "Working Nomads": "https://www.workingnomads.com/jobs",
  "Real Work from Anywhere": "https://www.realworkfromanywhere.com/",
  "TechFetch": "https://www.techfetch.com/Default.aspx",
  "LinkedIn": "https://www.linkedin.com/jobs/",
  "Indeed Remote": "https://www.indeed.com/jobs?q=remote+business+analyst",
  "Dice": "https://dice.com/",
  "Zip Recruiter": "https://www.ziprecruiter.com/"
};

const RESUME_KEYWORDS = [
  "Senior Business Analyst", "Business Systems Analyst", "Process Improvement",
  "Excel", "Excel VBA", "Power BI", "Power Query", "SQL", "Python", "Pivot Tables",
  "UAT", "Test Case Development", "Agile", "SDLC", "Jira", "Jira Automation", "Azure", 
  "Azure DevOps", "Dashboards", "Data Modeling", "Data Storytelling", 
  "Business Process", "Workflow Optimization", "Reporting", "KPI Design",
  "ROI Analysis", "Compliance Workflow", "Asset Management", 
  "Vendor Management", "PMI-PBA", "Remedy", "Cost-Benefit Analysis"
];

function App() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>({
    running: false,
    progress: 0,
    currentSite: ""
  });

  const simulateJobScan = async (name: string, url: string): Promise<ScanResult> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate scan results with realistic data
    const isHealthy = Math.random() > 0.1; // 90% success rate
    const hasJobs = isHealthy && Math.random() > 0.3; // 70% chance of finding jobs if site is healthy
    
    let matchedKeywords: string[] = [];
    let matchPercent = 0;
    let jobTitles: string[] = [];
    let applicationUrls: string[] = [];
    
    if (hasJobs) {
      // Simulate keyword matching
      const numMatches = Math.floor(Math.random() * RESUME_KEYWORDS.length * 0.6) + 1;
      matchedKeywords = RESUME_KEYWORDS
        .sort(() => Math.random() - 0.5)
        .slice(0, numMatches)
        .sort();
      matchPercent = Math.round((matchedKeywords.length / RESUME_KEYWORDS.length) * 100);
      
      // Simulate job titles and URLs
      const sampleTitles = [
        "Senior Business Analyst - Data & AI",
        "Business Systems Analyst",
        "Data Business Analyst",
        "Senior Business Analyst - Process Improvement",
        "Business Intelligence Analyst",
        "Business Data Analyst - Remote",
        "Senior BA - Digital Transformation",
        "Business Process Analyst"
      ];
      
      const numJobs = Math.floor(Math.random() * 4) + 1; // 1-4 jobs
      jobTitles = sampleTitles
        .sort(() => Math.random() - 0.5)
        .slice(0, numJobs);
      
      // Generate application URLs for each job
      applicationUrls = jobTitles.map((_, index) => 
        `${url}/job/${Math.random().toString(36).substr(2, 9)}`
      );
    }

    return {
      name,
      url,
      status: isHealthy ? "Healthy" : "Error 429",
      jobsFound: hasJobs,
      matchPercent,
      matchedKeywords,
      timestamp: new Date().toLocaleString(),
      jobTitles,
      applicationUrls,
      ...(isHealthy ? {} : { error: "Rate limited or connection error" })
    };
  };

  const startScan = async () => {
    if (scanStatus.running) return;

    setScanStatus({ running: true, progress: 0, currentSite: "" });
    setScanResults([]);

    const boardEntries = Object.entries(JOB_BOARDS);
    const results: ScanResult[] = [];

    for (let i = 0; i < boardEntries.length; i++) {
      const [name, url] = boardEntries[i];
      
      setScanStatus({
        running: true,
        progress: Math.round((i / boardEntries.length) * 100),
        currentSite: name
      });

      try {
        const result = await simulateJobScan(name, url);
        results.push(result);
        setScanResults([...results]);
      } catch (error) {
        const errorResult: ScanResult = {
          name,
          url,
          status: "Error",
          jobsFound: false,
          matchPercent: 0,
          matchedKeywords: [],
          timestamp: new Date().toLocaleString(),
          error: error instanceof Error ? error.message : "Unknown error"
        };
        results.push(errorResult);
        setScanResults([...results]);
      }
    }

    setScanStatus({
      running: false,
      progress: 100,
      currentSite: "Complete"
    });
  };

  const downloadCSV = () => {
    if (scanResults.length === 0) return;

    const headers = ["Job Board", "URL", "Status", "Jobs Found", "Match Percent", "Matched Keywords", "Job Titles", "Application URLs", "Timestamp"];
    const csvContent = [
      headers.join(","),
      ...scanResults.map(result => [
        `"${result.name}"`,
        `"${result.url}"`,
        `"${result.status}"`,
        result.jobsFound ? "Yes" : "No",
        `${result.matchPercent}%`,
        `"${result.matchedKeywords.join(", ")}"`,
        `"${result.jobTitles.join(" | ")}"`,
        `"${result.applicationUrls.join(" | ")}"`,
        `"${result.timestamp}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job_board_matches_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    if (status === "Healthy") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status.startsWith("Error")) return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const totalJobs = scanResults.filter(r => r.jobsFound).length;
  const avgMatchPercent = scanResults.length > 0 
    ? scanResults.reduce((sum, r) => sum + r.matchPercent, 0) / scanResults.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Job Board Scanner</h1>
          <p className="text-lg text-gray-600">Scan job boards for Business Analyst & Data positions</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <button
                onClick={startScan}
                disabled={scanStatus.running}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {scanStatus.running ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Scan
                  </>
                )}
              </button>
              
              <button
                onClick={downloadCSV}
                disabled={scanResults.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Download CSV
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Object.keys(JOB_BOARDS).length}</div>
                <div className="text-gray-500">Job Boards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalJobs}</div>
                <div className="text-gray-500">Jobs Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{avgMatchPercent.toFixed(1)}%</div>
                <div className="text-gray-500">Avg Match</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {scanStatus.running && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Scanning {scanStatus.currentSite}...</span>
                <span>{scanStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {scanResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Scan Results</h2>
              <p className="text-gray-600 mt-1">Latest scan completed at {scanResults[0]?.timestamp}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Job Board</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Jobs Found</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Job Titles</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Match %</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.map((result, index) => (
                    <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{result.name}</div>
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm truncate block max-w-xs"
                          >
                            {result.url}
                          </a>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className={`text-sm font-medium ${
                            result.status === 'Healthy' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.jobsFound 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {result.jobsFound ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {result.jobTitles.map((title, titleIndex) => (
                            <div key={titleIndex} className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {title}
                              </span>
                              {result.applicationUrls[titleIndex] && (
                                <a
                                  href={result.applicationUrls[titleIndex]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-full transition-colors"
                                >
                                  View Job
                                </a>
                              )}
                            </div>
                          ))}
                          {result.jobTitles.length === 0 && (
                            <span className="text-sm text-gray-500">No jobs found</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.matchPercent}%</span>
                          {result.matchPercent > 0 && (
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${result.matchPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {result.matchedKeywords.slice(0, 3).map(keyword => (
                            <span 
                              key={keyword}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                          {result.matchedKeywords.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{result.matchedKeywords.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Keywords Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">Resume Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {RESUME_KEYWORDS.map(keyword => (
              <span 
                key={keyword}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
          <p className="text-gray-600 text-sm mt-3">
            These keywords are matched against job descriptions to calculate relevance scores.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;