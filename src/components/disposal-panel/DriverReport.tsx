import { FileText, User, Clock, Image as ImageIcon } from "lucide-react";
import { DriverReport as DriverReportType } from "../../types";
import { formatDateTime } from "../../utils/dateUtils";

interface DriverReportProps {
  reports: DriverReportType[];
}

export const DriverReport = ({ reports }: DriverReportProps) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-purple-400" />
        司机上报说明
      </h3>

      {reports.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无司机上报记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-slate-700/30 rounded-lg border border-slate-700 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {report.imageUrl ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                    <img
                      src={report.imageUrl}
                      alt="司机上报图片"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center bg-slate-700">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm leading-relaxed mb-2">
                    {report.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="w-3 h-3" />
                      <span>{report.reporterName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(report.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
