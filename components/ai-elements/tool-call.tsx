"use client";

import { useState } from "react";
import { 
  GlobeIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  Loader2Icon, 
  CheckCircle2Icon, 
  AlertCircleIcon, 
  ExternalLinkIcon 
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";

export interface ToolCallInfo {
  id: string;
  name: string;
  args: any;
  result?: any;
  status: "pending" | "complete" | "error";
}

interface ToolCallProps {
  toolCall: ToolCallInfo;
}

export function ToolCall({ toolCall }: ToolCallProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isWebSearch = toolCall.name === "webSearch";

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "pending":
        return <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "complete":
        return <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <AlertCircleIcon className="h-4 w-4 text-destructive" />;
    }
  };

  const getLabel = () => {
    if (isWebSearch) {
      switch (toolCall.status) {
        case "pending":
          return `Searching for "${toolCall.args?.query || ""}"...`;
        case "complete":
          return `Searched for "${toolCall.args?.query || ""}"`;
        case "error":
          return "Web search failed";
      }
    }
    return `Executing tool: ${toolCall.name}`;
  };

  const searchResults: any[] = toolCall.result?.results || [];

  return (
    <Card className="my-2 overflow-hidden border border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger 
          className="flex w-full items-center justify-between p-3 text-left hover:bg-accent/40 focus:outline-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <GlobeIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{getLabel()}</span>
              <span className="text-xs text-muted-foreground capitalize">{toolCall.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {isOpen ? (
              <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border bg-accent/10 px-3 py-3">
          {toolCall.status === "pending" && (
            <div className="flex items-center justify-center py-4 space-x-2 text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              <span className="text-sm">Retrieving search results...</span>
            </div>
          )}

          {toolCall.status === "error" && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {toolCall.result?.error || "An unknown error occurred during execution."}
            </div>
          )}

          {toolCall.status === "complete" && (
            <div className="space-y-3">
              {searchResults.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No results found.</p>
              ) : (
                searchResults.map((res: any, idx: number) => (
                  <div 
                    key={res.url || idx}
                    className="group relative rounded-lg border border-border/60 bg-background p-3 transition-colors hover:border-primary/30 hover:bg-accent/20"
                  >
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      <span>{res.title || "Search Result"}</span>
                      <ExternalLinkIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {res.content && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {res.content}
                      </p>
                    )}
                    <span className="mt-1 block text-[10px] text-muted-foreground/60 truncate">
                      {res.url}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface ToolCallListProps {
  toolCalls: ToolCallInfo[];
}

export function ToolCallList({ toolCalls }: ToolCallListProps) {
  return (
    <div className="flex flex-col gap-1 w-full my-1">
      {toolCalls.map((tc) => (
        <ToolCall key={tc.id} toolCall={tc} />
      ))}
    </div>
  );
}
