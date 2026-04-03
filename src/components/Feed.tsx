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
    let mediaType = ""; // Guardamos si es imagen o video

    if (file) {
      const sRef = ref(storage, `posts/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      mediaUrl = await getDownloadURL(sRef);
      // Detectamos el tipo de archivo
      mediaType = file.type.startsWith("video") ? "video" : "image";
    }

    await addDoc(collection(db, "posts"), {
      text,
      mediaUrl,
      mediaType,
      uid: user.uid,
      userName: user.displayName || "Usuario",
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
    <div style={{ maxWidth: "500px", margin: "auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>AG Social</h2>
      
      {user && (
        <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="¿Qué estás pensando?"
            style={{ width: "100%", height: "60px", border: "1px solid #ddd", borderRadius: "8px", padding: "10px", boxSizing: "border-box" }}
          />
          <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ marginTop: "10px", width: "100%" }} />
          
          {preview && (
            <div style={{ marginTop: "10px" }}>
              {file?.type.startsWith("video") ? (
                <video src={preview} width="100%" controls style={{ borderRadius: "8px" }} />
              ) : (
                <img src={preview} width="100%" style={{ borderRadius: "8px" }} />
              )}
            </div>
          )}

          <button onClick={handlePost} style={{ width: "100%", marginTop: "10px", padding: "12px", background: "#007bff", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Publicar
          </button>
        </div>
      )}

      {posts.map(p => (
        <div key={p.id} style={{ background: "#fff", padding: "15px", borderRadius: "12px", marginTop: "15px", border: "1px solid #eee" }}>
          <p style={{ fontWeight: "bold", color: "#555" }}>👤 {p.userName}</p>
          <p style={{ fontSize: "16px", margin: "10px 0" }}>{p.text}</p>
          
          {/* Muestra imagen o video según lo que se subió */}
          {p.mediaUrl && (
            p.mediaType === "video" ? (
              <video src={p.mediaUrl} width="100%" controls style={{ borderRadius: "8px", marginBottom: "10px" }} />
            ) : (
              <img src={p.mediaUrl} width="100%" style={{ borderRadius: "8px", marginBottom: "10px" }} />
            )
          )}

          <button 
            onClick={() => handleLike(p.id, p.likes)}
            style={{ 
              background: p.likes?.includes(user?.uid) ? "#ff4d4d" : "#f0f2f5", 
              color: p.likes?.includes(user?.uid) ? "white" : "#333", 
              border: "none", padding: "8px 15px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" 
            }}
          >
            ❤️ {p.likes?.length || 0}
          </button>
        </div>
      ))}
    </div>
  );
}
