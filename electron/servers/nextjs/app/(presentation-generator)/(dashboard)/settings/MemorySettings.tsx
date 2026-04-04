"use client";
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Brain } from "lucide-react";
import { LLMConfig } from "@/types/llm_config";

interface MemorySettingsProps {
  llmConfig: LLMConfig;
  onInputChange: (value: string | boolean, field: string) => void;
}

const MemorySettings = ({ llmConfig, onInputChange }: MemorySettingsProps) => {
  const memoryEnabled = llmConfig.MEMORI_ENABLED === true;

  return (
    <div className="w-full space-y-6">
      <div className="bg-[#F9F8F8] p-7 rounded-[20px]">
        <h4 className="text-sm font-semibold text-[#191919] mb-1">Memory</h4>
        <p className="text-xs text-[#6B7280] mb-6 leading-relaxed max-w-lg">
          Control whether conversation memory is used to provide richer context across interactions.
        </p>

        <div className="flex items-center justify-between gap-4 rounded-[10px] bg-white border border-[#EDEEEF] p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full border border-[#EDEEEF] flex items-center justify-center bg-white mt-0.5">
              <Brain className="w-4 h-4 text-[#5146E5]" />
            </div>
            <div>
              <label
                htmlFor="memory-toggle"
                className="text-sm font-medium text-[#191919] cursor-pointer select-none block"
              >
                {memoryEnabled ? "Memory Enabled" : "Memory Disabled"}
              </label>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {memoryEnabled
                  ? "Conversation memory is active for richer context."
                  : "Conversation memory is turned off."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="memory-toggle"
              checked={memoryEnabled}
              onCheckedChange={(checked) => onInputChange(checked, "MEMORI_ENABLED")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorySettings;