import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { MessageDisplay } from "./MessageDisplay";
import { ChatInput } from "./ChatInput";
import { useRaceChat } from "@/hooks/useRaceChat";

interface RaceChatProps {
  raceId: string;
}

export const RaceChat = ({ raceId }: RaceChatProps) => {
  const { messages, isLoading, sendMessage, loadMessages } = useRaceChat(raceId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [raceId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="border-b p-2">
        <Tabs defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map((msg, index) => (
          <MessageDisplay key={index} role={msg.role} message={msg.message} />
        ))}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </ScrollArea>

      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};