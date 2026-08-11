// ══════════════════════════════════════════
// pages/QueryPage.jsx — Full RAG query page
// ══════════════════════════════════════════
import QueryBox from '../components/QueryBox'

const SAMPLE_QUESTIONS = [
  'Which zone had the most violations this week?',
  'Summarize all helmet violations from yesterday',
  'How many NO-Mask violations were recorded today?',
  'What is the compliance rate for Zone B?',
]

export default function QueryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">AI Safety Query</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ask natural language questions about safety incidents and violations
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <QueryBox />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">
            Sample Questions
          </h3>
          <div className="space-y-2">
            {SAMPLE_QUESTIONS.map((q, i) => (
              <div
                key={i}
                className="text-xs bg-gray-50 rounded-lg p-3 text-gray-600 cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition border border-gray-100"
              >
                {q}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
              RAG Engine Status
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span className="text-xs text-gray-500">
                Placeholder — connects in Stage 4
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}