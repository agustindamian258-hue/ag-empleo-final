import { useEffect, useState } from "react";
import { db } from "../app/firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

export default function Feed() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);

  // 🔄 tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snapshot) => {
      const arr: any[] = [];
      snapshot.forEach((doc) => {
        arr.push(doc.data());
      });
      setPosts(arr);
    });

    return () => unsub();
  }, []);

  // ➕ crear post
  const handlePost = async () => {
    if (!text) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: new Date(),
    });

    setText("");
  };

  return (
    <div>
      <h2>Feed</h2>

      {/* crear post */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribí algo..."
      />
      <button onClick={handlePost}>Publicar</button>

      {/* lista */}
      {posts.map((p, i) => (
        <div key={i} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
          <p>{p.text}</p>
        </div>
      ))}
    </div>
  );
}
