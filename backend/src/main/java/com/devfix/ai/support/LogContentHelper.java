package com.devfix.ai.support;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class LogContentHelper {
    private static final int MAX_PROMPT_LOG_LENGTH = 12000;
    private static final int EDGE_LENGTH = 6000;
    private static final Pattern SECRET_VALUE_PATTERN = Pattern.compile("(?i)(password|token|secret)\\s*=\\s*([^\\s&]+)");
    private static final Pattern AUTHORIZATION_PATTERN = Pattern.compile("(?i)(Authorization\\s*[:=]\\s*)([^\\r\\n]+)");

    public String maskSensitiveData(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String masked = SECRET_VALUE_PATTERN.matcher(content).replaceAll("$1=******");
        return AUTHORIZATION_PATTERN.matcher(masked).replaceAll("$1******");
    }

    public String buildPromptLog(String content) {
        if (content == null) {
            return "";
        }
        if (content.length() <= MAX_PROMPT_LOG_LENGTH) {
            return content;
        }
        String head = content.substring(0, EDGE_LENGTH);
        String tail = content.substring(content.length() - EDGE_LENGTH);
        return head + "\n\n... 日志过长，中间内容已截断 ...\n\n" + tail;
    }
}
