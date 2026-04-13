import { auth, provider, db } from '../app/firebase';
import { signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const navigate                = useNavigate();
  const [cargando, setCargando] = useState<boolean>(false);
  const [error,    setError]    = useState<string>('');

  const handleLogin = async (): Promise<void> => {
    setCargando(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;
      const userRef = doc(db, 'users', user.uid);
      const snap    = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name:        user.displayName ?? 'Sin nombre',
          email:       user.email       ?? '',
          photo:       user.photoURL    ?? '',
          ciudad:      '',
          descripcion: '',
          role:        'user',
          createdAt:   serverTimestamp(),
          updatedAt:   serverTimestamp(),
        });
      }
      navigate('/');
    } catch (e) {
      if (e instanceof FirebaseError &&
          e.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error('[Login] Error:', e);
      setError('No se pudo iniciar sesión. Intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-900 px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-blue-800 tracking-tighter">
            AG EMPLEO
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tu próximo paso profesional comienza aquí
          </p>
        </div>
        <div className="w-16 h-1 bg-blue-200 rounded-full" />
        <button
          onClick={handleLogin}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-2xl py-4 px-6 shadow-sm active:scale-95 transition-transform disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.2-10 7.2-17z"/>
            <path fill="#FBBC05" d="M10.6 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.8 10.7l7.8-6z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
          </svg>
          <span className="font-bold text-gray-700 text-base">
            {cargando ? 'Entrando...' : 'Continuar con Google'}
          </span>
        </button>
        {error && (
          <p className="text-red-500 text-sm text-center" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-gray-400 text-center">
          Al continuar aceptás las políticas de privacidad de AG EMPLEO
        </p>
      </div>
    </div>
  );
        }
