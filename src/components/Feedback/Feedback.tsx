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
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
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
                onClick={() => onAcceptEdit(item.id)}
                className="bg-[#4CAF50] hover:bg-[#45a049] text-white"
                size="sm"
              >
                ✓
              </Button>
              <Button 
                onClick={onRejectEdit}
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
          <TableCell>
            <div 
              className={`p-2 rounded border-l-4 transition-colors whitespace-pre-wrap break-words ${
                appliedIds.includes(item.id)
                  ? 'bg-[#2d4a3e] border-[#4CAF50] text-[#e1e1e1]'
                  : 'bg-[#3a3f4b] border-[#5c6bc0] text-[#e1e1e1] hover:bg-[#454b5a]'
              }`}
            >
              <div {...attributes} {...listeners} className="cursor-move inline-block">
                <i className="bi bi-grip-vertical mr-2 text-gray-500"></i>
              </div>
              <span 
                className="cursor-pointer hover:bg-[#454b5a] p-1 rounded transition-colors inline-block"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(item);
                }}
              >
                {item.comment}
              </span>
            </div>
          </TableCell>
          <TableCell 
            className="text-right pr-5 text-white cursor-pointer"
            onClick={() => onStartEdit(item)}
          >
            {item.grade}
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="icon"
              disabled={!selectedStudent}
              onClick={() => onApplyFeedback(item)}
              className={`w-6 h-6 ${
                selectedStudent && appliedIds.includes(item.id)
                  ? 'bg-white text-[#4CAF50]' 
                  : 'text-gray-400'
              }`}
            >
              ✓
            </Button>
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteFeedback(item.id)}
              className="text-[#f44336] hover:text-[#d32f2f] hover:bg-transparent"
            >
              <i className="bi bi-trash"></i>
            </Button>
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

const Feedback: React.FC<FeedbackProps> = ({ 
  selectedStudent, 
  appliedIds, 
  onFeedbackEdit,
  feedbackItems,
  setFeedbackItems,
  onStudentsUpdate,
  onChangeTracked
}) => {
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState<Omit<FeedbackItem, 'id' | 'applied'>>({ 
    comment: "", 
    grade: 0 
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingDeduction, setEditingDeduction] = useState(0);
  const [reusableIds, setReusableIds] = useState<number[]>([]);
  const [nextId, setNextId] = useState<number>(5);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
          
          if (student.appliedIds.includes(feedbackItem.id)) {
            // Remove the feedback
            const feedbackLines = student.feedback
              .split('\n')
              .filter(line => line.trim() !== feedbackItem.comment.trim())
              .filter(line => line.trim() !== '')
              .join('\n\n');

            // Calculate new grade
            const remainingIds = student.appliedIds.filter(id => id !== feedbackItem.id);
            const newState = {
              ...student,
              grade: remainingIds.length === 0 ? "" : (20 - feedbackItem.grade).toString(),
              feedback: feedbackLines || "",
              appliedIds: remainingIds,
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
          } else {
            // Apply the feedback
            const newAppliedIds = [...student.appliedIds, feedbackItem.id];
            const newGrade = (20 - feedbackItem.grade).toString();
            const newFeedback = student.feedback
              ? `${student.feedback.trim()}\n\n${feedbackItem.comment.trim()}`
              : feedbackItem.comment.trim();

            const newState = {
              ...student,
              grade: newGrade,
              feedback: newFeedback,
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
        }
        return student;
      })
    );
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
    setReusableIds(prev => [...prev, id]);
    setFeedbackItems(feedbackItems.filter(item => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFeedbackItems((prevItems: FeedbackItem[]) => {
        const oldIndex = prevItems.findIndex((item: FeedbackItem) => item.id === active.id);
        const newIndex = prevItems.findIndex((item: FeedbackItem) => item.id === over.id);
        
        return arrayMove([...prevItems], oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-md h-[calc(100vh-280px)] flex flex-col mt-5">
      <div className="overflow-y-auto flex-1 mb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <Table>
            <TableHeader className="border-b border-[#444]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[#e1e1e1]">Feedback</TableHead>
                <TableHead className="w-[100px] text-[#e1e1e1]">Deduction</TableHead>
                <TableHead className="w-[80px] text-[#e1e1e1]">Apply</TableHead>
                <TableHead className="w-[100px] text-[#e1e1e1]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={feedbackItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {feedbackItems.map((item) => (
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
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>

        {isAddingFeedback ? (
          <div className="mt-2 p-4 bg-[#2d2d2d] rounded-md space-y-4">
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
            className="mt-2 w-full bg-[#4CAF50] hover:bg-[#45a049] text-white"
          >
            Add Feedback
          </Button>
        )}
      </div>
    </div>
  );
};

export default Feedback;
