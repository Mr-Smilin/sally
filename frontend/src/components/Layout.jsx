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
					<span className="text-xl font-bold text-blue-600">💰 sally</span>
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
