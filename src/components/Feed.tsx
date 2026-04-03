import { useState, useEffect } from "react";
import { db, auth } from "../app/firebase";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

// 1. Definimos la estructura del Post para que no haya errores de TypeScript
interface Post {
  id: string;
  text: string;
  uid: string;
  userName: string;
  likes: string[];
  createdAt: any;
}

export default function Feed() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");

  // 2. Conexión con el usuario de Google
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 3. Traer los posts de la base de datos (En tiempo real)
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      setPosts(docs);
    });
    return () => unsub();
  }, []);

  // 4. Función para publicar (Lógica real)
  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    await addDoc(collection(db, "posts"), {
      text: newPost,
      uid: user.uid,
      userName: user.displayName || "Usuario",
      likes: [], 
      createdAt: serverTimestamp()
    });
    setNewPost("");
  };

  // 5. Función de Likes (Sin duplicados y sin carpetas extras)
  const handleLike = async (postId: string, likesArray: string[] = []) => {
    if (!user) return alert("Iniciá sesión para dar like");
    const postRef = doc(db, "posts", postId);
    
    if (likesArray.includes(user.uid)) {
      // Si ya le diste like, lo saca
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      // Si no le diste, lo agrega
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>AG Social</h2>

      {/* Caja de publicación */}
      {user && (
        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "25px" }}>
          <textarea 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="¿Qué estás pensando?"
            style={{ width: "100%", height: "80px", borderRadius: "8px", padding: "12px", border: "1px solid #ddd", resize: "none", fontSize: "16px", boxSizing: "border-box" }}
          />
          <button onClick={handlePost} style={{ width: "100%", marginTop: "10px", padding: "12px", background: "#007bff", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
            Publicar Ahora
          </button>
        </div>
      )}

      {/* Lista de posteos */}
      <div>
        {posts.map(p => (
          <div key={p.id} style={{ background: "#fff", padding: "15px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #eee" }}>
            <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#555" }}>👤 {p.userName}</p>
            <p style={{ fontSize: "16px", color: "#222" }}>{p.text}</p>
            <div style={{ marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #f9f9f9" }}>
                <button 
                onClick={() => handleLike(p.id, p.likes)}
                style={{ 
                    background: p.likes?.includes(user?.uid || "") ? "#ff4d4d" : "#f0f2f5",
                    color: p.likes?.includes(user?.uid || "") ? "white" : "#333",
                    border: "none", padding: "10px 20px", borderRadius: "25px", cursor: "pointer", fontWeight: "bold", fontSize: "14px"
                }}
                >
                ❤️ {p.likes?.length || 0} Likes
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
