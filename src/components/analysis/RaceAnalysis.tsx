import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RaceChat } from "./RaceChat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { formatInTimeZone } from 'date-fns-tz';
import { OddsDisplay } from "../race/OddsDisplay";
import { RawDataDialog } from "../admin/RawDataDialog";
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";

interface RaceAnalysisProps {
  raceId: string;
}

type Race = Tables<"races"> & {
  runners: Tables<"runners">[];
};

export const RaceAnalysis = ({ raceId }: RaceAnalysisProps) => {
  const navigate = useNavigate();
  const [showRawData, setShowRawData] = useState(false);
  
  const { data: settings } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: race, isLoading } = useQuery({
    queryKey: ["race", raceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select(`
          *,
          runners (*)
        `)
        .eq("id", raceId)
        .single();

      if (error) throw error;
      return data as Race;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!race) {
    return <div>Race not found</div>;
  }

  const formatDateTime = (date: string) => {
    return formatInTimeZone(
      new Date(date),
      settings?.timezone || 'Europe/London',
      'PPpp'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/analysis")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Race Analysis</h1>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => setShowRawData(true)}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Raw Data
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{race.course}</h2>
            <p className="text-muted-foreground">
              {formatDateTime(race.off_time)}
            </p>
            <p>{race.race_name}</p>
            <p>
              {race.race_class} | {race.age_band} | {race.rating_band}
            </p>
            <p>Prize: {race.prize}</p>
            <p>Runners: {race.field_size}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Runners</h3>
            <div className="space-y-2">
              {race.runners.map((runner) => (
                <div
                  key={runner.id}
                  className="p-2 bg-muted rounded-lg flex items-center gap-2"
                >
                  <div className="w-6 text-center font-bold">{runner.number}</div>
                  <div className="flex-1">
                    <div className="font-medium">{runner.horse}</div>
                    <div className="text-sm text-muted-foreground">
                      {runner.jockey} | {runner.trainer}
                    </div>
                  </div>
                  <OddsDisplay odds={runner.odds} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">AI Analysis Chat</h3>
          <RaceChat raceId={raceId} />
        </div>
      </Card>

      <RawDataDialog 
        open={showRawData} 
        onOpenChange={setShowRawData}
        race={race}
      />
    </div>
  );
};