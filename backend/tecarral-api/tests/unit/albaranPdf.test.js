import sharp from "sharp";
import { generateSignedAlbaranPdf } from "../../src/documents/albaranPdf.document.js";
import { normalizeSignatureImage } from "../../src/utils/signatureImage.js";

async function signatureBuffer() {
  return sharp({
    create: {
      width: 300,
      height: 100,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe("albarán firmado en PDF", () => {
  test("genera un PDF A4 con las dos firmas", async () => {
    const signature = await signatureBuffer();
    const pdf = await generateSignedAlbaranPdf({
      data: {
        id_albaran: 1,
        document_number: "ALB-26-00001",
        document_kind: "SERVICIO_TECNICO",
        cliente: "Cliente de prueba",
        email_cliente: "cliente@example.com",
        pricing_base_amount: 180,
        firmado_at: "2026-06-24T10:00:00.000Z",
        maquina: { marca: "STILL", modelo: "RX60", ns: "ABC123" },
      },
      customerSignature: signature,
      tecarralSignature: signature,
    });

    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5000);
  });

  test("normaliza una firma PNG válida", async () => {
    const signature = await signatureBuffer();
    const normalized = await normalizeSignatureImage(
      `data:image/png;base64,${signature.toString("base64")}`,
      "Firma"
    );
    const metadata = await sharp(normalized).metadata();

    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(300);
    expect(metadata.height).toBe(100);
  });

  test("rechaza contenido que no sea una firma PNG o JPEG", async () => {
    await expect(normalizeSignatureImage("not-base64", "Firma")).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
