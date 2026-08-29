package com.Project1.project.controller;

import com.Project1.project.service.SitRepService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/sitrep")
@CrossOrigin(origins = "*")
public class SitRepController {

    private final SitRepService sitRepService;

    public SitRepController(SitRepService sitRepService) {
        this.sitRepService = sitRepService;
    }

    @GetMapping("/download-pdf")
    public ResponseEntity<byte[]> downloadDailySitRepPdf() {
        byte[] pdfBytes = sitRepService.generateDailySitRepPdf();
        String filename = "AURA_NER_Daily_SitRep_" + LocalDate.now() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
