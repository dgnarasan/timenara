
import { useState, useEffect, useCallback } from "react";
import { ScheduleItem } from "@/lib/types";
import { fetchAdminSchedule, clearSchedule, publishSchedule } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export const useDashboardState = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSchedulePublished, setIsSchedulePublished] = useState(false);
  const [isClearingSchedule, setIsClearingSchedule] = useState(false);
  const { toast } = useToast();

  // Simplified validation function
  const isValidScheduleItem = useCallback((item: any): item is ScheduleItem => {
    try {
      return Boolean(
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.code === 'string' &&
        typeof item.name === 'string' &&
        typeof item.lecturer === 'string' &&
        typeof item.department === 'string' &&
        typeof item.classSize === 'number' &&
        item.timeSlot &&
        typeof item.timeSlot === 'object' &&
        typeof item.timeSlot.day === 'string' &&
        typeof item.timeSlot.startTime === 'string' &&
        typeof item.timeSlot.endTime === 'string' &&
        item.venue &&
        typeof item.venue === 'object' &&
        typeof item.venue.name === 'string'
      );
    } catch {
      return false;
    }
  }, []);

  // Safe filtering function
  const filterValidScheduleItems = useCallback((items: any[]): ScheduleItem[] => {
    if (!Array.isArray(items)) {
      console.warn('Dashboard: Input is not an array');
      return [];
    }

    return items.filter(item => isValidScheduleItem(item));
  }, [isValidScheduleItem]);

  // Load existing schedule from database
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoadingSchedule(true);
        console.log('📡 Dashboard: Loading schedule from database...');
        const existingSchedule = await fetchAdminSchedule();
        console.log('📡 Dashboard: Raw schedule from database:', existingSchedule);
        
        if (existingSchedule) {
          const validSchedule = filterValidScheduleItems(existingSchedule);
          console.log('✅ Dashboard: Setting filtered schedule:', validSchedule);
          setSchedule(validSchedule);
          setIsSchedulePublished(validSchedule.length > 0);
        } else {
          console.log('📡 Dashboard: No schedule found');
          setSchedule([]);
          setIsSchedulePublished(false);
        }
      } catch (error) {
        console.error('❌ Dashboard: Error loading schedule:', error);
        setSchedule([]);
        toast({
          title: "Error",
          description: "Failed to load existing schedule",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    loadSchedule();
  }, [toast, filterValidScheduleItems]);

  const handleTogglePublish = useCallback(async () => {
    if (schedule.length === 0) {
      toast({
        title: "No Schedule to Publish",
        description: "Please generate a schedule first before publishing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPublishing(true);
      const newPublishStatus = !isSchedulePublished;
      await publishSchedule(newPublishStatus);
      setIsSchedulePublished(newPublishStatus);
      
      toast({
        title: newPublishStatus ? "Schedule Published" : "Schedule Unpublished",
        description: newPublishStatus 
          ? "The schedule is now visible to students." 
          : "The schedule has been hidden from students.",
      });
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Error",
        description: "Failed to update publish status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [schedule.length, isSchedulePublished, toast]);

  const handleClearSchedule = useCallback(async () => {
    if (!window.confirm("Are you sure you want to clear the entire schedule? This action cannot be undone.")) {
      return;
    }

    try {
      setIsClearingSchedule(true);
      console.log('🗑️ Dashboard: Starting to clear schedule...');
      
      await clearSchedule();
      console.log('✅ Dashboard: Database cleared successfully');
      
      setTimeout(() => {
        setSchedule([]);
        setIsSchedulePublished(false);
        setIsClearingSchedule(false);
        
        console.log('✅ Dashboard: Local state cleared successfully');
        
        toast({
          title: "Schedule Cleared",
          description: "All schedule entries have been removed.",
        });
      }, 100);
      
    } catch (error) {
      console.error('❌ Dashboard: Error clearing schedule:', error);
      setIsClearingSchedule(false);
      toast({
        title: "Error",
        description: "Failed to clear schedule. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleScheduleGenerated = useCallback((newSchedule: ScheduleItem[]) => {
    try {
      console.log('🚀 Dashboard: Processing generated schedule:', newSchedule);
      
      if (!Array.isArray(newSchedule)) {
        console.error('❌ Dashboard: Invalid schedule format received:', typeof newSchedule);
        toast({
          title: "Error",
          description: "Invalid schedule format received. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const validSchedule = filterValidScheduleItems(newSchedule);
      
      console.log('✅ Dashboard: Setting cleaned schedule:', validSchedule);
      
      setTimeout(() => {
        setSchedule(validSchedule);
        setIsSchedulePublished(false);
        
        if (validSchedule.length > 0) {
          toast({
            title: "Schedule Generated Successfully",
            description: `${validSchedule.length} courses scheduled without conflicts.`,
          });
        } else {
          toast({
            title: "No Valid Schedule Generated",
            description: "No valid schedule items could be created. Please check your course data and try again.",
            variant: "destructive",
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Dashboard: Error processing generated schedule:', error);
      setTimeout(() => {
        setSchedule([]);
        setIsSchedulePublished(false);
      }, 100);
      toast({
        title: "Error",
        description: "Failed to process generated schedule. Please try again.",
        variant: "destructive",
      });
    }
  }, [filterValidScheduleItems, toast]);

  return {
    schedule,
    isLoadingSchedule,
    isPublishing,
    isSchedulePublished,
    isClearingSchedule,
    handleTogglePublish,
    handleClearSchedule,
    handleScheduleGenerated,
  };
};
