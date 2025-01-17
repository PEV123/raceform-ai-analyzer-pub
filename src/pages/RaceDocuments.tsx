import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceList } from "@/components/admin/RaceList";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { useState } from "react";

const RaceDocuments = () => {
  const [date, setDate] = useState<Date>(new Date());

  const { data: races, isLoading } = useQuery({
    queryKey: ["races", format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      // Format dates in UK timezone for database query
      const ukDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
      const start = `${ukDate}T00:00:00+00:00`;
      const end = `${ukDate}T23:59:59.999+00:00`;
      
      console.log('Fetching races between (UK time):', start, 'and', end);

      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          race_documents (*),
          runners (*)
        `)
        .gte('off_time', start)
        .lt('off_time', end)
        .order('off_time', { ascending: true });

      if (error) {
        console.error('Error fetching races:', error);
        throw error;
      }
      
      console.log('Successfully fetched races:', data);
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Race Documents</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatInTimeZone(date, 'Europe/London', 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Race Documents</h2>
        {isLoading ? (
          <p>Loading races...</p>
        ) : !races?.length ? (
          <p>No races found for this date.</p>
        ) : (
          <RaceList races={races} />
        )}
      </Card>
    </div>
  );
};

export default RaceDocuments;