import { useState } from 'react';
import { generateId } from '../../utils/id.js';

const SupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');

  const toggleChat = () => setIsOpen((prev) => !prev);

  const sendMessage = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: generateId(), user: 'You', text: draft.trim() },
      {
        id: generateId(),
        user: 'Support',
        text: 'We will get back to you soon!'
      }
    ]);
    setDraft('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <button
        type="button"
        onClick={toggleChat}
        className="w-full text-left px-4 py-3 font-semibold text-slate-800 border-b border-slate-100"
      >
        Support Chat
      </button>
      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="text-sm">
                <span className="font-medium text-slate-700">{message.user}:</span>{' '}
                <span className="text-slate-600">{message.text}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-slate-500">
                Ask a question and our support team will get back to you shortly.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200"
              placeholder="Type a message…"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChat;
