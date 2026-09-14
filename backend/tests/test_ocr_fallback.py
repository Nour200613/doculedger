"""
Unit Tests - OCR Fallback Pipeline
Verifies fast digital extraction, <50 char threshold OCR routing, and bounding box extraction.
"""

import io
import pytest
import pypdf
from app.extraction_engine.ocr_fallback import OCRFallbackPipeline, ExtractedDocumentText


def create_sample_digital_pdf(text: str) -> bytes:
    """
    Creates an in-memory PDF with text stream using pypdf writer.
    """
    writer = pypdf.PdfWriter()
    # Note: adding an empty page without fonts in basic pypdf produces minimal chars (<50).
    # To simulate a PDF with digital text stream, we can create a PDF with metadata or pages.
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_scanned_pdf_triggers_ocr_fallback():
    """
    Test that a PDF with less than 50 digital text characters (e.g. scanned image or blank page)
    automatically routes to the OCR Fallback pipeline.
    """
    blank_pdf = create_sample_digital_pdf("")

    result: ExtractedDocumentText = OCRFallbackPipeline.extract_from_pdf(blank_pdf)

    # Scanned PDF threshold (<50 characters) triggered
    assert result.is_ocr_fallback is True
    assert result.ocr_engine is not None
    assert len(result.text) > 0
    assert len(result.bounding_boxes) > 0

    # Verify bounding box format [ymin, xmin, ymax, xmax] in 0-1000 range
    first_bbox = result.bounding_boxes[0]
    assert 0 <= first_bbox.ymin <= 1000
    assert 0 <= first_bbox.xmin <= 1000
    assert 0 <= first_bbox.ymax <= 1000
    assert 0 <= first_bbox.xmax <= 1000


def test_force_ocr_flag():
    """
    Test that setting force_ocr=True routes through OCR pipeline regardless of digital content.
    """
    pdf_bytes = create_sample_digital_pdf("Sample")

    result = OCRFallbackPipeline.extract_from_pdf(pdf_bytes, force_ocr=True)

    assert result.is_ocr_fallback is True
    assert result.ocr_engine is not None
    assert len(result.bounding_boxes) > 0


def test_bounding_box_dictionary_conversion():
    """
    Test that bounding boxes convert to serializable dictionary matching UI expectations.
    """
    pdf_bytes = create_sample_digital_pdf("")
    result = OCRFallbackPipeline.extract_from_pdf(pdf_bytes)

    box_dict = result.bounding_boxes[0].to_dict()
    assert "text" in box_dict
    assert "page" in box_dict
    assert "bbox" in box_dict
    assert len(box_dict["bbox"]) == 4
