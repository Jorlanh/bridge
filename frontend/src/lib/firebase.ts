import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, User as FirebaseUser } from "firebase/auth";

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Verificar se todas as variáveis de ambiente estão definidas
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  // Variáveis de ambiente do Firebase não encontradas
}

// Inicializar Firebase apenas se não estiver já inicializado
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicializar Analytics apenas no cliente e se measurementId estiver disponível
let analytics: Analytics | null = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
  }
}

// Inicializar Messaging apenas no cliente e se o navegador suportar
let messaging: Messaging | null = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
  }
}

// Inicializar Authentication
let auth: Auth | null = null;
if (typeof window !== "undefined") {
  try {
    // Verificar se as variáveis essenciais para Auth estão presentes
    const authRequiredVars = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
    ];
    
    const missingAuthVars = authRequiredVars.filter(
      (varName) => !import.meta.env[varName]
    );
    
    if (missingAuthVars.length === 0) {
      auth = getAuth(app);
    } else {
      console.error(
        "❌ Firebase Auth não pode ser inicializado. Variáveis faltando:",
        missingAuthVars.join(", ")
      );
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar Authentication:", error);
  }
}

// Registrar service worker para notificações
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    // Registrar o service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    
    return registration;
  } catch (error) {
    console.error("❌ Erro ao registrar Service Worker:", error);
    return null;
  }
}

// Função para solicitar permissão de notificação e obter token FCM
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    return null;
  }

  try {
    // Registrar service worker primeiro
    await registerServiceWorker();
    
    // Aguardar um pouco para o service worker estar pronto
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Solicitar permissão do usuário
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      // Obter o token FCM
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        return null;
      }

      const token = await getToken(messaging, { vapidKey });
      
      if (token) {
        return token;
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao solicitar permissão de notificação:", error);
    return null;
  }
}

// Função para escutar mensagens em foreground (quando o app está aberto)
export function onMessageListener(): Promise<any> {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }

    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}

// Função para fazer login com Google
export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (!auth) {
    const errorMsg = "Firebase Auth não está inicializado. Verifique se as variáveis de ambiente do Firebase estão configuradas corretamente.";
    console.error("❌", errorMsg);
    throw new Error(errorMsg);
  }

  // Verificar se o app está configurado
  if (!app) {
    throw new Error("Firebase App não está inicializado");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("❌ Erro ao fazer login com Google:", error);
    
    // Mensagens de erro mais específicas
    if (error.code === "auth/configuration-not-found") {
      throw new Error(
        "Configuração do Firebase Auth não encontrada. " +
        "Verifique se o método de autenticação Google está habilitado no Firebase Console " +
        "e se as variáveis de ambiente estão configuradas corretamente."
      );
    } else if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Login cancelado pelo usuário");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Popup bloqueado pelo navegador. Por favor, permita popups para este site.");
    } else if (error.code === "auth/unauthorized-domain") {
      throw new Error(
        "Domínio não autorizado. " +
        "Adicione este domínio nas configurações do Firebase Console (Authentication > Settings > Authorized domains)."
      );
    }
    
    throw new Error(error.message || "Erro ao fazer login com Google");
  }
}

// Função para fazer login com Facebook
export async function signInWithFacebook(): Promise<FirebaseUser> {
  if (!auth) {
    const errorMsg = "Firebase Auth não está inicializado. Verifique se as variáveis de ambiente do Firebase estão configuradas corretamente.";
    console.error("❌", errorMsg);
    throw new Error(errorMsg);
  }

  // Verificar se o app está configurado
  if (!app) {
    throw new Error("Firebase App não está inicializado");
  }

  const provider = new FacebookAuthProvider();
  provider.addScope("email");
  provider.addScope("public_profile");

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("❌ Erro ao fazer login com Facebook:", error);
    
    // Mensagens de erro mais específicas
    if (error.code === "auth/configuration-not-found") {
      throw new Error(
        "Configuração do Firebase Auth não encontrada. " +
        "Verifique se o método de autenticação Facebook está habilitado no Firebase Console " +
        "e se as variáveis de ambiente estão configuradas corretamente."
      );
    } else if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Login cancelado pelo usuário");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Popup bloqueado pelo navegador. Por favor, permita popups para este site.");
    } else if (error.code === "auth/unauthorized-domain") {
      throw new Error(
        "Domínio não autorizado. " +
        "Adicione este domínio nas configurações do Firebase Console (Authentication > Settings > Authorized domains)."
      );
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("Uma conta já existe com o mesmo endereço de email, mas com credenciais diferentes.");
    }
    
    throw new Error(error.message || "Erro ao fazer login com Facebook");
  }
}

// Função para obter o token ID do Firebase
export async function getIdToken(): Promise<string | null> {
  if (!auth || !auth.currentUser) {
    return null;
  }

  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error("Erro ao obter token ID:", error);
    return null;
  }
}

// Função para fazer logout
export async function signOut(): Promise<void> {
  if (!auth) {
    return;
  }

  try {
    await auth.signOut();
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
}

export { app, analytics, messaging, auth };
export default app;
