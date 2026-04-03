import { useState, useEffect } from "react";
import { db, auth, storage } from "../app/firebase";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp 
} from "firebase/firestore";
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
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
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

    await addDoc(collection(db, "posts"), {
      text,
      mediaUrl,
      mediaType,
      uid: user.uid,
      userName: user.displayName || "Usuario",
      userPhoto: user.photoURL || "", // <--- ESTO ES LO QUE TE FALTABA
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
    <div style={{ maxWidth: "500px", margin: "auto", padding: "15px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      
      {/* Caja para Publicar */}
      {user && (
        <div style={{ background: "#fff", padding: "15px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <img src={user.photoURL} width="40" height="40" style={{ borderRadius: "50%" }} />
            <span style={{ fontWeight: "bold" }}>{user.displayName}</span>
          </div>
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="¿Qué quieres compartir hoy?"
            style={{ width: "100%", height: "80px", border: "none", outline: "none", fontSize: "16px", resize: "none" }}
          />
          {preview && (
            <div style={{ position: "relative", marginBottom: "10px" }}>
              {file?.type.startsWith("video") ? (
                <video src={preview} width="100%" controls style={{ borderRadius: "10px" }} />
              ) : (
                <img src={preview} width="100%" style={{ borderRadius: "10px" }} />
              )}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "10px" }}>
            <label style={{ cursor: "pointer", color: "#007bff", fontWeight: "bold" }}>
              📁 Foto/Video
              <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: "none" }} />
            </label>
            <button onClick={handlePost} style={{ padding: "8px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold" }}>
              Publicar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Posts */}
      {posts.map(p => (
        <div key={p.id} style={{ background: "#fff", padding: "15px", borderRadius: "15px", marginBottom: "15px", boxShadow: "0 1px 5px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <img src={p.userPhoto || "https://via.placeholder.com/40"} width="40" height="40" style={{ borderRadius: "50%" }} />
            <span style={{ fontWeight: "bold" }}>{p.userName}</span>
          </div>
          
          <p style={{ fontSize: "16px", marginBottom: "10px", color: "#333" }}>{p.text}</p>
          
          {p.mediaUrl && (
            p.mediaType === "video" ? (
              <video src={p.mediaUrl} width="100%" controls style={{ borderRadius: "10px" }} />
            ) : (
              <img src={p.mediaUrl} width="100%" style={{ borderRadius: "10px" }} />
            )
          )}

          <div style={{ marginTop: "10px", borderTop: "1px solid #f0f2f5", paddingTop: "10px" }}>
            <button 
              onClick={() => handleLike(p.id, p.likes)}
              style={{ 
                background: p.likes?.includes(user?.uid) ? "#e7f3ff" : "transparent", 
                color: p.likes?.includes(user?.uid) ? "#007bff" : "#65676b", 
                border: "none", padding: "8px 12px", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px"
              }}
            >
              👍 {p.likes?.length || 0} Me gusta
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
