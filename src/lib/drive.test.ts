import { describe, it, expect } from "vitest";
import { extractDriveFileId, toDrivePreviewUrl, isGoogleDriveUrl, buildProofView } from "./drive";

describe("google drive proof links (spec §23)", () => {
  it("extracts the file id from a /file/d/ link", () => {
    expect(extractDriveFileId("https://drive.google.com/file/d/ABC123_-x/view?usp=sharing")).toBe("ABC123_-x");
  });

  it("extracts the file id from an open?id= link", () => {
    expect(extractDriveFileId("https://drive.google.com/open?id=XYZ789")).toBe("XYZ789");
  });

  it("converts a view link into a preview link", () => {
    expect(toDrivePreviewUrl("https://drive.google.com/file/d/ABC123/view")).toBe(
      "https://drive.google.com/file/d/ABC123/preview",
    );
  });

  it("returns null preview for non-drive links", () => {
    expect(toDrivePreviewUrl("https://example.com/proof.png")).toBeNull();
  });

  it("recognises drive hosts", () => {
    expect(isGoogleDriveUrl("https://drive.google.com/file/d/ABC/view")).toBe(true);
    expect(isGoogleDriveUrl("https://example.com")).toBe(false);
  });

  it("builds a proof view with embed flag", () => {
    const view = buildProofView("https://drive.google.com/file/d/ABC/view");
    expect(view?.canEmbed).toBe(true);
    expect(view?.previewUrl).toContain("/preview");
    expect(buildProofView(null)).toBeNull();
  });
});
