import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ChevronDown, Check, X } from 'lucide-react';
import { Student } from '../types';

interface SearchableStudentSelectProps {
  students: Student[];
  value: string; // register_number
  onChange: (regNo: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableStudentSelect: React.FC<SearchableStudentSelectProps> = ({
  students,
  value,
  onChange,
  placeholder = 'Search by Reg No or Name...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedStudent = students.find(
    s => s.register_number === value || s.id === value
  );

  // Sync search query when value changes
  useEffect(() => {
    if (selectedStudent) {
      setSearchQuery(`${selectedStudent.register_number} - ${selectedStudent.name}`);
    } else if (!value) {
      setSearchQuery('');
    }
  }, [value, selectedStudent]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedStudent) {
          setSearchQuery(`${selectedStudent.register_number} - ${selectedStudent.name}`);
        } else {
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStudent]);

  // Filter students based on search query
  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.register_number.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(q)) ||
      (s.section && s.section.toLowerCase().includes(q))
    );
  });

  const handleSelect = (student: Student) => {
    onChange(student.register_number);
    setSearchQuery(`${student.register_number} - ${student.name}`);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredStudents.length - 1 ? prev + 1 : prev));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredStudents.length > 0) {
        const targetStudent = filteredStudents[highlightedIndex] || filteredStudents[0];
        handleSelect(targetStudent);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedStudent) {
        setSearchQuery(`${selectedStudent.register_number} - ${selectedStudent.name}`);
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.student-item');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className="relative flex items-center bg-slate-900 border border-slate-700 hover:border-blue-500/50 rounded-xl transition duration-150 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 cursor-text"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (selectedStudent && searchQuery === `${selectedStudent.register_number} - ${selectedStudent.name}`) {
              inputRef.current?.select();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent pl-9 pr-14 py-2.5 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none truncate"
        />

        <div className="absolute right-2 flex items-center gap-0.5">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown list with high z-index & completely solid opaque background */}
      {isOpen && (
        <div 
          ref={listRef}
          className="absolute z-[9999] left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ minWidth: '100%' }}
        >
          {filteredStudents.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-900">
              <User className="w-6 h-6 mx-auto mb-1 text-slate-600 opacity-60" />
              No matching students found for "<span className="text-slate-200 font-semibold">{searchQuery}</span>"
            </div>
          ) : (
            filteredStudents.map((s, index) => {
              const isSelected = s.register_number === value || s.id === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={s.id || s.register_number}
                  className={`student-item px-3.5 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isHighlighted
                      ? 'bg-blue-600/30 text-white'
                      : isSelected
                      ? 'bg-blue-950 text-white border-l-2 border-blue-500'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs tracking-tight">
                        {s.register_number}
                      </span>
                      {s.section && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-blue-400 border border-slate-700">
                          {s.section}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-300 font-medium text-[11px] mt-0.5 truncate">
                      {s.name}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
