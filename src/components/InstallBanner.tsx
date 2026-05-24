import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No mostrar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // No mostrar si el usuario ya la descartó
    if (localStorage.getItem('pwa-banner-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar el banner después de 3 segundos
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
        {/* Ícono */}
        <div className="w-14 h-14 rounded-2xl bg-[--sc-500] flex items-center justify-center shrink-0 shadow-md">
          <span className="text-white font-black text-lg tracking-tighter">AG</span>
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white">
            Instalá AG Empleo
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Accedé más rápido desde tu pantalla de inicio
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-[--sc-500] text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 text-xs text-center active:scale-95 transition-transform"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
        }
