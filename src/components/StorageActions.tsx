import React from 'react';
import { Download, Upload } from 'lucide-react';

interface StorageActionsProps {
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function StorageActions({ binderIds, setBinderIds }: StorageActionsProps) {
  const exportToJson = () => {
    if (binderIds.length === 0) return alert("Your binder is completely empty!");
    const blob = new Blob([JSON.stringify(binderIds, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokemon-tcg-app-${new Date().toISOString().split('T')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setBinderIds(parsed);
          alert("📁 Binder successfully imported from backup file!");
        } else {
          alert("Error: File format is invalid.");
        }
      } catch {
        alert("Error parsing backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const actionStyle = "inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-neutral-100 hover:border-neutral-600 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors";

  return (
    <div className="flex flex-wrap gap-2">
      <label className={actionStyle}>
        <Upload size={14} className="text-sky-400" /> Import JSON
        <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
      </label>
      <button onClick={exportToJson} className={actionStyle}>
        <Download size={14} className="text-emerald-400" /> Export JSON
      </button>
    </div>
  );
}
