package com.devfix.ai.client;

import com.devfix.ai.config.DeepSeekProperties;
import com.devfix.ai.exception.AiResponseParseException;
import com.devfix.ai.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class DeepSeekClient {
    private final DeepSeekProperties properties;
    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;

    public DeepSeekClient(DeepSeekProperties properties,
                          RestClient.Builder restClientBuilder,
                          ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClientBuilder = restClientBuilder;
        this.objectMapper = objectMapper;
    }

    public <T> T chatJson(String systemPrompt, String userPrompt, Class<T> responseType) {
        validateConfig();
        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "temperature", 0.2,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        String responseBody = restClientBuilder
                .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
                .build()
                .post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .headers(headers -> headers.setBearerAuth(properties.getApiKey()))
                .body(body)
                .retrieve()
                .body(String.class);

        String content = extractAssistantContent(responseBody);
        return parseStrictJson(content, responseType);
    }

    public String chatText(String systemPrompt, String userPrompt) {
        validateConfig();
        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "temperature", 0.2,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        String responseBody = restClientBuilder
                .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
                .build()
                .post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .headers(headers -> headers.setBearerAuth(properties.getApiKey()))
                .body(body)
                .retrieve()
                .body(String.class);

        return extractAssistantContent(responseBody);
    }

    private void validateConfig() {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "未配置 DEEPSEEK_API_KEY 环境变量");
        }
        if (properties.getBaseUrl() == null || properties.getBaseUrl().isBlank()) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "未配置 deepseek.base-url");
        }
        if (properties.getModel() == null || properties.getModel().isBlank()) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "未配置 deepseek.model");
        }
    }

    private String extractAssistantContent(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
                throw new AiResponseParseException("DeepSeek 响应缺少 choices[0].message.content", null);
            }
            return contentNode.asText();
        } catch (AiResponseParseException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AiResponseParseException("DeepSeek 响应解析失败", ex);
        }
    }

    private <T> T parseStrictJson(String content, Class<T> responseType) {
        try {
            return objectMapper.readValue(extractJsonObject(content), responseType);
        } catch (Exception ex) {
            throw new AiResponseParseException("AI 返回内容不是合法 JSON", ex);
        }
    }

    private String extractJsonObject(String content) {
        String normalized = content == null ? "" : content.trim();
        if (normalized.startsWith("```")) {
            normalized = normalized.replaceFirst("^```(?:json)?\\s*", "")
                    .replaceFirst("\\s*```$", "")
                    .trim();
        }
        int first = normalized.indexOf('{');
        int last = normalized.lastIndexOf('}');
        if (first < 0 || last <= first) {
            throw new AiResponseParseException("AI 返回内容不包含 JSON 对象", null);
        }
        return normalized.substring(first, last + 1);
    }

    private String trimTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
