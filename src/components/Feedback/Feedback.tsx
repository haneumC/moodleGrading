import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FeedbackItem } from '@/components/StudentList/types';
import { FeedbackProps } from './types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { Search, X } from 'lucide-react';

// Define types for sorting
type SortField = 'text' | 'deduction' | 'applied';
type SortDirection = 'asc' | 'desc';

interface SortableItemProps {
  id: number;
  item: FeedbackItem;
  editingId: number | null;
  editingText: string;
  editingDeduction: number;
  appliedIds: number[];
  selectedStudent: string | null;
  onStartEdit: (item: FeedbackItem) => void;
  onAcceptEdit: (id: number) => void;
  onRejectEdit: () => void;
  onApplyFeedback: (item: FeedbackItem) => void;
  onDeleteFeedback: (id: number) => void;
  setEditingText: (text: string) => void;
  setEditingDeduction: (value: number) => void;
  onFeedbackSelect?: (id: number) => void;
  selectedFeedbackId?: number | null;
}

const SortableItem = ({
  id,
  item,
  editingId,
  editingText,
  editingDeduction,
  appliedIds,
  selectedStudent,
  onStartEdit,
  onAcceptEdit,
  onRejectEdit,
  onApplyFeedback,
  onDeleteFeedback,
  setEditingText,
  setEditingDeduction,
  onFeedbackSelect,
  selectedFeedbackId,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ 
    id,
    data: {
      type: 'feedback-item',
      item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  } as React.CSSProperties;

  const isSelected = selectedFeedbackId === item.id;

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={`${isDragging ? 'dragging' : ''} border-b-0 hover:bg-[#252525] transition-colors`}
      data-is-dragging={isDragging || undefined}
      data-feedback-id={id}
    >
      {editingId === item.id ? (
        <>
          <TableCell>
            <Textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="bg-[#2d2d2d] border-[#444] text-white min-h-[40px] resize-y p-1"
            />
          </TableCell>
          <TableCell>
            <div className="flex justify-center">
              <Input
                type="number"
                value={editingDeduction}
                onChange={(e) => setEditingDeduction(Number(e.target.value))}
                className="w-[60px] bg-[#2d2d2d] border-[#444] text-white p-1 text-center"
                min={0}
                max={20}
              />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex space-x-1">
              <Button 
                onClick={() => onAcceptEdit(item.id)}
                className="bg-[#4CAF50] hover:bg-[#45a049] text-white p-1"
                size="sm"
              >
                ✓
              </Button>
              <Button 
                onClick={onRejectEdit}
                className="bg-[#f44336] hover:bg-[#d32f2f] text-white p-1"
                size="sm"
              >
                ✕
              </Button>
            </div>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="p-0 py-0.5">
            <div 
              className={`py-0.5 pl-1 pr-2 rounded transition-colors whitespace-pre-wrap break-words text-sm flex items-center ${
                isDragging 
                  ? 'bg-[#2c2c2c] border-l-2 border-[#666] text-[#ffffff] shadow-md' 
                  : isSelected 
                    ? 'bg-[#3a5a3e] border-l-2 border-[#6CAF70] text-[#ffffff] selected-feedback'
                    : appliedIds.includes(item.id)
                      ? 'bg-[#2d4a3e] border-l-2 border-[#4CAF50] text-[#e1e1e1]'
                      : 'bg-[#3a3f4b] border-l-2 border-[#5c6bc0] text-[#e1e1e1] hover:bg-[#454b5a]'
              }`}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  e.stopPropagation();
                  console.log('Clicking on feedback div:', item.id);
                  onFeedbackSelect && onFeedbackSelect(item.id);
                }
              }}
            >
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-move inline-block opacity-60 hover:opacity-100 flex-shrink-0"
                title="Drag to reorder"
                aria-label="Drag handle"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // This triggers the keyboard drag handling
                  }
                }}
              >
                <i className="bi bi-grip-vertical text-gray-500"></i>
              </div>
              <span 
                className="cursor-pointer hover:bg-[#454b5a] p-0.5 rounded transition-colors inline-block ml-0.5 flex-grow"
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.ctrlKey || e.metaKey) {
                    onStartEdit(item);
                  } else {
                    console.log('Clicking on feedback text:', item.id);
                    onFeedbackSelect && onFeedbackSelect(item.id);
                  }
                }}
              >
                {item.comment}
              </span>
            </div>
          </TableCell>
          <TableCell 
            className="text-center text-white cursor-pointer w-16 p-0 py-0.5"
            onClick={() => onStartEdit(item)}
          >
            {item.grade}
          </TableCell>
          <TableCell className="p-0 py-0.5 text-center">
            <Button
              variant="ghost"
              size="icon"
              disabled={!selectedStudent}
              onClick={() => onApplyFeedback(item)}
              className={`w-5 h-5 rounded-full ${
                selectedStudent && appliedIds.includes(item.id)
                  ? 'bg-white shadow-sm' 
                  : 'border border-gray-400 hover:border-gray-300'
              }`}
            >
              {selectedStudent && appliedIds.includes(item.id) ? (
                <i className="bi bi-check text-black"></i>
              ) : (
                <span></span>
              )}
            </Button>
          </TableCell>
          <TableCell className="p-0 py-0.5">
            <div className="flex space-x-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartEdit(item)}
                className="text-blue-400 hover:text-blue-300 hover:bg-transparent px-1.5"
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteFeedback(item.id)}
                className="text-[#f44336] hover:text-[#d32f2f] hover:bg-transparent px-1.5"
              >
                <i className="bi bi-trash"></i>
              </Button>
            </div>
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

