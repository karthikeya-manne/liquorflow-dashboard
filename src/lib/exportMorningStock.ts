import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function exportMorningStock(products: any[]) {

  const data = products.map((product, index) => {

    const sales = Math.max(
      0,
      Number(product.total) -
      Number(product.closingStock)
    );

    return {

      "S.No": index + 1,

      Brand: product.name,

      OB: product.openingStock,

      Receipts: product.receipts,

      Total: product.total,

      CB: product.closingStock,

      Sales: sales,

      Rate: product.price,

      Amount:
        sales *
        Number(product.price),

    };

  });

  const worksheet =
    XLSX.utils.json_to_sheet(data);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Morning Stock"
  );

  const excelBuffer =
    XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const today = new Date()
  .toISOString()
  .split("T")[0];

    const fileName = `Morning_Stock_${today}.xlsx`;

    if (Capacitor.isNativePlatform()) {
    
      // Convert ArrayBuffer to Base64
      const bytes = new Uint8Array(excelBuffer);
    
      let binary = "";
    
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
    
      const base64 = btoa(binary);
    
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
      });
    
      const uri = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Documents,
      });
    
      await Share.share({
        title: "Morning Stock Report",
        text: "Morning Stock Excel Report",
        url: uri.uri,
      });
    
    } else {
    
      const blob = new Blob([excelBuffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    
      saveAs(blob, fileName);
    
    }

}