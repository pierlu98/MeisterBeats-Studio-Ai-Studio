import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onConnect: () => void;
  onLogout: () => void;
}

export default function Header({ user, onConnect, onLogout }: HeaderProps) {
  return (
    <header className="py-4 border-b border-white/10 flex items-center justify-between">
      <h1 className="text-xl font-semibold tracking-tight">
        Meister Beats Studio
      </h1>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            {user.avatarUrl && <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full" />}
            <span className="text-sm text-gray-300">{user.displayName}</span>
            <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white transition-colors underline">Logout</button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </header>
  );
}
