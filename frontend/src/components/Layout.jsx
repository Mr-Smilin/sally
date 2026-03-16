import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navItems = [
	{ to: "/", label: "首頁", icon: "🏠", exact: true },
	{ to: "/transactions", label: "記帳", icon: "📝" },
	{ to: "/categories", label: "分類", icon: "🗂️" },
	{ to: "/reports", label: "報表", icon: "📊" },
];

export default function Layout() {
	const { user, logout, isAdmin } = useAuth();
	const { bgStyle, pref } = useTheme();
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<div className="min-h-screen flex flex-col" style={bgStyle}>
			{/* Top bar */}
			<header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
				<div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-xl font-bold text-blue-600">💰 sally</span>
						<a
							href="https://github.com/Mr-Smilin/sally"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-400 hover:text-gray-600 transition-colors"
							title="GitHub"
						>
							<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
							</svg>
						</a>
					</div>
					<div className="relative">
						<button
							onClick={() => setMenuOpen(!menuOpen)}
							className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
						>
							<div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center font-bold flex-shrink-0">
								{pref?.avatarImage
									? <img src={pref.avatarImage} className="w-full h-full object-cover" />
									: <span className="text-blue-700 text-sm">{user?.username?.[0]?.toUpperCase()}</span>
								}
							</div>
							<span className="hidden sm:block">{user?.username}</span>
							{user?.role === "ADMIN" && (
								<span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
									管理員
								</span>
							)}
						</button>
						{menuOpen && (
							<div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg w-44 py-1 z-50">
								{isAdmin && (
									<>
										<NavLink
											to="/users"
											onClick={() => setMenuOpen(false)}
											className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
										>
											👥 用戶管理
										</NavLink>
										<NavLink
											to="/currencies"
											onClick={() => setMenuOpen(false)}
											className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
										>
											💱 幣別管理
										</NavLink>
										<NavLink
											to="/monitor"
											onClick={() => setMenuOpen(false)}
											className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
										>
											🔍 操作監測
										</NavLink>
									</>
								)}
								<NavLink
									to="/profile"
									onClick={() => setMenuOpen(false)}
									className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
								>
									👤 個人資料
								</NavLink>
								<NavLink
									to="/appearance"
									onClick={() => setMenuOpen(false)}
									className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
								>
									🎨 外觀設定
								</NavLink>
								<button
									onClick={handleLogout}
									className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
								>
									🚪 登出
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
				<Outlet />
			</main>

			{/* Bottom nav */}
			<nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 z-40">
				<div className="max-w-2xl mx-auto flex">
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.exact}
							className={({ isActive }) =>
								`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${
									isActive ? "text-blue-600" : "text-gray-400"
								}`
							}
						>
							<span className="text-xl mb-0.5">{item.icon}</span>
							{item.label}
						</NavLink>
					))}
				</div>
			</nav>
		</div>
	);
}
