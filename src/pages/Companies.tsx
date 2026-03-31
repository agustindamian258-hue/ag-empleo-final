import Navbar from "../components/Navbar";
import { useState } from "react";

const data = [
  { name: "Amazon", letter: "A", url: "https://amazon.com" },
  { name: "Apple", letter: "A", url: "https://apple.com" },
  { name: "Google", letter: "G", url: "https://google.com" },
];

export default function Companies() {
  const [letter, setLetter] = useState("");

  const filtered = data.filter((c) => c.letter === letter);

  return (
    <>
      <Navbar />
      <h1>Empresas</h1>

      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
        <button key={l} onClick={() => setLetter(l)}>
          {l}
        </button>
      ))}

      <div>
        {filtered.map((c) => (
          <div key={c.name}>
            <a href={c.url} target="_blank">
              {c.name}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
