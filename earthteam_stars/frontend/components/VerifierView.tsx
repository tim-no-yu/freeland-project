export default function VerifierView({ report }: { report: any }) {
  return (
    <div className="p-6 border rounded-xl bg-slate-50">
      <h3 className="text-lg font-bold uppercase">{report.userName} — {report.tier}</h3>
      
      {/* Logic: Only show the section if the user provided info */}
      {report.problemStatement && (
        <div className="mt-4 p-4 bg-white border rounded shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-1 uppercase">Action Evidence (Silver)</p>
          <p className="text-sm">{report.problemStatement}</p>
        </div>
      )}

      {report.impactMetrics && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded shadow-sm">
          <p className="text-xs font-bold text-yellow-600 mb-1 uppercase">Impact Outcomes (Gold)</p>
          <p className="text-sm">{report.impactMetrics}</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button className="flex-1 py-2 bg-green-700 text-white rounded font-bold">Approve</button>
        <button className="flex-1 py-2 bg-red-700 text-white rounded font-bold">Reject</button>
      </div>
    </div>
  );
}