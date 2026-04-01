import { auth, provider } from "../app/firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login() {

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>
        Iniciar con Google
      </button>
    </div>
  );
}
