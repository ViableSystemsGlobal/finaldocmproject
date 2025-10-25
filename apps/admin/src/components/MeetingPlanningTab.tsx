'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  User, 
  Users,
  CheckCircle,
  Circle,
  AlertCircle,
  Calendar,
  Play,
  Pause,
  Square,
  GripVertical,
  Search,
  Filter,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { 
  EventTask, 
  EventTaskAssignment, 
  CreateEventTaskData, 
  UpdateEventTaskData,
  CreateEventTaskAssignmentData,
  fetchEventTasks,
  createEventTask,
  updateEventTask,
  deleteEventTask,
  createEventTaskAssignment,
  updateEventTaskAssignment,
  deleteEventTaskAssignment,
  reorderEventTasks
} from '@/services/eventTasks';
import { getContactsForMemberSelection } from '@/services/groups';
import { sendEmail } from '@/services/emailService';

interface MeetingPlanningTabProps {
  eventId: string;
}

const TASK_TYPES = [
  { value: 'prayer', label: 'Prayer', icon: '🙏' },
  { value: 'worship', label: 'Worship', icon: '🎵' },
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'sermon', label: 'Sermon', icon: '📖' },
  { value: 'offering', label: 'Offering', icon: '💰' },
  { value: 'special', label: 'Special', icon: '⭐' },
  { value: 'technical', label: 'Technical', icon: '🎛️' },
  { value: 'general', label: 'General', icon: '📋' },
];

const TASK_STATUSES = [
  { value: 'planned', label: 'Planned', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

const ASSIGNMENT_ROLES = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'lead', label: 'Lead' },
  { value: 'backup', label: 'Backup' },
  { value: 'support', label: 'Support' },
];

const ASSIGNMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
];

export default function MeetingPlanningTab({ eventId }: MeetingPlanningTabProps) {
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<EventTask | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<EventTaskAssignment | null>(null);
  const [selectedTask, setSelectedTask] = useState<EventTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  // Task form state
  const [taskForm, setTaskForm] = useState<CreateEventTaskData>({
    event_id: eventId,
    title: '',
    description: '',
    task_type: 'general',
    start_time: '',
    duration_minutes: 30,
    priority: 1,
    sort_order: 0,
    notes: ''
  });

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState<CreateEventTaskAssignmentData>({
    event_task_id: '',
    contact_id: '',
    role: 'assigned',
    notes: ''
  });

  useEffect(() => {
    loadTasks();
    loadContacts();
  }, [eventId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchEventTasks(eventId);
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      toast({
        title: "Error",
        description: "Failed to load meeting tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const { data, error } = await getContactsForMemberSelection();
      if (error) throw error;
      setContacts(data || []);
      console.log(`Loaded ${data?.length || 0} contacts for assignment`);
    } catch (err) {
      console.error('Error loading contacts:', err);
      toast({
        title: "Warning",
        description: "Could not load contacts for assignment. You may need to add contacts first.",
        variant: "destructive",
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const { data, error } = await createEventTask(taskForm);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      
      setShowTaskDialog(false);
      resetTaskForm();
      loadTasks();
    } catch (err) {
      console.error('Error creating task:', err);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      const { error } = await updateEventTask(editingTask.id, taskForm as UpdateEventTaskData);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
      
      setShowTaskDialog(false);
      setEditingTask(null);
      resetTaskForm();
      loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await deleteEventTask(taskId);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
      
      loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedTask) return;
    
    try {
      const { data, error } = await createEventTaskAssignment(assignmentForm);
      if (error) throw error;
      
      // Send email notification if enabled
      const assignedContact = contacts.find(c => c.id === assignmentForm.contact_id);
      let emailSent = false;
      
      if (sendEmailNotification && assignedContact && assignedContact.email) {
        try {
          await sendTaskAssignmentEmail(selectedTask, assignedContact, assignmentForm);
          emailSent = true;
        } catch (error) {
          console.error('Failed to send email notification:', error);
          // Don't fail the assignment creation if email fails
        }
      }
      
      toast({
        title: "Success",
        description: emailSent 
          ? "Assignment created successfully! Email notification sent."
          : sendEmailNotification 
            ? "Assignment created successfully! (Email notification failed)"
            : "Assignment created successfully!",
      });
      
      setShowAssignmentDialog(false);
      resetAssignmentForm();
      loadTasks();
    } catch (err) {
      console.error('Error creating assignment:', err);
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await deleteEventTaskAssignment(assignmentId);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment removed successfully",
      });
      
      loadTasks();
    } catch (err) {
      console.error('Error removing assignment:', err);
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive",
      });
    }
  };

  const sendTaskAssignmentEmail = async (task: EventTask, contact: any, assignment: CreateEventTaskAssignmentData) => {
    try {
      const taskTypeInfo = getTaskTypeInfo(task.task_type);
      const roleLabel = ASSIGNMENT_ROLES.find(r => r.value === assignment.role)?.label || assignment.role;
      
      const emailSubject = `Task Assignment: ${task.title}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; font-size: 28px; margin: 0;">Task Assignment</h1>
              <p style="color: #6B7280; margin: 10px 0 0 0;">You've been assigned to a new task</p>
            </div>
            
            <div style="background-color: #EEF2FF; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 12px;">${taskTypeInfo.icon}</span>
                <h2 style="color: #1F2937; font-size: 22px; margin: 0;">${task.title}</h2>
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">Role:</strong> 
                <span style="color: #6B7280;">${roleLabel}</span>
              </div>
              
              ${task.description ? `
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Description:</strong>
                  <p style="color: #6B7280; margin: 5px 0 0 0; line-height: 1.6;">${task.description}</p>
                </div>
              ` : ''}
              
              ${task.start_time ? `
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Start Time:</strong>
                  <span style="color: #6B7280;">${formatTime(task.start_time)}</span>
                </div>
              ` : ''}
              
              ${task.duration_minutes ? `
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Duration:</strong>
                  <span style="color: #6B7280;">${task.duration_minutes} minutes</span>
                </div>
              ` : ''}
              
              ${assignment.notes ? `
                <div style="margin-bottom: 15px;">
                  <strong style="color: #374151;">Additional Notes:</strong>
                  <p style="color: #6B7280; margin: 5px 0 0 0; line-height: 1.6; padding: 12px; background-color: #FEF3C7; border-radius: 6px; border-left: 4px solid #F59E0B;">${assignment.notes}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #1F2937; font-size: 16px; margin: 0 0 10px 0;">Hi ${contact.first_name || 'there'}!</h3>
              <p style="color: #6B7280; line-height: 1.6; margin: 0;">
                You've been assigned to help with <strong>${task.title}</strong> as a <strong>${roleLabel}</strong>. 
                Please review the details above and let us know if you have any questions.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9CA3AF; font-size: 14px; margin: 0;">
                If you have any questions or concerns, please don't hesitate to reach out to the event organizer.
              </p>
            </div>
          </div>
        </div>
      `;

      const result = await sendEmail(contact.email, {
        subject: emailSubject,
        body: emailBody,
        plainText: `Task Assignment: ${task.title}\n\nHi ${contact.first_name || 'there'},\n\nYou've been assigned to help with "${task.title}" as a ${roleLabel}.\n\n${task.description ? `Description: ${task.description}\n\n` : ''}${task.start_time ? `Start Time: ${formatTime(task.start_time)}\n` : ''}${task.duration_minutes ? `Duration: ${task.duration_minutes} minutes\n` : ''}${assignment.notes ? `\nAdditional Notes: ${assignment.notes}\n\n` : ''}Please let us know if you have any questions!`
      }, {
        emailType: 'events',
        metadata: {
          task_id: task.id,
          contact_id: contact.id,
          event_id: task.event_id,
          assignment_role: assignment.role,
          email_type: 'task_assignment'
        }
      });

      if (result.success) {
        console.log('Task assignment email sent successfully:', result.messageId);
      } else {
        console.error('Failed to send task assignment email:', result.error);
      }
    } catch (error) {
      console.error('Error sending task assignment email:', error);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      event_id: eventId,
      title: '',
      description: '',
      task_type: 'general',
      start_time: '',
      duration_minutes: 30,
      priority: 1,
      sort_order: 0,
      notes: ''
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      event_task_id: '',
      contact_id: '',
      role: 'assigned',
      notes: ''
    });
  };

  const openTaskDialog = (task?: EventTask) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        event_id: task.event_id,
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        start_time: task.start_time || '',
        duration_minutes: task.duration_minutes || 30,
        priority: task.priority,
        sort_order: task.sort_order,
        notes: task.notes || ''
      });
    } else {
      setEditingTask(null);
      resetTaskForm();
    }
    setShowTaskDialog(true);
  };

  const openAssignmentDialog = (task: EventTask) => {
    setSelectedTask(task);
    setAssignmentForm({
      event_task_id: task.id,
      contact_id: '',
      role: 'assigned',
      notes: ''
    });
    setContactSearchQuery(''); // Reset search when opening dialog
    setSendEmailNotification(true); // Default to sending email
    setShowAssignmentDialog(true);
  };

  const getTaskTypeInfo = (type: string) => {
    return TASK_TYPES.find(t => t.value === type) || TASK_TYPES[TASK_TYPES.length - 1];
  };

  const getStatusInfo = (status: string) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };

  const getAssignmentStatusInfo = (status: string) => {
    return ASSIGNMENT_STATUSES.find(s => s.value === status) || ASSIGNMENT_STATUSES[0];
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContacts = contacts.filter(contact => {
    if (!contactSearchQuery) return true;
    const searchLower = contactSearchQuery.toLowerCase();
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    const email = (contact.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Meeting Planning</h2>
                <p className="text-purple-100">Organize tasks and assignments for this event</p>
              </div>
            </div>
            <Button
              onClick={() => openTaskDialog()}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TASK_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-4">
                Start planning your meeting by adding tasks and assignments.
              </p>
              <Button onClick={() => openTaskDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const taskTypeInfo = getTaskTypeInfo(task.task_type);
            const statusInfo = getStatusInfo(task.status);
            
            return (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{taskTypeInfo.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        {task.description && (
                          <CardDescription className="text-gray-600">
                            {task.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {task.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(task.start_time)}
                            </div>
                          )}
                          {task.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {task.duration_minutes} min
                            </div>
                          )}
                          {task.assignments && task.assignments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {task.assignments.length} assigned
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignmentDialog(task)}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTaskDialog(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Assignments */}
                {task.assignments && task.assignments.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">Assignments</h4>
                      {task.assignments.map((assignment) => {
                        const assignmentStatusInfo = getAssignmentStatusInfo(assignment.status);
                        
                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {assignment.contact?.first_name} {assignment.contact?.last_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {assignment.role} • {assignment.contact?.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={assignmentStatusInfo.color}>
                                {assignmentStatusInfo.label}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update task details and scheduling' : 'Create a new task for this meeting'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="e.g., Opening Prayer"
                />
              </div>
              <div>
                <Label htmlFor="task_type">Task Type</Label>
                <Select value={taskForm.task_type} onValueChange={(value) => setTaskForm({...taskForm, task_type: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                placeholder="Brief description of the task"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={taskForm.start_time}
                  onChange={(e) => setTaskForm({...taskForm, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="1"
                  value={taskForm.duration_minutes}
                  onChange={(e) => setTaskForm({...taskForm, duration_minutes: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={taskForm.priority?.toString()} onValueChange={(value) => setTaskForm({...taskForm, priority: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Critical</SelectItem>
                    <SelectItem value="5">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={taskForm.notes}
                onChange={(e) => setTaskForm({...taskForm, notes: e.target.value})}
                placeholder="Additional notes or instructions"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Person to Task</DialogTitle>
            <DialogDescription>
              Assign someone to: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact_search">Search Person</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="contact_search"
                  placeholder="Type to search by name or email..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {contactSearchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContactSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="contact_id">Person</Label>
              <Select value={assignmentForm.contact_id} onValueChange={(value) => setAssignmentForm({...assignmentForm, contact_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingContacts ? "Loading contacts..." : filteredContacts.length === 0 ? "No contacts match search" : "Select a person"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <SelectItem value="no-contacts" disabled>
                      {loadingContacts ? "Loading..." : contactSearchQuery ? "No matches found. Try different search terms." : "No contacts found. Add contacts first."}
                    </SelectItem>
                  ) : (
                    filteredContacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                        {contact.email && ` (${contact.email})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {contactSearchQuery && (
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredContacts.length} of {contacts.length} contacts
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={assignmentForm.role} onValueChange={(value) => setAssignmentForm({...assignmentForm, role: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="assignment_notes">Notes</Label>
              <Textarea
                id="assignment_notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm({...assignmentForm, notes: e.target.value})}
                placeholder="Special instructions or notes"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="send_email"
                  checked={sendEmailNotification}
                  onCheckedChange={setSendEmailNotification}
                />
                <Label htmlFor="send_email" className="text-sm font-normal cursor-pointer">
                  Send email notification to assigned person
                </Label>
              </div>
              {sendEmailNotification && (
                <p className="text-xs text-gray-600 ml-6">
                  ✉️ Will include task details, timing, role, and any notes you've added
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAssignment}
              disabled={!assignmentForm.contact_id || assignmentForm.contact_id === 'no-contacts' || loadingContacts}
            >
              Assign Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 