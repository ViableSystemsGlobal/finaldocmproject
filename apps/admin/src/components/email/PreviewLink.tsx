'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

type PreviewLinkProps = {
  url: string | null;
};

export default function PreviewLink({ url }: PreviewLinkProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (url) {
      // Update the document title to make it noticeable
      const originalTitle = document.title;
      document.title = '📧 Email Preview Available';
      
      // Restore the original title when the component is unmounted
      return () => {
        document.title = originalTitle;
      };
    }
  }, [url]);

  if (!url || !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-green-100 border border-green-300 shadow-lg rounded-md max-w-sm z-50">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-green-800">Test Email Sent</h3>
          <p className="text-sm text-green-700 mb-2">
            Your test email has been sent successfully. View it using the link below:
          </p>
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline block mb-2"
          >
            View Email Preview
          </a>
          <p className="text-xs text-green-600 italic">
            This is a temporary preview link and will expire soon.
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-gray-500 h-5 w-5 flex items-center justify-center rounded-full"
        >
          <span className="sr-only">Close</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 