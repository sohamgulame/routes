package com.Project1.project.service;

import com.Project1.project.entity.Convoy;
import com.Project1.project.entity.District;
import com.Project1.project.entity.RoadSegment;
import com.Project1.project.repository.ConvoyRepository;
import com.Project1.project.repository.DistrictRepository;
import com.Project1.project.repository.RoadSegmentRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class SitRepService {

    private final DistrictRepository districtRepository;
    private final RoadSegmentRepository roadSegmentRepository;
    private final ConvoyRepository convoyRepository;

    public SitRepService(
            DistrictRepository districtRepository,
            RoadSegmentRepository roadSegmentRepository,
            ConvoyRepository convoyRepository
    ) {
        this.districtRepository = districtRepository;
        this.roadSegmentRepository = roadSegmentRepository;
        this.convoyRepository = convoyRepository;
    }

    public byte[] generateDailySitRepPdf() {
        List<District> districts = districtRepository.findAll();
        List<RoadSegment> segments = roadSegmentRepository.findAll();
        List<Convoy> activeConvoys = convoyRepository.findActiveConvoys();

        long isolatedCount = districts.stream().filter(d -> "ISOLATED".equalsIgnoreCase(d.getConnectivityStatus()) || "RESTRICTED".equalsIgnoreCase(d.getConnectivityStatus())).count();
        long blockedRoadCount = segments.stream().filter(s -> "BLOCKED".equalsIgnoreCase(s.getCurrentStatus()) || "CAUTION".equalsIgnoreCase(s.getCurrentStatus())).count();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            Color primaryDark = new Color(11, 25, 44);
            Color accentRed = new Color(190, 18, 60);
            Color headerBg = new Color(241, 245, 249);

            // Fonts
            Font mainHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, primaryDark);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, accentRed);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, primaryDark);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
            Font tableBodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY);

            // Header Banner
            Paragraph mainHeader = new Paragraph("MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION (MDoNER)\nNATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA)", mainHeaderFont);
            mainHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(mainHeader);

            Paragraph subTitle = new Paragraph("AURA-NER DAILY SITUATION REPORT (SitRep)\nLogistics & Road Accessibility Assessment", subHeaderFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subTitle);

            Paragraph meta = new Paragraph("Report ID: SITREP-NER-" + System.currentTimeMillis() % 100000 + " | Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")) + " IST\n\n", metaFont);
            meta.setAlignment(Element.ALIGN_CENTER);
            document.add(meta);

            // Executive Summary Matrix (4 Boxes)
            PdfPTable summaryTable = new PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(12);

            addStatBox(summaryTable, "MONITORED DISTRICTS", String.valueOf(districts.size()), new Color(230, 245, 255), primaryDark);
            addStatBox(summaryTable, "ISOLATED / RESTRICTED", String.valueOf(isolatedCount), new Color(254, 226, 226), accentRed);
            addStatBox(summaryTable, "HIGH-RISK CORRIDORS", String.valueOf(blockedRoadCount), new Color(254, 243, 199), new Color(180, 83, 9));
            addStatBox(summaryTable, "ACTIVE CONVOYS", String.valueOf(activeConvoys.size()), new Color(209, 250, 229), new Color(4, 120, 87));

            document.add(summaryTable);

            // Section 1: District Accessibility & Isolation Matrix
            Paragraph sec1 = new Paragraph("1. DISTRICT CONNECTIVITY & ISOLATION MATRIX", sectionTitleFont);
            sec1.setSpacingBefore(6);
            sec1.setSpacingAfter(4);
            document.add(sec1);

            PdfPTable distTable = new PdfPTable(new float[]{3.5f, 2.5f, 2.0f, 2.0f});
            distTable.setWidthPercentage(100);
            distTable.setSpacingAfter(12);

            addTableHeaderCell(distTable, "District Headquarters", primaryDark, tableHeaderFont);
            addTableHeaderCell(distTable, "State", primaryDark, tableHeaderFont);
            addTableHeaderCell(distTable, "Accessibility Status", primaryDark, tableHeaderFont);
            addTableHeaderCell(distTable, "Vulnerability Index", primaryDark, tableHeaderFont);

            for (District d : districts) {
                distTable.addCell(createCell(d.getName(), tableBodyFont, Element.ALIGN_LEFT));
                distTable.addCell(createCell(d.getState(), tableBodyFont, Element.ALIGN_LEFT));
                
                String status = d.getConnectivityStatus() != null ? d.getConnectivityStatus() : "NORMAL";
                distTable.addCell(createCell(status, tableBodyFont, Element.ALIGN_CENTER));
                
                String score = d.getCriticalityScore() != null ? String.format("%.0f%%", d.getCriticalityScore() * 100) : "15%";
                distTable.addCell(createCell(score, tableBodyFont, Element.ALIGN_CENTER));
            }
            document.add(distTable);

            // Section 2: Critical Highway Corridors & Weather Hazard Risk
            Paragraph sec2 = new Paragraph("2. HIGHWAY CORRIDOR HAZARDS & BYPASS DIRECTIVES", sectionTitleFont);
            sec2.setSpacingBefore(4);
            sec2.setSpacingAfter(4);
            document.add(sec2);

            PdfPTable roadTable = new PdfPTable(new float[]{1.8f, 3.2f, 1.8f, 1.8f, 3.4f});
            roadTable.setWidthPercentage(100);
            roadTable.setSpacingAfter(12);

            addTableHeaderCell(roadTable, "Highway", primaryDark, tableHeaderFont);
            addTableHeaderCell(roadTable, "Corridor Sector", primaryDark, tableHeaderFont);
            addTableHeaderCell(roadTable, "Road Status", primaryDark, tableHeaderFont);
            addTableHeaderCell(roadTable, "AI Risk Index", primaryDark, tableHeaderFont);
            addTableHeaderCell(roadTable, "Current Situation / Bypass", primaryDark, tableHeaderFont);

            for (RoadSegment s : segments) {
                roadTable.addCell(createCell(s.getHighwayCode(), tableBodyFont, Element.ALIGN_CENTER));
                roadTable.addCell(createCell(s.getSegmentName(), tableBodyFont, Element.ALIGN_LEFT));
                roadTable.addCell(createCell(s.getCurrentStatus(), tableBodyFont, Element.ALIGN_CENTER));
                roadTable.addCell(createCell(String.format("%.0f%%", (s.getCurrentRiskScore() != null ? s.getCurrentRiskScore() : 0.2) * 100), tableBodyFont, Element.ALIGN_CENTER));
                roadTable.addCell(createCell(s.getDisruptionReason() != null ? s.getDisruptionReason() : "Nominal transit conditions", tableBodyFont, Element.ALIGN_LEFT));
            }
            document.add(roadTable);

            // Section 3: Essential Supply Movements
            Paragraph sec3 = new Paragraph("3. CRITICAL LIFELINE FLEET TELEMETRY & COLD-CHAIN", sectionTitleFont);
            sec3.setSpacingBefore(4);
            sec3.setSpacingAfter(4);
            document.add(sec3);

            if (activeConvoys.isEmpty()) {
                Paragraph noConvoy = new Paragraph("No active emergency supply convoys currently in transit. Fleet on standby at supply depots.\n", metaFont);
                document.add(noConvoy);
            } else {
                PdfPTable convoyTable = new PdfPTable(new float[]{2.5f, 2.5f, 2.5f, 2.5f});
                convoyTable.setWidthPercentage(100);
                convoyTable.setSpacingAfter(12);

                addTableHeaderCell(convoyTable, "Vehicle No.", primaryDark, tableHeaderFont);
                addTableHeaderCell(convoyTable, "Cargo Category", primaryDark, tableHeaderFont);
                addTableHeaderCell(convoyTable, "Corridor Route", primaryDark, tableHeaderFont);
                addTableHeaderCell(convoyTable, "Cold-Chain Temp", primaryDark, tableHeaderFont);

                for (Convoy c : activeConvoys) {
                    convoyTable.addCell(createCell(c.getVehicleNumber(), tableBodyFont, Element.ALIGN_CENTER));
                    convoyTable.addCell(createCell(c.getCommodityType(), tableBodyFont, Element.ALIGN_LEFT));
                    convoyTable.addCell(createCell(c.getOriginCity() + " -> " + c.getDestinationCity(), tableBodyFont, Element.ALIGN_LEFT));
                    convoyTable.addCell(createCell(c.getTemperatureCelsius() + " °C", tableBodyFont, Element.ALIGN_CENTER));
                }
                document.add(convoyTable);
            }

            // Official Stamp & Verification
            Paragraph footer = new Paragraph("\nAUTHORITY & CERTIFICATION:\nThis official SitRep is automatically compiled from live Open-Meteo satellite meteorological telemetry, PostGIS spatial network graphs, and field engineer verified incident inputs under the authority of the Nodal Disaster Logistics Command.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7, Color.GRAY));
            footer.setAlignment(Element.ALIGN_JUSTIFIED);
            document.add(footer);

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating SitRep PDF: " + e.getMessage(), e);
        }

        return out.toByteArray();
    }

    private void addStatBox(PdfPTable table, String label, String value, Color bg, Color textCol) {
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, textCol);
        Font lblFont = FontFactory.getFont(FontFactory.HELVETICA, 7, textCol);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pVal = new Paragraph(value, valFont);
        pVal.setAlignment(Element.ALIGN_CENTER);
        Paragraph pLbl = new Paragraph(label, lblFont);
        pLbl.setAlignment(Element.ALIGN_CENTER);

        cell.addElement(pVal);
        cell.addElement(pLbl);
        table.addCell(cell);
    }

    private void addTableHeaderCell(PdfPTable table, String text, Color bg, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(5);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private PdfPCell createCell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setPadding(4);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }
}
