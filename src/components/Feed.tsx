import { useEffect, useState } from "react";
import { db } from "../app/firebase";
import { 
  collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc 
} from "firebase/firestore";

export default function Feed() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  
  // 1. Estados para comentarios
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  // 🔄 Leer Posts y Comentarios en tiempo real
  useEffect(() => {
    // Escuchar Posts
    const qPosts = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const arr: any[] = [];
      snapshot.forEach((docSnap) => {
        arr.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPosts(arr);
    });

    // PASO 4: Escuchar Comentarios
    const unsubComments = onSnapshot(collection(db, "comments"), (snapshot) => {
      const arr: any[] = [];
      snapshot.forEach((docSnap) => {
        arr.push(docSnap.data());
      });
      setComments(arr);
    });

    return () => {
      unsubPosts();
      unsubComments();
    };
  }, []);

  // ➕ Crear post
  const handlePost = async () => {
    if (!text) return;
    await addDoc(collection(db, "posts"), {
      text,
      likes: 0,
      createdAt: new Date(),
    });
    setText("");
  };

  // ❤️ Función de Like
  const handleLike = async (id: string, currentLikes: number) => {
    const ref = doc(db, "posts", id);
    await updateDoc(ref, {
      likes: (currentLikes || 0) + 1,
    });
  };

  // 💬 PASO 3: Función para comentar
  const handleComment = async (postId: string) => {
    if (!commentText) return;
    await addDoc(collection(db, "comments"), {
      postId,
      text: commentText,
      createdAt: new Date(),
    });
    setCommentText("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h2>Feed Social</h2>

      {/* Crear post */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="¿Qué estás pensando?"
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={handlePost}>Publicar</button>
      </div>

      {/* Lista de posts */}
      {posts.map((p) => (
        <div key={p.id} style={{ border: "1px solid gray", marginBottom: "15px", padding: "15px", borderRadius: "10px" }}>
          <p>{p.text}</p>
          
          {/* Botón Like */}
          <button onClick={() => handleLike(p.id, p.likes)}>
            👍 {p.likes || 0}
          </button>

          <hr />

          {/* PASO 5: Sección de comentarios */}
          <div style={{ marginTop: "10px" }}>
            {comments
              .filter((c) => c.postId === p.id)
              .map((c, i) => (
                <p key={i} style={{ fontSize: "0.9rem", background: "#f0f0f0", padding: "5px", borderRadius: "5px" }}>
                  💬 {c.text}
                </p>
            ))}

            <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
              <input
                placeholder="Comentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ flex: 1, padding: "5px" }}
              />
              <button onClick={() => handleComment(p.id)}>Enviar</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
