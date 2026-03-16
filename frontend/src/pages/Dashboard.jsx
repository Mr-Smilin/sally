import React, { useState, useEffect } from "react";
import { transactionApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import TransactionModal from "../components/TransactionModal";

export default function Dashboard() {
	const { user } = useAuth();
	const { pref } = useTheme();
	const [summary, setSummary] = useState(null);
	const [recent, setRecent] = useState([]);
	const [assets, setAssets] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [month, setMonth] = useState(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
	});

	const load = async () => {
		const [year, m] = month.split("-");
		const start = new Date(year, m - 1, 1).toISOString();
		const end = new Date(year, m, 0, 23, 59, 59).toISOString();
		const [s, r] = await Promise.all([
			transactionApi.summary({
				startDate: start,
				endDate: end,
				userId: user.id,
			}),
			transactionApi.list({
				startDate: start,
				endDate: end,
				limit: 10,
				userId: user.id,
			}),
		]);
		setSummary(s);
		setRecent(r.transactions);
	};

	useEffect(() => {
		transactionApi.assets().then(setAssets);
	}, []);

	useEffect(() => {
		load();
	}, [month]);

	const fmt = (n) => Number(n).toLocaleString("zh-TW");

	const today = new Date().toLocaleDateString("zh-TW", {
		month: "long",
		day: "numeric",
		weekday: "short",
	});

	return (
		<div className="space-y-4">
			{/* Greeting card */}
			<div className="card px-4 py-3 flex items-center gap-3">
				<div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-blue-100 flex items-center justify-center">
					{pref?.avatarImage
						? <img src={pref.avatarImage} className="w-full h-full object-cover" />
						: <span className="text-blue-700 font-bold text-lg">{user?.username?.[0]?.toUpperCase()}</span>
					}
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-semibold truncate">
						{pref?.welcomeText || "你好"}，{user?.username} 👋
					</p>
					<p className="text-xs text-gray-400">{today}</p>
				</div>
			</div>

			{assets.length > 0 && (
				<div className="card p-4">
					<p className="text-xs text-gray-400 mb-3">持有資產</p>
					<div className="space-y-2">
						{assets.map((a, i) => (
							<div key={i} className="flex items-center justify-between">
								<span className="text-sm text-gray-600">
									{a.currency ? `${a.currency.code} · ${a.currency.name}` : '未指定幣別'}
								</span>
								<span className={`font-semibold ${a.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
									{a.currency?.symbol || ''} {fmt(a.balance)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex items-center justify-between">
				<input
					type="month"
					className="input w-auto text-sm"
					value={month}
					onChange={(e) => setMonth(e.target.value)}
				/>
			</div>

			{summary && (
				<div className="grid grid-cols-3 gap-3">
					<div className="card p-4">
						<p className="text-xs text-gray-400 mb-1">收入</p>
						<p className="text-lg font-bold text-green-600">
							+{fmt(summary.income)}
						</p>
					</div>
					<div className="card p-4">
						<p className="text-xs text-gray-400 mb-1">支出</p>
						<p className="text-lg font-bold text-red-500">
							-{fmt(summary.expense)}
						</p>
					</div>
					<div className="card p-4">
						<p className="text-xs text-gray-400 mb-1">結餘</p>
						<p
							className={`text-lg font-bold ${summary.balance >= 0 ? "text-blue-600" : "text-red-500"}`}
						>
							{fmt(summary.balance)}
						</p>
					</div>
				</div>
			)}

			<button
				onClick={() => setShowModal(true)}
				className="w-full py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 active:scale-98 transition-all shadow-lg shadow-blue-200"
			>
				＋ 新增記帳
			</button>

			{recent.length > 0 && (
				<div className="card">
					<div className="p-4 border-b border-gray-100">
						<h3 className="font-semibold">最近記帳</h3>
					</div>
					<div className="divide-y divide-gray-50">
						{recent.map((tx) => (
							<div key={tx.id} className="flex items-center gap-3 px-4 py-3">
								<span className="text-2xl">{tx.category?.icon}</span>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm">{tx.category?.name}</p>
									{tx.note && (
										<p className="text-xs text-gray-400 truncate">{tx.note}</p>
									)}
								</div>
								<div className="text-right">
									<p
										className={`font-semibold ${tx.type === "EXPENSE" ? "text-red-500" : "text-green-600"}`}
									>
										{tx.type === "EXPENSE" ? "-" : "+"}
										{tx.currency?.symbol || "NT$"} {fmt(tx.amount)}
									</p>
									<p className="text-xs text-gray-400">
										{new Date(tx.date).toLocaleDateString("zh-TW")}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{showModal && (
				<TransactionModal
					onClose={() => setShowModal(false)}
					onSaved={() => {
						setShowModal(false);
						load();
					}}
				/>
			)}
		</div>
	);
}
