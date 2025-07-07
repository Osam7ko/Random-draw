import { useState } from 'react';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    try {
      setError('');
      setLoading(true);
      
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      
      navigate('/admin');
    } catch (error) {
      console.error('Authentication error:', error);
      
      switch (error.message) {
        case 'auth/user-not-found':
          setError('المستخدم غير موجود');
          break;
        case 'auth/email-already-in-use':
          setError('البريد الإلكتروني مستخدم بالفعل');
          break;
        default:
          setError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
      }
    }
    
    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h1>
          <p className="login-subtitle">
            {isSignUp ? 'أدخل بياناتك لإنشاء حساب جديد' : 'أدخل بياناتك للوصول إلى لوحة التحكم'}
          </p>
          {!isSignUp && (
            <div className="demo-credentials">
              <p><strong>حسابات تجريبية:</strong></p>
              <p>admin@raffle.com / 123456</p>
              <p>test@test.com / password</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">البريد الإلكتروني:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="example@email.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="••••••••"
              minLength="6"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? 'جاري التحميل...' : (isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول')}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="link-button"
            >
              {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
