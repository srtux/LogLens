import React, { useState } from 'react';
import { convertAnsiToHtml, LogEntry } from '../utils/parser';
import { format, parseISO } from 'date-fns';
import { ChevronRight, ChevronDown } from 'lucide-react';
import JsonTree from './JsonTree';

interface LogRowProps {
  log: LogEntry;
  style?: React.CSSProperties;
  showRaw?: boolean;
  highlight?: string;
  onFilter?: (value: string) => void;
  wrapText?: boolean;
}

const LogRow: React.FC<LogRowProps> = ({ log, style, showRaw, highlight, onFilter, wrapText }) => {
  const [expanded, setExpanded] = useState(false);

  // Format timestamp if valid
  let formattedTime = '';
  if (log.timestamp) {
    try {
      formattedTime = format(parseISO(log.timestamp), 'HH:mm:ss.SSS');
    } catch (e) {
      formattedTime = log.timestamp;
    }
  }

  let htmlContent = convertAnsiToHtml(log.textPayload);

  // Apply highlighting if search term exists
  if (highlight && highlight.trim().length > 0) {
    try {
      const escapedTerm = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})(?![^<]*>)`, 'gi');
      htmlContent = htmlContent.replace(regex, '<mark class="bg-yellow-900 text-yellow-100">$1</mark>');
    } catch (e) {
      // Fallback to no highlight on regex error
    }
  }

  return (
    <div style={style} className="flex flex-col border-b border-gray-800/40 hover:bg-white/[0.02] transition-colors group">
      <div 
        className={`flex items-start py-1 px-2 font-mono text-[13px] leading-5 cursor-pointer ${wrapText ? 'whitespace-pre-wrap break-all' : 'whitespace-nowrap overflow-hidden'}`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Severity Border Indicator */}
        <div className={`w-1 h-full absolute left-0 top-0 bottom-0 ${getSeverityBorderClass(log.severity)}`} />

        {/* Expand Icon */}
        <span className="shrink-0 mr-2 mt-0.5 text-gray-600 group-hover:text-gray-400 transition-colors">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>

        {/* Timestamp */}
        {formattedTime && (
          <span className="shrink-0 text-gray-500 mr-3 select-none w-[88px] text-[12px] font-medium opacity-80">
            {formattedTime}
          </span>
        )}
        
        {/* Severity Badge (Icon style) */}
        {log.severity && log.severity !== 'DEFAULT' && log.severity !== 'INFO' && (
           <span 
             className={`shrink-0 text-[10px] font-bold px-1.5 rounded-sm mr-2 h-4 flex items-center justify-center ${getSeverityClass(log.severity)}`}
             title={log.severity}
           >
             {log.severity[0]}
           </span>
        )}

        {/* Log Content */}
        <span 
          className="text-gray-300 grow font-normal tracking-tight"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-[#0a0a0a] p-3 pl-10 text-xs border-t border-gray-800/50 overflow-x-auto cursor-auto shadow-inner">
          <div className="font-mono text-gray-400">
            <JsonTree 
              data={log.raw} 
              onFilter={(val) => {
                if (onFilter) onFilter(val);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

function getSeverityBorderClass(severity: string) {
  switch (severity) {
    case 'ERROR': return 'bg-red-500';
    case 'WARNING': return 'bg-yellow-500';
    case 'NOTICE': return 'bg-blue-500';
    case 'CRITICAL': return 'bg-purple-500';
    case 'ALERT': return 'bg-orange-500';
    case 'EMERGENCY': return 'bg-red-600';
    case 'DEBUG': return 'bg-gray-500';
    default: return 'bg-transparent';
  }
}

function getSeverityClass(severity: string) {
  switch (severity) {
    case 'ERROR': return 'bg-red-500/20 text-red-400';
    case 'WARNING': return 'bg-yellow-500/20 text-yellow-400';
    case 'NOTICE': return 'bg-blue-500/20 text-blue-400';
    case 'CRITICAL': return 'bg-purple-500/20 text-purple-400';
    case 'ALERT': return 'bg-orange-500/20 text-orange-400';
    case 'EMERGENCY': return 'bg-red-600/20 text-red-300';
    case 'DEBUG': return 'bg-gray-500/20 text-gray-400';
    default: return 'bg-gray-800 text-gray-400';
  }
}

export default React.memo(LogRow);
