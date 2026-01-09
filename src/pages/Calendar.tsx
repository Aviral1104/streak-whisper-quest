import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  differenceInMinutes,
  isSameDay
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Plus,
  Clock,
  Check,
  MoreHorizontal,
  Trash2,
  Edit2,
  Link2
} from 'lucide-react';
import Header from '@/components/Header';
import EventDialog from '@/components/EventDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEvents, CalendarEvent } from '@/hooks/useEvents';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function Calendar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [completingEvent, setCompletingEvent] = useState<CalendarEvent | null>(null);

  const { events, isLoading, createEvent, updateEvent, deleteEvent, completeEvent, getEventsForDate } = useEvents(currentMonth);
  const { habits } = useHabits();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleCreateEvent = (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_completed'>) => {
    createEvent.mutate(event);
  };

  const handleUpdateEvent = (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_completed'>) => {
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...event });
      setEditingEvent(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingEvent) {
      deleteEvent.mutate(deletingEvent.id);
      setDeletingEvent(null);
    }
  };

  const handleCompleteEvent = (logHours: boolean) => {
    if (completingEvent) {
      completeEvent.mutate({ eventId: completingEvent.id, logHours });
      setCompletingEvent(null);
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                Event Planner
              </h1>
              <p className="text-muted-foreground mt-1">
                Schedule events and link them to your habits
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold min-w-[140px] text-center px-4 py-2 bg-card rounded-xl shadow-soft">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                className="gap-2 ml-2 rounded-xl" 
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden rounded-2xl shadow-medium">
              <CardContent className="p-0">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-muted/50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleDayClick(day)}
                        whileHover={{ scale: 0.98 }}
                        className={cn(
                          "min-h-[100px] p-2 border-r border-b border-border/50 text-left transition-all",
                          !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                          isTodayDate && "bg-primary/5",
                          isSelected && "ring-2 ring-primary ring-inset"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1",
                          isTodayDate && "bg-primary text-primary-foreground"
                        )}>
                          {format(day, 'd')}
                        </div>
                        
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded truncate",
                                event.is_completed && "opacity-60 line-through"
                              )}
                              style={{ backgroundColor: `${event.color}20`, color: event.color }}
                            >
                              {format(parseISO(event.start_time), 'HH:mm')} {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Selected Day Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-2xl shadow-medium sticky top-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a day'}
                  </h3>
                  {selectedDate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEvent(null);
                        setIsEventDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {selectedDate ? (
                  <AnimatePresence mode="popLayout">
                    {selectedDayEvents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDayEvents.map((event) => {
                          const duration = differenceInMinutes(
                            parseISO(event.end_time),
                            parseISO(event.start_time)
                          );
                          const linkedHabit = event.linked_habit_id 
                            ? habits.find(h => h.id === event.linked_habit_id)
                            : null;

                          return (
                            <motion.div
                              key={event.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={cn(
                                "p-3 rounded-xl border transition-all",
                                event.is_completed 
                                  ? "bg-muted/50 border-muted" 
                                  : "bg-card border-border hover:border-primary/30"
                              )}
                              style={{ borderLeftWidth: 4, borderLeftColor: event.color }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className={cn(
                                    "font-medium truncate",
                                    event.is_completed && "line-through text-muted-foreground"
                                  )}>
                                    {event.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <Clock className="w-3 h-3" />
                                    {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                                    <span>({Math.round(duration / 60 * 10) / 10}h)</span>
                                  </div>
                                  {linkedHabit && (
                                    <div className="flex items-center gap-1 text-xs text-primary mt-1">
                                      <Link2 className="w-3 h-3" />
                                      {linkedHabit.icon} {linkedHabit.name}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  {!event.is_completed && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => setCompletingEvent(event)}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setEditingEvent(event);
                                        setIsEventDialogOpen(true);
                                      }}>
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => setDeletingEvent(event)} 
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-muted-foreground py-8"
                      >
                        No events scheduled
                      </motion.p>
                    )}
                  </AnimatePresence>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Click on a day to see events
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Event Dialog */}
      <EventDialog
        open={isEventDialogOpen}
        onOpenChange={(open) => {
          setIsEventDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}
        onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
        habits={habits}
        editingEvent={editingEvent}
        defaultDate={selectedDate || undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingEvent?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Event Confirmation */}
      <AlertDialog open={!!completingEvent} onOpenChange={() => setCompletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Event</AlertDialogTitle>
            <AlertDialogDescription>
              {completingEvent?.linked_habit_id ? (
                <>
                  This event is linked to a habit. Would you like to log the time ({
                    Math.round(differenceInMinutes(
                      parseISO(completingEvent.end_time),
                      parseISO(completingEvent.start_time)
                    ) / 60 * 10) / 10
                  }h) to the habit?
                </>
              ) : (
                'Mark this event as completed?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {completingEvent?.linked_habit_id ? (
              <>
                <Button variant="outline" onClick={() => handleCompleteEvent(false)}>
                  Complete Only
                </Button>
                <AlertDialogAction onClick={() => handleCompleteEvent(true)}>
                  Complete & Log Hours
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => handleCompleteEvent(false)}>
                Complete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
