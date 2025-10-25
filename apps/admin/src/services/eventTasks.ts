import { supabase } from '@/lib/supabase';

export type EventTask = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  task_type: 'prayer' | 'worship' | 'announcement' | 'sermon' | 'offering' | 'special' | 'technical' | 'general';
  start_time: string | null;
  duration_minutes: number | null;
  priority: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  assignments?: EventTaskAssignment[];
};

export type EventTaskAssignment = {
  id: string;
  event_task_id: string;
  contact_id: string;
  role: 'assigned' | 'lead' | 'backup' | 'support';
  status: 'pending' | 'confirmed' | 'declined' | 'completed';
  notes: string | null;
  assigned_at: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
};

export type CreateEventTaskData = {
  event_id: string;
  title: string;
  description?: string;
  task_type?: EventTask['task_type'];
  start_time?: string;
  duration_minutes?: number;
  priority?: number;
  sort_order?: number;
  notes?: string;
};

export type UpdateEventTaskData = Partial<Omit<EventTask, 'id' | 'created_at' | 'updated_at'>>;

export type CreateEventTaskAssignmentData = {
  event_task_id: string;
  contact_id: string;
  role?: EventTaskAssignment['role'];
  notes?: string;
};

export type UpdateEventTaskAssignmentData = Partial<Omit<EventTaskAssignment, 'id' | 'event_task_id' | 'contact_id' | 'created_at' | 'updated_at'>>;

// Event Tasks CRUD operations
export async function fetchEventTasks(eventId: string) {
  try {
    console.log(`fetchEventTasks: Fetching tasks for event ${eventId}`);
    
    const { data, error } = await supabase
      .from('event_tasks')
      .select(`
        *,
        assignments:event_task_assignments(
          *,
          contact:contacts(id, first_name, last_name, email, phone)
        )
      `)
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('fetchEventTasks error:', error);
      throw error;
    }
    
    console.log(`fetchEventTasks: Successfully fetched ${data?.length || 0} tasks`);
    return { data, error: null };
  } catch (error) {
    console.error('fetchEventTasks exception:', error);
    return { data: null, error };
  }
}

export async function createEventTask(taskData: CreateEventTaskData) {
  try {
    console.log('createEventTask: Creating new task', taskData);
    
    const { data, error } = await supabase
      .from('event_tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) {
      console.error('createEventTask error:', error);
      throw error;
    }
    
    console.log('createEventTask: Successfully created task', data);
    return { data, error: null };
  } catch (error) {
    console.error('createEventTask exception:', error);
    return { data: null, error };
  }
}

export async function updateEventTask(taskId: string, updateData: UpdateEventTaskData) {
  try {
    console.log(`updateEventTask: Updating task ${taskId}`, updateData);
    
    const { data, error } = await supabase
      .from('event_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) {
      console.error('updateEventTask error:', error);
      throw error;
    }
    
    console.log('updateEventTask: Successfully updated task', data);
    return { data, error: null };
  } catch (error) {
    console.error('updateEventTask exception:', error);
    return { data: null, error };
  }
}

export async function deleteEventTask(taskId: string) {
  try {
    console.log(`deleteEventTask: Deleting task ${taskId}`);
    
    // First delete all assignments
    const { error: assignmentsError } = await supabase
      .from('event_task_assignments')
      .delete()
      .eq('event_task_id', taskId);
    
    if (assignmentsError) {
      console.error('deleteEventTask assignments error:', assignmentsError);
      // Continue anyway
    }
    
    // Then delete the task
    const { error } = await supabase
      .from('event_tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('deleteEventTask error:', error);
      throw error;
    }
    
    console.log('deleteEventTask: Successfully deleted task');
    return { data: null, error: null };
  } catch (error) {
    console.error('deleteEventTask exception:', error);
    return { data: null, error };
  }
}

