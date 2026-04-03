import { auth, provider, db } from "../app/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // GUARDAR USUARIO EN FIRESTORE (Lo que te faltaba)
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      }, { merge: true });

      navigate("/");
    } catch (error) {
      console.error("Error en login:", error);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f2f5" }}>
      <button 
        onClick={handleLogin}
        style={{ padding: "15px 30px", fontSize: "18px", borderRadius: "30px", border: "none", backgroundColor: "#007bff", color: "white", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
      >
        Entrar con Google
      </button>
    </div>
  );
}
