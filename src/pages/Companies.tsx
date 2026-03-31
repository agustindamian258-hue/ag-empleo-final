import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { db } from "../app/firebase";
import { collection, getDocs } from "firebase/firestore";

type Company = {
  name: string;
  letter: string;
  url: string;
};

export default function Companies() {
  const [letter, setLetter] = useState("");
  const [data, setData] = useState<Company[]>([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "companies"));
        const arr: Company[] = [];

        querySnapshot.forEach((doc) => {
          arr.push(doc.data() as Company);
        });

        setData(arr);
      } catch (error) {
        console.error("Error cargando empresas:", error);
      }
    };

    getData();
  }, []);

  const filtered = data.filter((c) => c.letter === letter);

  return (
    <>
      <Navbar />
      <h1>Empresas</h1>

      {/* Abecedario */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
          <button key={l} onClick={() => setLetter(l)}>
            {l
