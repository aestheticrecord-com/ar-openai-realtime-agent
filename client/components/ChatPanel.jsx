import { useState } from 'react';
import Button from './Button';
import { MessageSquare, Paperclip } from 'react-feather';

const ChatPanel = ({ onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState([]);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() && files.length === 0) return;
    
    onSendMessage({
      text: inputText,
      files: Array.from(files)
    });
    
    setInputText('');
    setFiles([]);
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  return (
    <section aria-label="Chat interface" className="border-t p-4">
      <form onSubmit={handleTextSubmit} className="flex gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              aria-label="Message input"
              className="flex-1 p-2 border rounded-lg"
            />
            <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg">
              <Paperclip size={18} aria-hidden="true" />
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                aria-label="Attach files"
              />
            </label>
          </div>
          {files.length > 0 && (
            <div className="text-sm text-gray-600">
              Attached: {Array.from(files).map(f => f.name).join(', ')}
            </div>
          )}
        </div>
        <Button
          type="submit"
          icon={<MessageSquare size={16} />}
          className="bg-blue-600 hover:bg-blue-700"
          aria-label="Send message"
        >
          Send
        </Button>
      </form>
    </section>
  );
};

export default ChatPanel; 