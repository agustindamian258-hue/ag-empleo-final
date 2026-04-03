import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { auth, db } from "../app/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    title: "",
    bio: "",
  });

  // detectar usuario
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadProfile(u.uid);
    });

    return () => unsub();
  }, []);

  // cargar perfil desde Firebase
  const loadProfile = async (uid: string) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setForm(snap.data() as any);
    }
  };

  // guardar perfil
  const saveProfile = async () => {
    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      ...form,
      email: user.email,
    });

    alert("Perfil guardado");
  };

  return (
    <>
      <Navbar />
      <h1>Mi Perfil</h1>

      {!user && <p>Tenés que loguearte</p>}

      {user && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          
          <input
            placeholder="Nombre"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            placeholder="Título profesional"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <textarea
            placeholder="Descripción / Bio"
            value={form.bio}
            onChange={(e) =>
              setForm({ ...form, bio: e.target.value })
            }
          />

          <button onClick={saveProfile}>
            Guardar perfil
          </button>

          <h2>Vista previa</h2>
          <p><strong>{form.name}</strong></p>
          <p>{form.title}</p>
          <p>{form.bio}</p>
        </div>
      )}
    </>
  );
}
