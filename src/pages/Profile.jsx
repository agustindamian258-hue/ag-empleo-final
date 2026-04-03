import { useState, useEffect } from "react";
import { auth, db } from "../app/firebase"; // Asegurate que 'db' esté exportado en tu firebase.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: ""
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Traer datos de Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          // Si no existe el documento, usamos los datos de la cuenta de Google
          setFormData({
            name: currentUser.displayName || "",
            title: "Frontend Dev", // Valor por defecto
            bio: ""
          });
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        email: user.email,
        updatedAt: new Date()
      });
      alert("¡Perfil actualizado con éxito!");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar.");
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "50px" }}>Cargando perfil...</p>;
  if (!user) return <p style={{ textAlign: "center", marginTop: "50px" }}>Debes iniciar sesión para ver esta página.</p>;

  return (
    <div style={containerStyle}>
      <h2 style={{ marginBottom: "20px" }}>Mi Perfil</h2>
      
      <div style={cardStyle}>
        <label style={labelStyle}>Nombre Completo</label>
        <input 
          type="text" 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          style={inputStyle}
        />

        <label style={labelStyle}>Título Profesional</label>
        <input 
          type="text" 
          value={formData.title} 
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          style={inputStyle}
        />

        <label style={labelStyle}>Biografía / Sobre mí</label>
        <textarea 
          value={formData.bio} 
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          style={{...inputStyle, height: "100px", resize: "none"}}
        />

        <button onClick={handleSave} style={buttonStyle}>
          Guardar Cambios Realmente
        </button>
      </div>
    </div>
  );
}

// Estilos Mobile-First (limpios y con contraste)
const containerStyle = { padding: "20px", maxWidth: "500px", margin: "0 auto", fontFamily: "sans-serif" };
const cardStyle = { background: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #ddd", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" };
const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px", color: "#555" };
const inputStyle = { width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "16px" };
const buttonStyle = { width: "100%", padding: "12px", background: "#28a745", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" };
