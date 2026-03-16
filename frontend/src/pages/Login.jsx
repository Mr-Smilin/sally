import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api";

export default function Login() {
	const [mode, setMode] = useState("login");
	const [form, setForm] = useState({
		username: "",
		email: "",
		password: "",
		login: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [allowRegistration, setAllowRegistration] = useState(null);
	const { login } = useAuth();
	const { addToast } = useToast();
	const navigate = useNavigate();

	useEffect(() => {
		authApi
			.config()
			.then((cfg) => {
				setAllowRegistration(cfg.allowRegistration);
				if (!cfg.allowRegistration) setMode("login");
			})
			.catch(() => {});
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			let res;
			if (mode === "login") {
				res = await authApi.login({
					login: form.login,
					password: form.password,
				});
			} else {
				res = await authApi.register({
					username: form.username,
					email: form.email,
					password: form.password,
				});
			}
			login(res.token, res.user);
			addToast(
				mode === "login"
					? `歡迎回來，${res.user.username}！`
					: "帳號建立成功！",
				"success",
			);
			navigate("/");
		} catch (err) {
			const msg = err.error || "操作失敗";
			const attemptsLeft = err.attemptsLeft;
			const displayMsg =
				attemptsLeft != null ? `${msg}，還有 ${attemptsLeft} 次嘗試機會` : msg;
			setError(displayMsg);
			addToast(displayMsg, "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<div className="text-6xl mb-3">💰</div>
					<h1 className="text-2xl font-bold text-gray-900">sally</h1>
					<p className="text-gray-500 mt-1">輕鬆管理你的財務</p>
				</div>

				<div className="card p-6">
					{allowRegistration === true && (
						<div className="flex bg-gray-100 rounded-xl p-1 mb-6">
							<button
								className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
								onClick={() => {
									setMode("login");
									setError("");
								}}
							>
								登入
							</button>
							<button
								className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "register" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
								onClick={() => {
									setMode("register");
									setError("");
								}}
							>
								註冊
							</button>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{mode === "register" ? (
							<>
								<input
									className="input"
									placeholder="用戶名"
									required
									value={form.username}
									onChange={(e) =>
										setForm((f) => ({ ...f, username: e.target.value }))
									}
								/>
								<input
									className="input"
									placeholder="電子郵件"
									type="email"
									required
									value={form.email}
									onChange={(e) =>
										setForm((f) => ({ ...f, email: e.target.value }))
									}
								/>
							</>
						) : (
							<input
								className="input"
								placeholder="用戶名或電子郵件"
								required
								value={form.login}
								onChange={(e) =>
									setForm((f) => ({ ...f, login: e.target.value }))
								}
							/>
						)}
						<input
							className="input"
							placeholder="密碼"
							type="password"
							required
							minLength={6}
							value={form.password}
							onChange={(e) =>
								setForm((f) => ({ ...f, password: e.target.value }))
							}
						/>

						{error && (
							<div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
								<span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
								<p className="text-red-600 text-sm">{error}</p>
							</div>
						)}

						<button
							type="submit"
							className="btn-primary w-full py-3 text-base"
							disabled={loading}
						>
							{loading ? "處理中..." : mode === "login" ? "登入" : "建立帳號"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
