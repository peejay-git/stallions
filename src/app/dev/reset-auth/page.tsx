'use client';

import { useState } from 'react';

export default function ResetAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/reset-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-xl max-w-md w-full">
        <div className="bg-red-900/20 border border-red-700/30 p-4 rounded-lg mb-6">
          <h2 className="text-red-300 font-medium mb-2">Development Tool - Remove After Use</h2>
          <p className="text-gray-300 text-sm">
            This page is for solving the "email already in use" issue when Firebase Authentication
            and Firestore are out of sync. It should be removed after resolving the issue.
          </p>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Reset Firebase Auth</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Email with Issue</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              required
              placeholder="Enter email that's causing problems"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Password (if known)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white"
              placeholder="Optional - password for the account"
            />
            <p className="text-xs text-gray-400 mt-1">
              Providing the password increases chances of successful deletion
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || !email}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isProcessing || !email
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Reset Auth for Email'}
          </button>
        </form>
        
        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success 
              ? 'bg-green-900/20 border border-green-700/30' 
              : 'bg-yellow-900/20 border border-yellow-700/30'
          }`}>
            <h3 className={`font-medium mb-2 ${
              result.success ? 'text-green-300' : 'text-yellow-300'
            }`}>
              {result.success ? 'Success' : 'Action Required'}
            </h3>
            <p className="text-gray-300 text-sm">{result.message}</p>
            {result.action && (
              <p className="text-gray-300 text-sm mt-2">{result.action}</p>
            )}
            {result.code && (
              <p className="text-gray-400 text-xs mt-2">Error code: {result.code}</p>
            )}
          </div>
        )}
        
        <div className="mt-6 border-t border-white/10 pt-4">
          <h3 className="text-white font-medium mb-2">Manual Steps (If Automated Reset Fails)</h3>
          <ol className="text-gray-300 text-sm list-decimal list-inside space-y-1">
            <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Firebase Console</a></li>
            <li>Select your project</li>
            <li>Go to Authentication → Users</li>
            <li>Find the problematic email address</li>
            <li>Delete the user record</li>
            <li>Go to Firestore → Data</li>
            <li>Find and delete any documents related to this user</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 