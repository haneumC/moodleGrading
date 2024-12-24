import React, { useState } from 'react';
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

interface FeedbackItem {
  id: number;
  comment: string;
  grade: number;
  applied?: boolean;
}

type SortField = 'text' | 'deduction' | 'applied';
type SortDirection = 'asc' | 'desc';

interface FeedbackProps {
  onApplyFeedback: (params: { feedbackItem: FeedbackItem; allFeedbackItems: FeedbackItem[] }) => void;
  selectedStudent: string | null;
  appliedIds: number[];
  onFeedbackEdit: (oldFeedback: FeedbackItem, newFeedback: FeedbackItem) => void;
}

const Feedback: React.FC<FeedbackProps> = ({ onApplyFeedback, selectedStudent, appliedIds, onFeedbackEdit }) => {
  const defaultFeedback: FeedbackItem[] = [
    { id: 1, comment: "Add more comments", grade: 3},
    { id: 2, comment: "Poor indentation", grade: 2},
    { id: 3, comment: "Looks good!", grade: 0},
    { id: 4, comment: "No submission", grade: 20},
  ];

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(defaultFeedback);
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
    setReusableIds(prev => [...prev, id]);
    setFeedbackItems(feedbackItems.filter(item => item.id !== id));
  };

  const getSortedFeedbackItems = () => {
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
      // sorting for applied field
      return sortDirection === 'asc' 
        ? Number(a.applied || false) - Number(b.applied || false)
        : Number(b.applied || false) - Number(a.applied || false);
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-md h-[calc(100vh-380px)] flex flex-col mt-5">
      <Table>
        <TableHeader className="border-b border-[#444]">
          <TableRow className="hover:bg-transparent">
            <TableHead 
              className="text-[#e1e1e1] cursor-pointer"
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
              className="w-[100px] text-[#e1e1e1] cursor-pointer"
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
              className="w-[80px] text-[#e1e1e1] cursor-pointer"
              onClick={() => handleSort('applied')}
            >
              Apply
              {sortField === 'applied' && (
                <span className="ml-2">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHead>
            <TableHead className="w-[100px] text-[#e1e1e1]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getSortedFeedbackItems().map((item) => (
            <TableRow key={item.id} className="border-b border-[#333] hover:bg-[#2d2d2d]">
              {editingId === item.id ? (
                <>
                  <TableCell>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="bg-[#2d2d2d] border-[#444] text-white min-h-[60px] resize-y"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editingDeduction}
                      onChange={(e) => setEditingDeduction(Number(e.target.value))}
                      className="w-[80px] bg-[#2d2d2d] border-[#444] text-white"
                      min={0}
                      max={20}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleAcceptEdit(item.id)}
                        className="bg-[#4CAF50] hover:bg-[#45a049] text-white"
                        size="sm"
                      >
                        ✓
                      </Button>
                      <Button 
                        onClick={handleRejectEdit}
                        className="bg-[#f44336] hover:bg-[#d32f2f] text-white"
                        size="sm"
                      >
                        ✕
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => handleStartEdit(item)}
                  >
                    <div 
                      className={`p-2 rounded border-l-4 transition-colors whitespace-pre-wrap break-words ${
                        appliedIds.includes(item.id)
                          ? 'bg-[#2d4a3e] border-[#4CAF50] text-[#e1e1e1]'  // Highlighted state
                          : 'bg-[#3a3f4b] border-[#5c6bc0] text-[#e1e1e1] hover:bg-[#454b5a]'  // Normal state
                      }`}
                    >
                      {item.comment}
                    </div>
                  </TableCell>
                  <TableCell 
                    className="text-right pr-5 text-white cursor-pointer"
                    onClick={() => handleStartEdit(item)}
                  >
                    {item.grade}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!selectedStudent}
                      onClick={() => {
                        onApplyFeedback({
                          feedbackItem: item,
                          allFeedbackItems: feedbackItems
                        });
                      }}
                      className={`w-6 h-6 ${appliedIds.includes(item.id) ? 'text-[#4CAF50]' : 'text-gray-400'}`}
                    >
                      ✓
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFeedback(item.id)}
                      className="text-[#f44336] hover:text-[#d32f2f] hover:bg-transparent"
                    >
                      ×
                    </Button>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isAddingFeedback ? (
        <div className="mt-4 p-4 bg-[#2d2d2d] rounded-md space-y-4">
          <Textarea
            value={newFeedback.comment}
            onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
            placeholder="Enter feedback text"
            className="bg-[#3a3f4b] border-[#444] text-white min-h-[60px] resize-y"
          />
          <Input
            type="number"
            value={newFeedback.grade}
            onChange={(e) => setNewFeedback({ ...newFeedback, grade: Number(e.target.value) })}
            placeholder="Deduction"
            min={0}
            max={20}
            className="w-[100px] bg-[#3a3f4b] border-[#444] text-white"
          />
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddFeedback}
              className="bg-[#4CAF50] hover:bg-[#45a049] text-white"
            >
              Add
            </Button>
            <Button 
              onClick={() => setIsAddingFeedback(false)}
              className="bg-[#f44336] hover:bg-[#d32f2f] text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          onClick={() => setIsAddingFeedback(true)}
          className="mt-4 w-full bg-[#4CAF50] hover:bg-[#45a049] text-white"
        >
          Add Feedback
        </Button>
      )}
    </div>
  );
};

export default Feedback;
