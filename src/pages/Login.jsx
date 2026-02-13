import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, signInWithPhone, verifyPhoneOtp } from '../services/auth';
import { User, Lock, Mail, Phone, ArrowRight, MessageCircle } from 'lucide-react';

/**
 * 登录页面
 *
 * 支持两种登录方式：
 * 1. 邮箱 + 密码
 * 2. 手机号 + 验证码
 */
const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // true=登录，false=注册
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'phone'

  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // 发送验证码状态
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 加载和错误状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 倒计时计时器
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 邮箱登录/注册
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password);
        // 注册成功后自动登录
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendOtp = async () => {
    if (!phone || phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signInWithPhone(phone);
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      setError(err.message || '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证验证码登录
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyPhoneOtp(phone, otp);
      navigate('/');
    } catch (err) {
      setError(err.message || '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-custom flex flex-col">
      {/* 头部 */}
      <div className="flex-1 flex flex-col justify-center px-6">
        {/* Logo / 标题 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#fcd753] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Mingo</h1>
          <p className="text-gray-500 mt-1">记录你的社交生活</p>
        </div>

        {/* 登录方式切换 */}
        <div className="flex bg-white rounded-xl p-1 shadow-md mb-6">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              loginMethod === 'email'
                ? 'bg-[#fcd753] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Mail className="h-4 w-4" />
            邮箱登录
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              loginMethod === 'phone'
                ? 'bg-[#fcd753] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Phone className="h-4 w-4" />
            手机登录
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* 邮箱登录表单 */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#fcd753] focus:ring-2 focus:ring-[#fcd753]/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#fcd753] focus:ring-2 focus:ring-[#fcd753]/20"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#fcd753] text-gray-800 font-medium rounded-xl hover:bg-[#e6c24a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? '请稍候...' : (isLogin ? '登录' : '注册')}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        )}

        {/* 手机登录表单 */}
        {loginMethod === 'phone' && (
          <div className="space-y-4">
            {!otpSent ? (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">手机号</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#fcd753] focus:ring-2 focus:ring-[#fcd753]/20"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || countdown > 0}
                  className="w-full py-3 bg-[#897dbf] text-white font-medium rounded-xl hover:bg-[#6b5aa3] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                </button>
              </>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">验证码</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入6位验证码"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#fcd753] focus:ring-2 focus:ring-[#fcd753]/20 text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 bg-[#fcd753] text-gray-800 font-medium rounded-xl hover:bg-[#e6c24a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? '请稍候...' : '登录'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* 切换登录/注册 */}
        {loginMethod === 'email' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[#fcd753] ml-1 font-medium"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </p>
        )}

        {/* 手机号登录时显示返回按钮 */}
        {loginMethod === 'phone' && otpSent && (
          <p className="text-center text-sm text-gray-500 mt-6">
            收到验证码了吗？
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
              }}
              className="text-[#fcd753] ml-1 font-medium"
            >
              重新获取
            </button>
          </p>
        )}
      </div>

      {/* 底部说明 */}
      <div className="p-6 text-center">
        <p className="text-xs text-gray-400">
          登录即表示同意
          <a href="#" className="text-[#897dbf]">服务条款</a>
          和
          <a href="#" className="text-[#897dbf]">隐私政策</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
