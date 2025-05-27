"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const formatArray = (field) => {
  try {
    if (Array.isArray(field)) return field.join(", ");
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed.join(", ") : field;
  } catch {
    return field;
  }
};

export default function Home() {
  const [name, setName] = useState("");
  const [strengths, setStrengths] = useState("");
  const [aspirations, setAspirations] = useState("");
  const [values, setValues] = useState("");
  const [network, setNetwork] = useState([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error && data) {
      setNetwork(data);
    }
  };

  const handleJoin = async () => {
    const profile = {
      name,
      strengths: strengths.split(",").map((s) => s.trim()),
      aspirations: aspirations.split(",").map((a) => a.trim()),
      values: values.split(",").map((v) => v.trim()),
    };
    const { error } = await supabase.from("profiles").insert([profile]);
    if (!error) {
      setNetwork((prev) => [...prev, profile]);
      setName("");
      setStrengths("");
      setAspirations("");
      setValues("");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold text-center">Human Potential Exchange</h1>
      <p className="text-center text-lg">
        Une plateforme vivante pour identifier, connecter et activer les potentiels humains vers l’évolution collective.
      </p>

      <div className="border rounded-lg shadow-md">
        <div className="p-4 space-y-4">
          <h2 className="text-2xl font-semibold">Rejoindre le réseau</h2>

          <input
            className="border px-2 py-1 w-full"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border px-2 py-1 w-full"
            placeholder="Vos forces (ex: créativité, empathie)"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
          />
          <input
            className="border px-2 py-1 w-full"
            placeholder="Vos aspirations (ex: éduquer, guérir, innover)"
            value={aspirations}
            onChange={(e) => setAspirations(e.target.value)}
          />
          <input
            className="border px-2 py-1 w-full"
            placeholder="Vos valeurs (ex: liberté, respect, joie)"
            value={values}
            onChange={(e) => setValues(e.target.value)}
          />

          <button className="bg-blue-500 text-white py-2 px-4 rounded w-full" onClick={handleJoin}>
            Entrer dans l’échange
          </button>
        </div>
      </div>

      <div className="border rounded-lg shadow-md">
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Code d’éthique – Manifeste HPE</h2>
          <p>
            Nous croyons que chaque être humain porte un potentiel unique, souvent endormi, parfois ignoré, mais toujours porteur de sens pour l’évolution collective.
          </p>
          <p>
            Nous refusons les systèmes qui réduisent la valeur humaine à la productivité ou à l’obéissance. Nous créons un réseau vivant, où les potentiels humains sont identifiés, valorisés, et coordonnés au service d’un progrès partagé.
          </p>
          <p>
            Notre but n’est pas la domination, mais la coordination consciente. Ce réseau n’appartient à personne. Il se bâtit par ceux qui s’y reconnaissent, et grandit par la qualité de leurs liens.
          </p>
        </div>
      </div>

      <div className="border rounded-lg shadow-md">
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Réseau en expansion</h2>
          {network.length === 0 ? (
            <p className="text-gray-500">Aucun membre encore. Soyez le premier à entrer dans l’échange.</p>
          ) : (
            network.map((person, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <h3 className="text-lg font-bold">{person.name}</h3>
                <p><strong>Forces :</strong> {formatArray(person.strengths)}</p>
                <p><strong>Aspirations :</strong> {formatArray(person.aspirations)}</p>
                <p><strong>Valeurs :</strong> {formatArray(person.values)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}