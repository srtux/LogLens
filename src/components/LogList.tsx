import React, { forwardRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import LogRow from './LogRow';
import { LogEntry } from '../utils/parser';

interface LogListProps {
  logs: LogEntry[];
  searchTerm?: string;
  onFilter?: (value: string) => void;
  wrapText?: boolean;
}

const LogList = forwardRef<VirtuosoHandle, LogListProps>(({ logs, searchTerm, onFilter, wrapText }, ref) => {
  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <Virtuoso
        ref={ref}
        style={{ height: '100%' }}
        data={logs}
        itemContent={(index, log) => {
          return <LogRow log={log} highlight={searchTerm} onFilter={onFilter} wrapText={wrapText} />;
        }}
      />
    </div>
  );
});

export default LogList;
