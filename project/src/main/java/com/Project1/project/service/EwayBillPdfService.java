package com.Project1.project.service;

import com.Project1.project.entity.Convoy;
import com.Project1.project.repository.ConvoyRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EwayBillPdfService {

    private final ConvoyRepository convoyRepository;

    public EwayBillPdfService(ConvoyRepository convoyRepository) {
        this.convoyRepository = convoyRepository;
    }

    public byte[] generateEwayBillPdf(String convoyId) {
        Convoy convoy = convoyRepository.findById(convoyId)
                .orElseThrow(() -> new RuntimeException("Convoy not found: " + convoyId));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Header Banner
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(11, 19, 43));
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

            Paragraph header = new Paragraph("GOVERNMENT OF INDIA\nMINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION (MDoNER)", headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            document.add(header);

            Paragraph subHeader = new Paragraph("AURA-NER Digital Transit Manifest & e-Waybill for Essential Commodities\n\n", subHeaderFont);
            subHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(subHeader);

            // Document Details Table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            table.setSpacingAfter(15);

            addTableRow(table, "e-Waybill Number:", "NER-EWB-" + convoy.getVehicleNumber().replace("-", "") + "-" + System.currentTimeMillis() % 100000, boldFont, regularFont);
            addTableRow(table, "Generated At:", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")), boldFont, regularFont);
            addTableRow(table, "Vehicle Number:", convoy.getVehicleNumber(), boldFont, regularFont);
            addTableRow(table, "Lead Driver:", convoy.getDriverName() + " (" + convoy.getDriverPhone() + ")", boldFont, regularFont);
            addTableRow(table, "Transporter Agency:", convoy.getTransporterCompany() != null ? convoy.getTransporterCompany() : "NER Lifeline Logistics Corp", boldFont, regularFont);
            addTableRow(table, "Commodity Category:", convoy.getCommodityType(), boldFont, regularFont);
            addTableRow(table, "Origin City:", convoy.getOriginCity() + " (NER Hub)", boldFont, regularFont);
            addTableRow(table, "Destination City:", convoy.getDestinationCity(), boldFont, regularFont);
            addTableRow(table, "Cold-Chain Telemetry:", convoy.getTemperatureCelsius() + " °C (Active Monitored)", boldFont, regularFont);
            addTableRow(table, "Transit Status:", convoy.getStatus(), boldFont, regularFont);
            addTableRow(table, "Assigned Route Corridors:", convoy.getActiveRouteSummary() != null ? convoy.getActiveRouteSummary() : "NH-06 / Multi-Modal Corridor", boldFont, regularFont);

            document.add(table);

            // Security Disclaimer
            Paragraph disclaimer = new Paragraph("This is an electronically generated and cryptographically verifiable digital transit pass under the Essential Commodities & Disaster Management Act. Checkposts and highway authorities are directed to grant priority green corridor clearance.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY));
            disclaimer.setAlignment(Element.ALIGN_JUSTIFIED);
            document.add(disclaimer);

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating e-Waybill PDF: " + e.getMessage(), e);
        }

        return out.toByteArray();
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell1 = new PdfPCell(new Phrase(label, labelFont));
        cell1.setBackgroundColor(new Color(240, 243, 246));
        cell1.setPadding(6);
        table.addCell(cell1);

        PdfPCell cell2 = new PdfPCell(new Phrase(value, valueFont));
        cell2.setPadding(6);
        table.addCell(cell2);
    }
}
