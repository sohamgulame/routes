package com.Project1.project.controller;

import com.Project1.project.service.EwayBillPdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ewaybills")
@CrossOrigin(origins = "*")
public class EwayBillController {

    private final EwayBillPdfService ewayBillPdfService;

    public EwayBillController(EwayBillPdfService ewayBillPdfService) {
        this.ewayBillPdfService = ewayBillPdfService;
    }

    @GetMapping(value = "/{convoyId}/download", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadEwayBill(@PathVariable String convoyId) {
        byte[] pdfBytes = ewayBillPdfService.generateEwayBillPdf(convoyId);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ewaybill_" + convoyId + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
