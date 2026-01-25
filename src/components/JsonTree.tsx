import React from 'react';
import { Filter } from 'lucide-react';

interface JsonTreeProps {
  data: any;
  onFilter: (value: string) => void;
  level?: number;
}

const JsonTree: React.FC<JsonTreeProps> = ({ data, onFilter }) => {
  if (data === null) {
    return <span className="text-gray-500">null</span>;
  }

  if (typeof data === 'boolean') {
    return (
      <span 
        className="text-purple-400 cursor-pointer hover:underline decoration-dotted"
        onClick={(e) => { e.stopPropagation(); onFilter(String(data)); }}
        title="Filter by this value"
      >
        {String(data)}
      </span>
    );
  }

  if (typeof data === 'number') {
    return (
      <span 
        className="text-orange-400 cursor-pointer hover:underline decoration-dotted"
        onClick={(e) => { e.stopPropagation(); onFilter(String(data)); }}
        title="Filter by this value"
      >
        {data}
      </span>
    );
  }

  if (typeof data === 'string') {
    return (
      <span 
        className="text-green-400 break-all cursor-pointer hover:underline decoration-dotted"
        onClick={(e) => { e.stopPropagation(); onFilter(data); }}
        title="Filter by this value"
      >
        "{data}"
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-500">[]</span>;
    return (
      <div className="inline-block align-top">
        <span className="text-gray-500">[</span>
        <div className="flex flex-col">
          {data.map((item, index) => (
            <div key={index} style={{ paddingLeft: '2ch' }}>
              <JsonTree data={item} onFilter={onFilter} />
              {index < data.length - 1 && <span className="text-gray-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-gray-500" style={{ paddingLeft: 0 }}>]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    if (Object.keys(data).length === 0) return <span className="text-gray-500">{"{}"}</span>;
    return (
      <div className="inline-block align-top">
        <span className="text-gray-500">{"{"}</span>
        <div className="flex flex-col">
          {Object.entries(data).map(([key, value], index, arr) => (
            <div key={key} style={{ paddingLeft: '2ch' }} className="flex items-start">
              <span className="text-blue-400 mr-1 shrink-0">"{key}":</span>
              <JsonTree data={value} onFilter={onFilter} />
              {index < arr.length - 1 && <span className="text-gray-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-gray-500" style={{ paddingLeft: 0 }}>{"}"}</span>
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

export default JsonTree;
