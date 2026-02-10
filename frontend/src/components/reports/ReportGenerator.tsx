import { useState } from "react";
import { reportsApi, GenerateReportData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, FileText, FileSpreadsheet, FileSpreadsheetIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GenerateReportData>({
    module: "marketing",
    format: "pdf",
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
  });
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const result = await reportsApi.generateReport(formData);
      
      // Abrir link de download
      const downloadUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}${result.downloadUrl}`;
      window.open(downloadUrl, "_blank");
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso! O download começará em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "excel":
        return <FileSpreadsheet className="w-5 h-5" />;
      case "csv":
        return <FileSpreadsheetIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Gerar Relatório</h3>
        <p className="text-sm text-muted-foreground">Crie relatórios personalizados dos seus dados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Módulo</Label>
          <Select
            value={formData.module}
            onValueChange={(value: any) => setFormData((prev) => ({ ...prev, module: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
              <SelectItem value="social">Redes Sociais</SelectItem>
              <SelectItem value="processes">Processos</SelectItem>
              <SelectItem value="academy">Academia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Formato</Label>
          <Select
            value={formData.format}
            onValueChange={(value: any) => setFormData((prev) => ({ ...prev, format: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel (XLSX)</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Input
            type="date"
            value={formData.dateRange?.start || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                dateRange: { ...prev.dateRange!, start: e.target.value },
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Data Final</Label>
          <Input
            type="date"
            value={formData.dateRange?.end || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                dateRange: { ...prev.dateRange!, end: e.target.value },
              }))
            }
          />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? (
          "Gerando..."
        ) : (
          <>
            {getFormatIcon(formData.format)}
            <span className="ml-2">Gerar Relatório {formData.format.toUpperCase()}</span>
          </>
        )}
      </Button>
    </Card>
  );
}





