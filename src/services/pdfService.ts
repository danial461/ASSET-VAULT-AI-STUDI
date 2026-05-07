import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Asset } from "../types";
import { formatCurrency } from "../lib/utils";

export async function generateInsuranceReport(assets: Asset[], userName: string) {
  const doc = new jsPDF() as any;
  const totalValue = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0);

  // Title
  doc.setFontSize(22);
  doc.text("AssetVault AI: Insurance Report", 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated for: ${userName}`, 20, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);
  doc.text(`Total Estate Value: ${formatCurrency(totalValue)}`, 20, 42);
  doc.text(`Total Items: ${assets.length}`, 20, 48);

  const tableData = assets.map(asset => [
    asset.name,
    asset.category,
    asset.estimatedBrand || "-",
    asset.serialNumber || "-",
    formatCurrency(asset.purchasePrice || 0),
    asset.purchaseDate || "-"
  ]);

  doc.autoTable({
    startY: 60,
    head: [['Item Name', 'Category', 'Brand', 'Serial #', 'Value', 'Purchase Date']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillStyle: '#1f2937' },
  });

  doc.save(`AssetVault_Insurance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
