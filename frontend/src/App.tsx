/**
 * App Component - Main Application Container
 * ============================================================================
 * This is the root component for the FinSight financial literacy coach.
 * It provides the layout structure and manages the overall application state.
 * ============================================================================
 */
import { useState } from 'react';
import Chat from './components/Chat';
import ProfileModal from './components/ProfileModal';


function App() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      {/* Watermark background */}
      <div className="pointer-events-none select-none fixed inset-0 flex items-center justify-center z-0">
        <span
          style={{
            fontSize: '7vw',
            opacity: 0.06,
            fontWeight: 900,
            letterSpacing: '0.2em',
            userSelect: 'none',
            textShadow: '0 2px 16px #fff',
          }}
          className="text-cf-orange whitespace-nowrap"
        >
          Aayush Modi
        </span>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-cf-orange to-cf-orange-dark rounded-2xl flex items-center justify-center shadow-xl">
              <svg
                className="w-7 h-7 text-white drop-shadow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-cf-orange drop-shadow">FinSight</h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide">Financial Literacy Coach</p>
            </div>
          </div>

          {/* Profile Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-cf-orange to-cf-orange-dark text-white font-semibold rounded-xl shadow hover:scale-105 hover:from-cf-orange-dark hover:to-cf-orange transition-all duration-150"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm font-medium">Profile</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <Chat />
      </main>

      {/* Footer with watermark */}
      <footer className="relative z-10 fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur border-t border-gray-200 py-2">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs text-gray-500">
          <span>Powered by <span className="text-cf-orange font-semibold">Cloudflare Workers AI</span> • Llama 3.3 70B</span>
          <span className="font-bold text-cf-orange/80 tracking-widest">Aayush Modi</span>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

export default App;
