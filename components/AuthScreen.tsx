import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { ArrowRight, Lock, User as UserIcon, Loader2, Mail, KeyRound, Timer } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [username, setUsername] = useState(''); // Used for Login & Register
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Timer state for verification code
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
    setUsername('');
    setPassword('');
    setEmail('');
    setCode('');
    setCountdown(0);
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSendCode = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('邮箱格式不正确');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.sendVerificationCode(email);
      setSuccessMsg('验证码已发送 (请查看浏览器控制台 Console)');
      setCountdown(60);
    } catch (err: any) {
      setError('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        // Use username as generic identifier (username OR email)
        const user = await api.login(username, password);
        localStorage.setItem('stockflow_session', JSON.stringify({ username: user.username }));
        onLogin(user);
      } else if (mode === 'REGISTER') {
        const user = await api.register(username, password, email, code);
        localStorage.setItem('stockflow_session', JSON.stringify({ username: user.username }));
        onLogin(user);
      } else if (mode === 'FORGOT_PASSWORD') {
        await api.resetPassword(email, code, password);
        setSuccessMsg('密码重置成功，请登录');
        setTimeout(() => handleModeSwitch('LOGIN'), 1500);
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
        <div className="p-8 bg-slate-900 text-white text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
              <span className="text-2xl font-bold">S</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">StockFlow</h1>
            <p className="text-slate-400 text-sm mt-2">智能云端库存管理系统</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8 bg-slate-50 p-1 rounded-lg">
            <button
              onClick={() => handleModeSwitch('LOGIN')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => handleModeSwitch('REGISTER')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              注册
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">
            {mode === 'LOGIN' && '欢迎回来'}
            {mode === 'REGISTER' && '创建新账号'}
            {mode === 'FORGOT_PASSWORD' && '重置密码'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Login & Register Username Field */}
            {mode !== 'FORGOT_PASSWORD' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">
                  {mode === 'LOGIN' ? '用户名 或 邮箱' : '设置用户名'}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder={mode === 'LOGIN' ? "请输入用户名或邮箱" : "设置您的用户名"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Email Field (Register & Forgot Password) */}
            {(mode === 'REGISTER' || mode === 'FORGOT_PASSWORD') && (
               <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">邮箱地址</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Verification Code Field */}
            {(mode === 'REGISTER' || mode === 'FORGOT_PASSWORD') && (
               <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">邮箱验证码</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      placeholder="6位验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || loading}
                    className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">
                 {mode === 'FORGOT_PASSWORD' ? '设置新密码' : '密码'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder={mode === 'FORGOT_PASSWORD' ? "请输入新密码" : "请输入密码"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="text-rose-500 text-xs text-center bg-rose-50 py-2 rounded-lg font-medium border border-rose-100">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="text-emerald-600 text-xs text-center bg-emerald-50 py-2 rounded-lg font-medium border border-emerald-100">
                {successMsg}
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  {mode === 'LOGIN' && '进入系统'}
                  {mode === 'REGISTER' && '验证并注册'}
                  {mode === 'FORGOT_PASSWORD' && '重置密码'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {mode === 'LOGIN' && (
             <div className="mt-4 text-center">
                <button 
                  type="button"
                  onClick={() => handleModeSwitch('FORGOT_PASSWORD')}
                  className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
                >
                  忘记密码？
                </button>
             </div>
          )}
          
          {mode === 'FORGOT_PASSWORD' && (
             <div className="mt-4 text-center">
                <button 
                  type="button"
                  onClick={() => handleModeSwitch('LOGIN')}
                  className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
                >
                  返回登录
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};