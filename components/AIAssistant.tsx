
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getFinancialInsights } from '../services/geminiService';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AIAssistant: React.FC = () => {
  const { transactions } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
      { sender: 'ai', text: 'أهلاً بك! أنا مساعدك المالي الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك أن تسألني عن ملخص مصروفاتك، أو أكبر عملية شراء قمت بها، أو أي سؤال آخر حول بياناتك المالية.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;
    
    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getFinancialInsights(input, transactions);
      const aiMessage: Message = { sender: 'ai', text: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: 'عذرًا، حدث خطأ ما. يرجى المحاولة مرة أخرى.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <Bot size={24} />
              </div>
            )}
            <div className={`max-w-lg p-4 rounded-xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
             {msg.sender === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center">
                <User size={24} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-4">
                 <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Bot size={24} />
                </div>
                <div className="max-w-lg p-4 rounded-xl bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-500 dark:text-gray-400">
                        <Loader className="animate-spin" size={20}/>
                        <span>يفكر...</span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسأل شيئًا عن أموالك..."
            className="flex-1 bg-transparent p-4 border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-4 text-blue-600 dark:text-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