// Define CSS classes for animation
const fadeInClass = "opacity-100 transform translate-y-0 transition-all duration-200 ease-out";
const fadeOutClass = "opacity-0 transform -translate-y-2 transition-all duration-200 ease-out";

const Feedback: React.FC<FeedbackProps> = ({ 
  selectedStudent, 
  appliedIds, 
  onFeedbackEdit,
  feedbackItems,
  setFeedbackItems,
  onStudentsUpdate,
  onChangeTracked,
  onFeedbackSelect,
  selectedFeedbackId
}) => {
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState<Omit<FeedbackItem, 'id' | 'applied'>>({ 
    comment: "", 
    grade: 0 
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingDeduction, setEditingDeduction] = useState(0);
  const [sortField, setSortField] = useState<SortField>('text');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [reusableIds, setReusableIds] = useState<number[]>([]);
  const [nextId, setNextId] = useState<number>(5);
  const [useManualOrder, setUseManualOrder] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [maxPoints, setMaxPoints] = useState<number>(20);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FeedbackItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
        delay: 50,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleApplyFeedback = (feedbackItem: FeedbackItem) => {
    if (!selectedStudent) return;

    onStudentsUpdate(prevStudents =>
      prevStudents.map(student => {
        if (student.name === selectedStudent) {
          const oldState = { ...student };
          
          const currentAppliedIds = Array.isArray(student.appliedIds) ? student.appliedIds : [];
          
          if (currentAppliedIds.includes(feedbackItem.id)) {
            const feedbackLines = student.feedback
              .split('\n\n')
              .filter(line => !line.trim().startsWith(`${feedbackItem.comment.trim()}`))
              .filter(line => line.trim() !== '')
              .join('\n\n');

            const remainingIds = currentAppliedIds.filter(id => id !== feedbackItem.id);
            const newState = {
              ...student,
              grade: remainingIds.length === 0 ? "" : (20 - feedbackItem.grade).toString(),
              feedback: feedbackLines || "",
              appliedIds: remainingIds,
            };

            onChangeTracked({
              type: 'feedback',
              studentName: student.name,
              oldValue: oldState,
              newValue: newState,
              timestamp: new Date().toISOString()
            });

            return newState;
          } else {
            const newAppliedIds = [...currentAppliedIds, feedbackItem.id];
            const newGrade = (20 - feedbackItem.grade).toString();
            const formattedFeedback = `${feedbackItem.comment.trim()}`;
            const newFeedback = student.feedback
              ? `${student.feedback.trim()}\n\n${formattedFeedback}`
              : formattedFeedback;

            const newState = {
              ...student,
              grade: newGrade,
              feedback: newFeedback,
              appliedIds: newAppliedIds,
            };

            console.log(`Applied feedback ${feedbackItem.id} to student ${student.name}`, newState);

            onChangeTracked({
              type: 'feedback',
              studentName: student.name,
              oldValue: oldState,
              newValue: newState,
              timestamp: new Date().toISOString()
            });

            return newState;
          }
        }
        return student;
      })
    );
    
    if (window.markGradingChanges) {
      window.markGradingChanges();
    }
  };

  const handleAddFeedback = () => {
    if (newFeedback.comment.trim()) {
      let idToUse: number;
      
      if (reusableIds.length > 0) {
        // Use the smallest available reused id
        idToUse = Math.min(...reusableIds);
        // Remove the used id from reusableIds
        setReusableIds(prev => prev.filter(id => id !== idToUse));
      } else {
        // Use the next sequential id
        idToUse = nextId;
        setNextId(prev => prev + 1);
      }

      setFeedbackItems([
        ...feedbackItems,
        {
          id: idToUse,
          comment: newFeedback.comment,
          grade: Number(newFeedback.grade),
          applied: false
        }
      ]);
      setNewFeedback({ comment: "", grade: 0 });
      setIsAddingFeedback(false);
    }
  };

  const handleStartEdit = (item: FeedbackItem) => {
    setEditingId(item.id);
    setEditingText(item.comment);
    setEditingDeduction(item.grade);
  };

  const handleAcceptEdit = (id: number) => {
    const oldFeedback = feedbackItems.find(item => item.id === id);
    const newFeedback = {
      id,
      comment: editingText,
      grade: editingDeduction,
    };

    setFeedbackItems(feedbackItems.map(item =>
      item.id === id 
        ? { ...item, comment: editingText, grade: editingDeduction } 
        : item
    ));

    // Notify parent component about the edit if this feedback was applied to any student
    if (oldFeedback && appliedIds.includes(id)) {
      onFeedbackEdit(oldFeedback, newFeedback);
    }

    setEditingId(null);
  };

  const handleRejectEdit = () => {
    setEditingId(null);
  };

  const handleDeleteFeedback = (id: number) => {
    // Get the feedback item before deleting it
    const feedbackToDelete = feedbackItems.find(item => item.id === id);
    
    if (feedbackToDelete) {
      // Update students who have this feedback applied
      onStudentsUpdate(prevStudents =>
        prevStudents.map(student => {
          if (student.appliedIds?.includes(id)) {
            const oldState = { ...student };
            
            // Remove the feedback text with the correct format
            const feedbackLines = student.feedback
              .split('\n\n')
              .filter(line => !line.trim().startsWith(`${feedbackToDelete.grade}: ${feedbackToDelete.comment.trim()}`))
              .filter(line => line.trim() !== '')
              .join('\n\n');

            // Remove the id from appliedIds
            const newAppliedIds = student.appliedIds.filter(appliedId => appliedId !== id);
            
            // Recalculate grade based on remaining feedback
            const remainingDeduction = newAppliedIds.reduce((sum, appliedId) => {
              const feedback = feedbackItems.find(f => f.id === appliedId);
              return sum + (feedback?.grade || 0);
            }, 0);
            
            const newState = {
              ...student,
              grade: newAppliedIds.length === 0 ? "" : (20 - remainingDeduction).toString(),
              feedback: feedbackLines || "",
              appliedIds: newAppliedIds,
            };

            // Track the change
            onChangeTracked({
              type: 'feedback',
              studentName: student.name,
              oldValue: oldState,
              newValue: newState,
              timestamp: new Date().toISOString()
            });

            return newState;
          }
          return student;
        })
      );
    }

    // Now remove the feedback item itself
    setReusableIds(prev => [...prev, id]);
    setFeedbackItems(feedbackItems.filter(item => item.id !== id));
  };

  const getSortedFeedbackItems = () => {
    // If we're using manual ordering, just return the items as they are
    if (useManualOrder) {
      return feedbackItems;
    }
    
    // Otherwise, sort them as before
    return [...feedbackItems].sort((a, b) => {
      if (sortField === 'text') {
        const commentA = a.comment || '';
        const commentB = b.comment || '';
        return sortDirection === 'asc' 
          ? commentA.localeCompare(commentB)
          : commentB.localeCompare(commentA);
      }
      if (sortField === 'deduction') {
        return sortDirection === 'asc' 
          ? a.grade - b.grade
          : b.grade - a.grade;
      }
      // sorting for applied field - ensure we're using the correct property
      const aApplied = appliedIds.includes(a.id) ? 1 : 0;
      const bApplied = appliedIds.includes(b.id) ? 1 : 0;
      return sortDirection === 'asc' 
        ? aApplied - bApplied
        : bApplied - aApplied;
    });
  };

  const handleSort = (field: SortField) => {
    // Switch to sorting mode
    setUseManualOrder(false);
    
    if (sortField === field) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    setActiveId(Number(active.id));
    setIsDragging(true);
    
    // Play an optional sound or provide haptic feedback here if needed
    console.log('Started dragging item', active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setIsDragging(false);
    setActiveId(null);
    
    if (!over) {
      console.log('Drag ended but not over a valid target');
      return;
    }
    
    if (active.id !== over.id) {
      // Switch to manual ordering mode
      setUseManualOrder(true);
      
      setFeedbackItems((prevItems: FeedbackItem[]) => {
        try {
          const activeId = Number(active.id);
          const overId = Number(over.id);
          
          const oldIndex = prevItems.findIndex((item: FeedbackItem) => item.id === activeId);
          const newIndex = prevItems.findIndex((item: FeedbackItem) => item.id === overId);
          
          if (oldIndex === -1 || newIndex === -1) {
            console.error('Item not found during drag', { activeId, overId, oldIndex, newIndex });
            return prevItems; // Return unchanged if indexes can't be found
          }
          
          return arrayMove([...prevItems], oldIndex, newIndex);
        } catch (error) {
          console.error('Error during drag operation:', error);
          return prevItems; // Return unchanged on error
        }
      });
    }
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    setIsDragging(false);
    setActiveId(null);
    console.log('Drag was cancelled');
  };

  const handleFeedbackSelect = (feedbackId: number) => {
    console.log('Feedback selected:', feedbackId);
    if (onFeedbackSelect) {
      onFeedbackSelect(feedbackId);
    }
  };

  const sortedItems = getSortedFeedbackItems();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // existing file handling logic...
    }
  };

  const handleLoadProgress = async (
    e: React.ChangeEvent<HTMLInputElement>,
    options?: { loadStudents: boolean; loadFeedback: boolean }
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name); // Set the file name

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as SaveData;

        if (data.maxPoints) {
          setMaxPoints(data.maxPoints); // Update max points
        }

        // existing logic to load students and feedback...
      } catch (error) {
        console.error('Error parsing file:', error);
        setError("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  // Function to handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query.trim());
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const normalizedQuery = query.trim().toLowerCase();
      const results = feedbackItems.filter(item => 
        item.comment.toLowerCase().includes(normalizedQuery)
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching feedback:', error);
      setSearchResults([]);
    }
  }, [feedbackItems]);

  // Toggle search bar visibility
  const toggleSearchBar = () => {
    const newState = !isSearchBarVisible;
    setIsSearchBarVisible(newState);
    
    if (newState) {
      // Focus the input when showing the search bar
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    } else {
      // Clear search when hiding the search bar
      setSearchQuery('');
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchBarVisible(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      
      // Escape to close search
      if (e.key === 'Escape') {
        if (searchQuery && isSearching) {
          // If there's a query, first clear it
          setSearchQuery('');
          setIsSearching(false);
          setSearchResults([]);
        } else if (isSearchBarVisible) {
          // Then close the search bar on second press
          setIsSearchBarVisible(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearching, searchQuery, isSearchBarVisible]);

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Determine which items to display based on search state
  const displayItems = isSearching ? searchResults : getSortedFeedbackItems();

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-md h-[calc(100vh-280px)] flex flex-col mt-5">
      <div className="mb-2 relative flex items-center justify-end">
        <div className={`w-full transition-all duration-200 ease-out ${isSearchBarVisible ? 'visible' : 'invisible absolute'}`}>
          <div className={`w-full relative ${isSearchBarVisible ? fadeInClass : fadeOutClass}`}>
            <div className="relative flex items-center bg-[#2d2d2d] rounded border border-[#444] pr-2">
              <Search 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" 
                size={16} 
              />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search feedback comments... (Ctrl+F)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 pr-8 py-1 bg-transparent border-0 text-white text-sm w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (!searchQuery) {
                      toggleSearchBar();
                    } else {
                      clearSearch();
                    }
                    e.preventDefault();
                  }
                }}
              />
              <button
                onClick={toggleSearchBar}
                className="ml-1 text-gray-400 hover:text-gray-200 p-1 hover:bg-[#444] rounded-full"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
            {isSearching && (
              <div className="mt-1 text-xs text-gray-400">
                Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={toggleSearchBar}
          className={`text-gray-400 hover:text-gray-200 p-1.5 rounded-full hover:bg-[#333] transition-colors ${isSearchBarVisible ? 'hidden' : 'block'}`}
          aria-label="Search feedback"
          title="Search feedback (Ctrl+F)"
        >
          <Search size={18} />
        </button>
      </div>
      
      <div className="overflow-y-auto flex-1 mb-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#222]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always
            },
          }}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <div className="rounded-md overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="border-b-0 sticky top-0 bg-[#1a1a1a] z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="text-[#e1e1e1] cursor-pointer py-2"
                    onClick={() => handleSort('text')}
                  >
                    Feedback
                    {sortField === 'text' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="w-[80px] text-[#e1e1e1] cursor-pointer text-center py-2"
                    onClick={() => handleSort('deduction')}
                  >
                    Deduction
                    {sortField === 'deduction' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="w-[60px] text-[#e1e1e1] cursor-pointer py-2"
                    onClick={() => handleSort('applied')}
                  >
                    Apply
                    {sortField === 'applied' && (
                      <span className="ml-2">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="w-[80px] text-[#e1e1e1] py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y-0">
                {displayItems.length > 0 ? (
                  <SortableContext
                    items={displayItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {displayItems.map((item) => (
                      <SortableItem
                        key={item.id}
                        id={item.id}
                        item={item}
                        editingId={editingId}
                        editingText={editingText}
                        editingDeduction={editingDeduction}
                        appliedIds={appliedIds}
                        selectedStudent={selectedStudent}
                        onStartEdit={handleStartEdit}
                        onAcceptEdit={handleAcceptEdit}
                        onRejectEdit={handleRejectEdit}
                        onApplyFeedback={handleApplyFeedback}
                        onDeleteFeedback={handleDeleteFeedback}
                        setEditingText={setEditingText}
                        setEditingDeduction={setEditingDeduction}
                        onFeedbackSelect={handleFeedbackSelect}
                        selectedFeedbackId={selectedFeedbackId}
                      />
                    ))}
                  </SortableContext>
                ) : isSearching ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-400">
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="text-lg mb-1">No results found</div>
                        <div className="text-sm text-gray-500">Try adjusting your search query</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-400">
                      No feedback items available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DndContext>

        {isAddingFeedback ? (
          <div className="mt-2 p-3 bg-[#2d2d2d] rounded-md space-y-3 border border-[#333] shadow-sm">
            <Textarea
              value={newFeedback.comment}
              onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
              placeholder="Enter feedback comment"
              aria-label="Feedback comment"
              className="bg-[#3a3f4b] border-[#444] text-white min-h-[50px] resize-y text-sm"
            />
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={newFeedback.grade}
                onChange={(e) => setNewFeedback({ ...newFeedback, grade: Number(e.target.value) })}
                placeholder="Points"
                aria-label="Deduction points"
                className="w-[80px] bg-[#3a3f4b] border-[#444] text-white text-center text-sm"
              />
              <div className="text-xs text-gray-400">Deduction points (0-20)</div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleAddFeedback}
                className="bg-[#4CAF50] hover:bg-[#45a049] text-white text-sm px-4 py-1"
              >
                Add
              </Button>
              <Button 
                onClick={() => setIsAddingFeedback(false)}
                className="bg-[#f44336] hover:bg-[#d32f2f] text-white text-sm px-4 py-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsAddingFeedback(true)}
            className="mt-2 w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-1.5 rounded-md shadow-sm"
          >
            Add Feedback
          </Button>
        )}
      </div>
    </div>
  );
};

export default Feedback;
