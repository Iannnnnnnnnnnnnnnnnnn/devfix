package com.devfix.ai.controller;

import com.devfix.ai.dto.AnalyzeRequest;
import com.devfix.ai.dto.DiagnosisDetailResponse;
import com.devfix.ai.dto.DiagnosisResponse;
import com.devfix.ai.dto.DiagnosisStatsResponse;
import com.devfix.ai.dto.HistoryRecordResponse;
import com.devfix.ai.service.DiagnosisService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/diagnosis")
public class DiagnosisController {
    private final DiagnosisService diagnosisService;

    public DiagnosisController(DiagnosisService diagnosisService) {
        this.diagnosisService = diagnosisService;
    }

    @PostMapping("/analyze")
    public DiagnosisResponse analyze(@Valid @RequestBody AnalyzeRequest request) {
        return diagnosisService.analyze(request);
    }

    @GetMapping("/history")
    public List<HistoryRecordResponse> history() {
        return diagnosisService.history();
    }

    @GetMapping("/stats")
    public DiagnosisStatsResponse stats() {
        return diagnosisService.stats();
    }

    @GetMapping("/{id}")
    public DiagnosisDetailResponse detail(@PathVariable Long id) {
        return diagnosisService.detail(id);
    }
}
