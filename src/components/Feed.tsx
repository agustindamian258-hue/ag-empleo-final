import { useEffect, useState } from "react";
import { db } from "../app/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";

export default function Feed() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const arr: any[] = [];
      snapshot.forEach((docSnap) => {
        // PASO 4 LISTO: Guardamos el ID
        arr.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPosts(arr);
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!text) return;
    // PASO 1 LISTO: Agregamos likes: 0
    await addDoc(collection(db, "posts"), {
      text,
      likes: 0,
      createdAt: new Date(),
    });
    setText("");
  };

  // PASO 3 LISTO: Lógica para actualizar en Firebase
  const handleLike = async (id: string, currentLikes: number) => {
    const ref = doc(db, "posts", id);
    await updateDoc(ref, {
      likes: (currentLikes || 0) + 1,
    });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h2>AG Social - Feed</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí algo..."
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={handlePost}>Publicar</button>
      </div>

      {posts.map((p) => (
        <div key={p.id} style={{ border: "1px solid gray", margin: "10px 0", padding: "10px" }}>
          <p>{p.text}</p>
          {/* PASO 5 LISTO: El botón de like funcionando */}
          <button onClick={() => handleLike(p.id, p.likes)}>
            👍 {p.likes || 0}
          </button>
        </div>
      ))}
    </div>
  );
}
