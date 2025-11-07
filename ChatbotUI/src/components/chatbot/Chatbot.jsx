import { useEffect, useMemo, useState } from 'react';
import { parseQuery } from '../../services/nlpService.js';
import {
  getTopUniversities,
  compareUniversities,
  loadProgramDetails
} from '../../services/chatbotService.js';
import { generateId } from '../../utils/id.js';

const defaultPrompts = [
  'Make my education plan',
  'Universities',
  'What programs are available at University of New Mexico (UNM)?'
];

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [suggestions, setSuggestions] = useState(defaultPrompts);
  const [loading, setLoading] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [comparison, setComparison] = useState({ a: '', b: '' });

  useEffect(() => {
    loadProgramDetails()
      .then((programs) => {
        const menu = programs
          .map((program) => program.name)
          .filter(Boolean)
          .slice(0, 6);
        setSuggestions([...defaultPrompts, ...menu]);
      })
      .catch(() => setSuggestions(defaultPrompts));
  }, []);

  const dropdownOptions = useMemo(
    () =>
      universities.map((uni) => ({
        value: uni.name || uni.university_name,
        label: uni.name || uni.university_name
      })),
    [universities]
  );

  const pushMessage = (sender, text) =>
    setMessages((prev) => [...prev, { id: generateId(), sender, text }]);

  const handleQuery = async (prompt) => {
    const query = prompt ?? userInput;
    if (!query.trim()) return;

    pushMessage('user', query);
    setUserInput('');
    setLoading(true);

    try {
      const criteria = parseQuery(query);
      if (criteria.intent === 'compare') {
        setComparisonMode(true);
        pushMessage('bot', 'Select two universities to compare.');
        const options = await getTopUniversities({ grade: 100 });
        setUniversities(options);
        return;
      }

      const matches = await getTopUniversities(criteria);
      if (matches.length === 0) {
        pushMessage('bot', 'No universities found. Try refining your query.');
        return;
      }

      const response = matches
        .map((uni, index) => {
          const gradRate = uni.graduation_rate
            ? `${Math.round(uni.graduation_rate * 100)}% grad rate`
            : 'Grad rate N/A';
          const cost = uni.average_annual_cost
            ? `$${Number(uni.average_annual_cost).toLocaleString()} avg cost`
            : 'Cost N/A';
          return `${index + 1}. ${uni.name} — ${gradRate} · ${cost}`;
        })
        .join('\n');
      pushMessage('bot', response);
    } catch (error) {
      console.error(error);
      pushMessage('bot', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleComparison = async () => {
    if (!comparison.a || !comparison.b) {
      pushMessage('bot', 'Please select two universities to compare.');
      return;
    }

    try {
      const summary = await compareUniversities(comparison.a, comparison.b);
      summary.forEach((line, index) =>
        pushMessage(index === 0 ? 'user' : 'bot', index === 0 ? `Compare ${line}` : line)
      );
    } catch (error) {
      pushMessage('bot', error.message);
    } finally {
      setComparisonMode(false);
      setComparison({ a: '', b: '' });
    }
  };

  return (
    <section className="w-full h-full flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">EduPlan Assistant</h2>
        <p className="text-slate-600">
          Ask about programs, compare universities, or request help scheduling courses.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <input
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleQuery()}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ask something like “Compare MIT with Stanford”"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => handleQuery()}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-sm text-slate-500">
                Start by selecting a suggestion or typing your own question.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.sender === 'user'
                    ? 'ml-auto bg-slate-900 text-white px-4 py-3 rounded-lg max-w-xl'
                    : 'mr-auto bg-slate-100 text-slate-800 px-4 py-3 rounded-lg max-w-xl whitespace-pre-line'
                }
              >
                {message.text}
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Quick suggestions
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
                  onClick={() => handleQuery(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {comparisonMode && (
            <div className="bg-white rounded-xl border border-indigo-200 shadow-md p-4 space-y-3">
              <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                Compare universities
              </h3>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                value={comparison.a}
                onChange={(event) => setComparison((prev) => ({ ...prev, a: event.target.value }))}
              >
                <option value="">Select first university</option>
                {dropdownOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                value={comparison.b}
                onChange={(event) => setComparison((prev) => ({ ...prev, b: event.target.value }))}
              >
                <option value="">Select second university</option>
                {dropdownOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleComparison}
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
              >
                Compare
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default Chatbot;
