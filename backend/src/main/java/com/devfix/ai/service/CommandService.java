package com.devfix.ai.service;

import com.devfix.ai.client.DeepSeekClient;
import com.devfix.ai.dto.CommandItem;
import com.devfix.ai.dto.CommandRecommendRequest;
import com.devfix.ai.dto.CommandRecommendResponse;
import com.devfix.ai.exception.AiResponseParseException;
import com.devfix.ai.support.PromptTemplates;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommandService {
    private final DeepSeekClient deepSeekClient;

    public CommandService(DeepSeekClient deepSeekClient) {
        this.deepSeekClient = deepSeekClient;
    }

    public CommandRecommendResponse recommend(CommandRecommendRequest request) {
        String userPrompt = """
                环境：%s
                需求：%s
                """.formatted(defaultText(request.getEnvironment(), "linux"), request.getQuestion());
        try {
            return deepSeekClient.chatJson(PromptTemplates.COMMAND_SYSTEM, userPrompt, CommandRecommendResponse.class);
        } catch (AiResponseParseException ex) {
            CommandItem item = new CommandItem();
            item.setCommand("");
            item.setDescription("AI 返回内容不是合法 JSON，请重试或换一种描述。");
            item.setRiskLevel("blocked");
            item.setReadonly(true);
            CommandRecommendResponse response = new CommandRecommendResponse();
            response.setCommands(List.of(item));
            return response;
        }
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