// Event Task Assignments CRUD operations
export async function fetchEventTaskAssignments(taskId: string) {
  try {
    console.log(`fetchEventTaskAssignments: Fetching assignments for task ${taskId}`);
    
    const { data, error } = await supabase
      .from('event_task_assignments')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone)
      `)
      .eq('event_task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('fetchEventTaskAssignments error:', error);
      throw error;
    }
    
    console.log(`fetchEventTaskAssignments: Successfully fetched ${data?.length || 0} assignments`);
    return { data, error: null };
  } catch (error) {
    console.error('fetchEventTaskAssignments exception:', error);
    return { data: null, error };
  }
}

export async function createEventTaskAssignment(assignmentData: CreateEventTaskAssignmentData) {
  try {
    console.log('createEventTaskAssignment: Creating new assignment', assignmentData);
    
    const { data, error } = await supabase
      .from('event_task_assignments')
      .insert(assignmentData)
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone)
      `)
      .single();
    
    if (error) {
      console.error('createEventTaskAssignment error:', error);
      throw error;
    }
    
    console.log('createEventTaskAssignment: Successfully created assignment', data);
    return { data, error: null };
  } catch (error) {
    console.error('createEventTaskAssignment exception:', error);
    return { data: null, error };
  }
}

export async function updateEventTaskAssignment(assignmentId: string, updateData: UpdateEventTaskAssignmentData) {
  try {
    console.log(`updateEventTaskAssignment: Updating assignment ${assignmentId}`, updateData);
    
    const { data, error } = await supabase
      .from('event_task_assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone)
      `)
      .single();
    
    if (error) {
      console.error('updateEventTaskAssignment error:', error);
      throw error;
    }
    
    console.log('updateEventTaskAssignment: Successfully updated assignment', data);
    return { data, error: null };
  } catch (error) {
    console.error('updateEventTaskAssignment exception:', error);
    return { data: null, error };
  }
}

export async function deleteEventTaskAssignment(assignmentId: string) {
  try {
    console.log(`deleteEventTaskAssignment: Deleting assignment ${assignmentId}`);
    
    const { error } = await supabase
      .from('event_task_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (error) {
      console.error('deleteEventTaskAssignment error:', error);
      throw error;
    }
    
    console.log('deleteEventTaskAssignment: Successfully deleted assignment');
    return { data: null, error: null };
  } catch (error) {
    console.error('deleteEventTaskAssignment exception:', error);
    return { data: null, error };
  }
}

// Helper functions
export async function duplicateEventTasks(sourceEventId: string, targetEventId: string) {
  try {
    console.log(`duplicateEventTasks: Duplicating tasks from ${sourceEventId} to ${targetEventId}`);
    
    // Get all tasks from source event
    const { data: sourceTasks, error: fetchError } = await supabase
      .from('event_tasks')
      .select('*')
      .eq('event_id', sourceEventId)
      .order('sort_order', { ascending: true });
    
    if (fetchError) throw fetchError;
    
    if (!sourceTasks || sourceTasks.length === 0) {
      console.log('No tasks to duplicate');
      return { data: [], error: null };
    }
    
    // Create new tasks for target event
    const newTasks = sourceTasks.map(task => ({
      event_id: targetEventId,
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      start_time: task.start_time,
      duration_minutes: task.duration_minutes,
      priority: task.priority,
      sort_order: task.sort_order,
      notes: task.notes
    }));
    
    const { data, error } = await supabase
      .from('event_tasks')
      .insert(newTasks)
      .select();
    
    if (error) {
      console.error('duplicateEventTasks error:', error);
      throw error;
    }
    
    console.log(`duplicateEventTasks: Successfully duplicated ${data?.length || 0} tasks`);
    return { data, error: null };
  } catch (error) {
    console.error('duplicateEventTasks exception:', error);
    return { data: null, error };
  }
}

export async function reorderEventTasks(eventId: string, taskIds: string[]) {
  try {
    console.log(`reorderEventTasks: Reordering tasks for event ${eventId}`);
    
    const updates = taskIds.map((taskId, index) => ({
      id: taskId,
      sort_order: index + 1
    }));
    
    // Update each task's sort_order
    const promises = updates.map(update => 
      supabase
        .from('event_tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('event_id', eventId)
    );
    
    await Promise.all(promises);
    
    console.log('reorderEventTasks: Successfully reordered tasks');
    return { data: null, error: null };
  } catch (error) {
    console.error('reorderEventTasks exception:', error);
    return { data: null, error };
  }
} 