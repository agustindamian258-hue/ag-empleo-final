import { useState, useEffect } from "react";
import { db, auth, storage } from "../app/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function Feed() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleFile = (e: any) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handlePost = async () => {
    if (!user || (!text && !file)) return;
    let mediaUrl = "";
    let mediaType = "";

    if (file) {
      const sRef = ref(storage, `posts/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      mediaUrl = await getDownloadURL(sRef);
      mediaType = file.type.startsWith("video") ? "video" : "image";
    }

    // PUBLICAR CON DATOS DE USUARIO (Nombre + Foto)
    await addDoc(collection(db, "posts"), {
      text,
      mediaUrl,
      mediaType,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL, // <--- ESTO ES CLAVE
      likes: [], 
      createdAt: serverTimestamp()
    });

    setText(""); setFile(null); setPreview(null);
  };

  const handleLike = async (postId: string, likes: string[] = []) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    if (likes.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto", padding: "15px", backgroundColor: "#f0f2f5", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", color: "#1c1e21" }}>AG Social</h2>
      
      {user && (
        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
             <img src={user.photoURL} width="40" height="40" style={{ borderRadius: "50%" }} />
             <span style={{ fontWeight: "bold" }}>{user.displayName}</span>
          </div>
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="¿Qué estás pensando?"
            style={{ width: "100%", height: "60px", border: "1px solid #ddd", borderRadius: "8px", padding: "10px", boxSizing: "border-box", resize: "none" }}
          />
          <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ marginTop: "10px" }} />
          {preview && <img src={preview} width="100%" style={{ marginTop: "10px", borderRadius: "8px" }} />}
          <button onClick={handlePost} style={{ width: "100%", marginTop: "10px", padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Publicar
          </button>
        </div>
      )}

      {posts.map(p => (
        <div key={p.id} style={{ background: "#fff", padding: "15px", borderRadius: "12px", marginTop: "15px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <img src={p.userPhoto || "https://via.placeholder.com/40"} width="40" height="40" style={{ borderRadius: "50%" }} />
            <span style={{ fontWeight: "bold" }}>{p.userName || "Usuario"}</span>
          </div>
          <p style={{ fontSize: "16px", marginBottom: "10px" }}>{p.text}</p>
          {p.mediaUrl && (
            p.mediaType === "video" 
            ? <video src={p.mediaUrl} width="100%" controls style={{ borderRadius: "8px" }} />
            : <img src={p.mediaUrl} width="100%" style={{ borderRadius: "8px" }} />
          )}
          <button 
            onClick={() => handleLike(p.id, p.likes)}
            style={{ marginTop: "10px", background: p.likes?.includes(user?.uid) ? "#007bff" : "#f0f2f5", color: p.likes?.includes(user?.uid) ? "white" : "#333", border: "none", padding: "8px 15px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}
          >
            👍 {p.likes?.length || 0}
          </button>
        </div>
      ))}
    </div>
  );
}
