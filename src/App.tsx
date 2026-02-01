import React, { useState, useEffect, useMemo, useRef } from 'react';
import { parseLogsFromDOM, parseLogsFromJSON, LogEntry } from './utils/parser';
import LogList from './components/LogList';
import Timeline from './components/Timeline';
import { Terminal, Search, Filter, X, ChevronDown, ChevronRight, PanelLeft, Maximize2, Minimize2, WrapText, Upload } from 'lucide-react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell, XAxis } from 'recharts';
import { parseISO, differenceInMilliseconds, addMilliseconds, format } from 'date-fns';
import { VirtuosoHandle } from 'react-virtuoso';
import './styles/ansi.css';

const SEVERITIES = ['DEFAULT', 'DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'];

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacets, setSelectedFacets] = useState<Record<string, Set<string>>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isWrapEnabled, setIsWrapEnabled] = useState(false);
  const [expandedFacetCategories, setExpandedFacetCategories] = useState<Set<string>>(new Set(['Resource Type', 'Severity']));
  const [isDragging, setIsDragging] = useState(false);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseLogsFromJSON(text);
        if (parsed.length > 0) {
          setLogs(parsed);
          setSearchTerm('');
          setSelectedFacets({});
        } else {
          setError('The file contained an empty array.');
        }
      } catch (err: any) {
        setError(`Failed to parse log file: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-selected
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // Synthesize a change event-like flow
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseLogsFromJSON(text);
        if (parsed.length > 0) {
          setLogs(parsed);
          setSearchTerm('');
          setSelectedFacets({});
        } else {
          setError('The file contained an empty array.');
        }
      } catch (err: any) {
        setError(`Failed to parse log file: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const parsedLogs = parseLogsFromDOM();
      if (parsedLogs.length > 0) {
        setLogs(parsedLogs);
      }
      // Don't set error — just show empty state with import option
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle Escape key for full screen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Compute Facets
  const facets = useMemo(() => {
    const facetMap: Record<string, Map<string, number>> = {
      'Resource Type': new Map(),
      'Severity': new Map(),
      'Log Name': new Map(),
    };
    const labelKeys = new Set<string>();

    logs.forEach(log => {
      const type = log.resourceType || 'unknown';
      facetMap['Resource Type'].set(type, (facetMap['Resource Type'].get(type) || 0) + 1);

      const sev = log.severity || 'DEFAULT';
      facetMap['Severity'].set(sev, (facetMap['Severity'].get(sev) || 0) + 1);

      if (log.logName) {
        const name = log.logName.split('/').pop() || log.logName;
        facetMap['Log Name'].set(name, (facetMap['Log Name'].get(name) || 0) + 1);
      }

      if (log.labels) {
        Object.entries(log.labels).forEach(([k, v]) => {
          if (!facetMap[k]) {
            facetMap[k] = new Map();
            labelKeys.add(k);
          }
          facetMap[k].set(v, (facetMap[k].get(v) || 0) + 1);
        });
      }
    });

    const result: Record<string, Array<[string, number]>> = {};
    Object.keys(facetMap).forEach(key => {
      result[key] = Array.from(facetMap[key].entries()).sort((a, b) => b[1] - a[1]);
    });
    return result;
  }, [logs]);

  // Filter Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const inPayload = log.textPayload.toLowerCase().includes(term);
        // Also search in raw JSON if not found in payload
        if (!inPayload) {
          const inRaw = JSON.stringify(log.raw).toLowerCase().includes(term);
          if (!inRaw) return false;
        }
      }
      
      for (const [category, selectedSet] of Object.entries(selectedFacets)) {
        if (selectedSet.size === 0) continue;

        let match = false;
        if (category === 'Resource Type') {
          match = selectedSet.has(log.resourceType || 'unknown');
        } else if (category === 'Severity') {
          match = selectedSet.has(log.severity || 'DEFAULT');
        } else if (category === 'Log Name') {
           const name = log.logName ? (log.logName.split('/').pop() || log.logName) : '';
           match = selectedSet.has(name);
        } else {
          if (log.labels && log.labels[category]) {
            match = selectedSet.has(log.labels[category]);
          }
        }
        if (!match) return false;
      }
      return true;
    });
  }, [logs, searchTerm, selectedFacets]);

  // Histogram Data (Time vs Frequency, Stacked by Severity)
  const histogramData = useMemo(() => {
    if (filteredLogs.length === 0) return [];

    // 1. Find Min/Max Time
    let minTime = Infinity;
    let maxTime = -Infinity;
    const validLogs: (LogEntry & { _ts: number })[] = [];

    for (const log of filteredLogs) {
      if (log.timestamp) {
        try {
          const t = parseISO(log.timestamp).getTime();
          if (!isNaN(t)) {
            if (t < minTime) minTime = t;
            if (t > maxTime) maxTime = t;
            validLogs.push({ ...log, _ts: t });
          }
        } catch (e) {}
      }
    }

    if (validLogs.length === 0) return [];

    // Avoid division by zero if all logs have same timestamp
    if (maxTime === minTime) {
      maxTime += 1000; 
      minTime -= 1000;
    }

    // 2. Create Buckets
    const BUCKET_COUNT = 60; // Increased resolution
    const timeRange = maxTime - minTime;
    const bucketSize = timeRange / BUCKET_COUNT;
    
    // Initialize buckets with 0 for all severities
    const buckets = new Array(BUCKET_COUNT).fill(0).map((_, i) => {
      const bucket: any = {
        startTime: minTime + (i * bucketSize),
        endTime: minTime + ((i + 1) * bucketSize),
        label: format(minTime + (i * bucketSize), 'HH:mm:ss'),
        total: 0
      };
      SEVERITIES.forEach(sev => bucket[sev] = 0);
      return bucket;
    });

    // 3. Fill Buckets
    for (const log of validLogs) {
      const bucketIndex = Math.min(
        Math.floor((log._ts - minTime) / bucketSize),
        BUCKET_COUNT - 1
      );
      if (bucketIndex >= 0) {
        const sev = log.severity || 'DEFAULT';
        if (buckets[bucketIndex][sev] !== undefined) {
          buckets[bucketIndex][sev]++;
        } else {
          buckets[bucketIndex]['DEFAULT']++;
        }
        buckets[bucketIndex].total++;
      }
    }

    return buckets;
  }, [filteredLogs]);

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      const startTime = payload.startTime;
      
      // Find the first log in this time bucket
      const index = filteredLogs.findIndex(log => {
        if (!log.timestamp) return false;
        try {
          const t = parseISO(log.timestamp).getTime();
          return t >= startTime;
        } catch { return false; }
      });

      if (index !== -1 && virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({ index, align: 'start', behavior: 'smooth' });
      }
    }
  };

  const toggleFacet = (category: string, value: string) => {
    setSelectedFacets(prev => {
      const newCategorySet = new Set(prev[category] || []);
      if (newCategorySet.has(value)) {
        newCategorySet.delete(value);
      } else {
        newCategorySet.add(value);
      }
      return { ...prev, [category]: newCategorySet };
    });
  };

  const toggleFacetCategory = (category: string) => {
    setExpandedFacetCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR': return '#b91c1c'; // Red-700
      case 'WARNING': return '#a16207'; // Yellow-700
      case 'NOTICE': return '#1d4ed8'; // Blue-700
      case 'INFO': return '#15803d'; // Green-700
      case 'DEBUG': return '#52525b'; // Zinc-600
      case 'CRITICAL': return '#7e22ce'; // Purple-700
      case 'ALERT': return '#c2410c'; // Orange-700
      case 'EMERGENCY': return '#991b1b'; // Red-800
      default: return '#3f3f46'; // Zinc-700
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-gray-300 font-mono">
        <div className="flex flex-col items-center gap-4">
          <Terminal className="w-12 h-12 animate-pulse text-green-500" />
          <p>Parsing logs...</p>
        </div>
      </div>
    );
  }

  if (error || logs.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-screen bg-[#1e1e1e] text-gray-300 font-mono p-8 text-center relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragging && (
          <div className="absolute inset-0 z-[100] bg-black/70 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-white">
              <Upload className="w-12 h-12 text-green-400" />
              <p className="text-lg font-medium">Drop JSON log file to import</p>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center gap-6 max-w-md">
          <Terminal className="w-14 h-14 text-green-500" />
          <h1 className="text-2xl font-bold text-white">LogLens</h1>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!error && (
            <p className="text-gray-400 text-sm">
              No logs detected on this page. Import a JSON log file containing an array of Cloud Logging <code className="text-green-400">LogEntry</code> objects.
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import JSON Log File
          </button>
          <p className="text-gray-600 text-xs">
            Expects a JSON array of Cloud Logging LogEntry objects
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen bg-[#1e1e1e] text-gray-300 font-mono overflow-hidden relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-black/70 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-white">
            <Upload className="w-12 h-12 text-green-400" />
            <p className="text-lg font-medium">Drop JSON log file to import</p>
          </div>
        </div>
      )}

      {/* Header */}
      {!isFullScreen && (
        <header className="flex items-center h-14 border-b border-gray-800 px-4 bg-[#252526] shrink-0 z-10 gap-4">
          {/* Sidebar Toggle (Left) */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${isSidebarOpen ? 'text-white' : 'text-gray-400'}`}
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <Terminal className="w-5 h-5 text-green-500" />
            <span className="font-bold tracking-tight text-white hidden sm:inline">LogLens</span>
          </div>

          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="w-full bg-[#27272a] border border-gray-700/50 focus:border-blue-500/50 rounded-md py-1.5 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400 shrink-0">
            <span className="hidden sm:inline">{filteredLogs.length.toLocaleString()} / {logs.length.toLocaleString()} events</span>

            {/* Import File */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Import JSON Log File"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Full Screen Toggle */}
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Enter Full Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button 
              onClick={() => {
                const root = document.getElementById('loglens-root');
                if (root) {
                  root.remove();
                  document.body.style.overflow = '';
                }
              }}
              className="p-1.5 rounded hover:bg-red-900/50 hover:text-red-200 transition-colors"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        {!isFullScreen && isSidebarOpen && (
          <aside className="w-64 border-r border-gray-800 bg-[#18181b] flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-3 space-y-4">
              {Object.entries(facets).map(([category, items]) => {
                if (items.length === 0) return null;
                const isExpanded = expandedFacetCategories.has(category);
                
                return (
                  <div key={category} className="pb-2">
                    <button 
                      className="flex items-center w-full text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 mb-2 transition-colors"
                      onClick={() => toggleFacetCategory(category)}
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3 mr-1.5" /> : <ChevronRight className="w-3 h-3 mr-1.5" />}
                      {category}
                    </button>
                    
                    {isExpanded && (
                      <div className="space-y-0.5 ml-1">
                        {items.slice(0, 10).map(([value, count]) => {
                          const isSelected = selectedFacets[category]?.has(value);
                          return (
                            <label key={value} className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors group ${isSelected ? 'bg-blue-500/10' : 'hover:bg-gray-800'}`}>
                              <div className="flex items-center gap-2 overflow-hidden">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                                  checked={isSelected || false}
                                  onChange={() => toggleFacet(category, value)}
                                />
                                <span className={`text-[12px] truncate max-w-[120px] ${isSelected ? 'text-blue-200' : 'text-gray-400 group-hover:text-gray-300'}`} title={value}>
                                  {value}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-600 font-mono">{count}</span>
                            </label>
                          );
                        })}
                        {items.length > 10 && (
                          <div className="text-[10px] text-gray-600 pl-6 italic pt-1">
                            + {items.length - 10} more...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Content Column */}
        <div className="flex flex-col flex-1 min-w-0 bg-[#0f0f0f]">
          {/* Timeline Strip */}
          {!isFullScreen && (
            <Timeline 
              data={histogramData} 
              onClick={handleChartClick} 
              severities={SEVERITIES} 
              getSeverityColor={getSeverityColor} 
            />
          )}

          {/* Log List */}
          <div className="flex-1 relative">
            <LogList ref={virtuosoRef} logs={filteredLogs} searchTerm={searchTerm} onFilter={setSearchTerm} wrapText={isWrapEnabled} />
            
            {/* Floating Exit Full Screen Button */}
            {isFullScreen && (
              <button
                onClick={() => setIsFullScreen(false)}
                className="absolute top-4 right-6 p-2 bg-gray-800/90 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 hover:opacity-100 z-50 border border-gray-700"
                title="Exit Full Screen (Esc)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
