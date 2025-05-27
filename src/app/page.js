"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Network } from "vis-network";
import "vis-network/styles/vis-network.css";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const translations = {
  fr: {
    title: "Human Potential Exchange",
    subtitle:
      "Une plateforme vivante pour identifier, connecter et activer les potentiels humains vers l’évolution collective.",
    join: "Rejoindre le réseau",
    enter: "Entrer dans l’échange",
    manifesto: "Code d’éthique – Manifeste HPE",
    manifestoText1:
      "Nous croyons que chaque être humain porte un potentiel unique, souvent endormi, parfois ignoré, mais toujours porteur de sens pour l’évolution collective.",
    manifestoText2:
      "Nous refusons les systèmes qui réduisent la valeur humaine à la productivité ou à l’obéissance. Nous créons un réseau vivant, où les potentiels humains sont identifiés, valorisés, et coordonnés au service d’un progrès partagé.",
    manifestoText3:
      "Notre but n’est pas la domination, mais la coordination consciente. Ce réseau n’appartient à personne. Il se bâtit par ceux qui s’y reconnaissent, et grandit par la qualité de leurs liens.",
    alreadySubmitted: "Vous avez déjà soumis un profil aujourd’hui. Réessayez dans",
    networkEmpty: "Aucun membre encore. Soyez le premier à entrer dans l’échange.",
    networkTitle: "Réseau en expansion",
    hours: "h",
    vote: "Voter",
    leaderboard: "Classement des profils les plus votés",
  },
  en: {
    title: "Human Potential Exchange",
    subtitle:
      "A living platform to identify, connect, and activate human potential for collective evolution.",
    join: "Join the network",
    enter: "Enter the exchange",
    manifesto: "Ethical Code – HPE Manifesto",
    manifestoText1:
      "We believe every human carries a unique potential – often dormant, sometimes ignored, but always meaningful for collective evolution.",
    manifestoText2:
      "We reject systems that reduce human value to productivity or obedience. We are building a living network where human potential is identified, valued, and coordinated for shared progress.",
    manifestoText3:
      "Our goal is not domination, but conscious coordination. This network belongs to no one. It grows by the quality of its connections.",
    alreadySubmitted: "You’ve already submitted a profile today. Try again in",
    networkEmpty: "No members yet. Be the first to enter the exchange.",
    networkTitle: "Expanding Network",
    hours: "h",
    vote: "Vote",
    leaderboard: "Top Voted Profiles",
  },
};

const formatArray = (field) => {
  try {
    if (Array.isArray(field)) return field.join(", ");
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed.join(", ") : field;
  } catch {
    return field;
  }
};

const extractArray = (data) => {
  try {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") return JSON.parse(data);
    return [];
  } catch {
    return [];
  }
};

export default function Home() {
  const [name, setName] = useState("");
  const [strengths, setStrengths] = useState("");
  const [aspirations, setAspirations] = useState("");
  const [values, setValues] = useState("");
  const [network, setNetwork] = useState([]);
  const [cooldown, setCooldown] = useState(null);
  const graphRef = useRef(null);

  const userLang = typeof window !== "undefined" ? navigator.language.slice(0, 2) : "en";
  const t = translations[userLang] || translations["en"];

  useEffect(() => {
    fetchProfiles();
    const lastSubmission = localStorage.getItem("lastSubmission");
    if (lastSubmission) {
      const nextAllowed = new Date(lastSubmission);
      nextAllowed.setDate(nextAllowed.getDate() + 1);
      const now = new Date();
      const remaining = nextAllowed - now;
      if (remaining > 0) {
        setCooldown(remaining);
      }
    }
  }, []);

  useEffect(() => {
    if (!graphRef.current || network.length === 0) return;

    const nodes = network.map((person, i) => ({
      id: i,
      label: person.name,
      title: `${person.name}\nForces: ${formatArray(person.strengths)}\nAspirations: ${formatArray(person.aspirations)}\nValeurs: ${formatArray(person.values)}`,
      shape: "dot",
      size: 16,
    }));

    const edges = [];
    for (let i = 0; i < network.length; i++) {
      for (let j = i + 1; j < network.length; j++) {
        const a = network[i];
        const b = network[j];
        const common = (x, y) => {
          const xa = extractArray(x);
          const ya = extractArray(y);
          return xa.filter((v) => ya.includes(v));
        };
        const links = [
          ...common(a.strengths, b.strengths),
          ...common(a.values, b.values),
          ...common(a.aspirations, b.aspirations),
        ];
        if (links.length > 0) {
          edges.push({ from: i, to: j, width: links.length });
        }
      }
    }

    const data = { nodes, edges };
    const options = {
      nodes: { shape: "dot", font: { size: 14 } },
      edges: { color: "#ccc" },
      interaction: { hover: true },
      physics: { stabilization: true },
    };

    new Network(graphRef.current, data, options);
  }, [network]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("votes", { ascending: false });
    if (!error && data) {
      setNetwork(data);
    }
  };

  const handleVote = async (id) => {
    const voteKey = `voted-${id}`;
    const lastVote = localStorage.getItem(voteKey);
    const now = Date.now();
    if (lastVote && now - parseInt(lastVote) < 24 * 60 * 60 * 1000) {
      alert("Vous avez déjà voté pour ce profil dans les dernières 24 heures.");
      return;
    }
    const { error } = await supabase.rpc("increment_vote", { row_id: id });
    if (!error) {
      localStorage.setItem(voteKey, now.toString());
      fetchProfiles();
    }
  };

  const handleJoin = async () => {
    if (cooldown) {
      alert(`${t.alreadySubmitted}`);
      return;
    }
    if (name.length > 100 || strengths.length > 200 || aspirations.length > 200 || values.length > 200) {
      alert("Veuillez limiter chaque champ à un nombre raisonnable de caractères.");
      return;
    }
    const profile = {
      name,
      strengths: strengths.split(",").map((s) => s.trim()),
      aspirations: aspirations.split(",").map((a) => a.trim()),
      values: values.split(",").map((v) => v.trim()),
    };
    const { error } = await supabase.from("profiles").insert([profile]);
    if (!error) {
      localStorage.setItem("lastSubmission", new Date().toISOString());
      setCooldown(24 * 60 * 60 * 1000);
      setNetwork((prev) => [...prev, profile]);
      setName("");
      setStrengths("");
      setAspirations("");
      setValues("");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold text-center">{t.title}</h1>
      <p className="text-center text-lg">{t.subtitle}</p>

      <div className="border rounded-lg shadow-md">
        <div className="p-4 space-y-4">
          <h2 className="text-2xl font-semibold">{t.join}</h2>

          <input className="border px-2 py-1 w-full" maxLength={100} placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border px-2 py-1 w-full" maxLength={200} placeholder="Vos forces" value={strengths} onChange={(e) => setStrengths(e.target.value)} />
          <input className="border px-2 py-1 w-full" maxLength={200} placeholder="Vos aspirations" value={aspirations} onChange={(e) => setAspirations(e.target.value)} />
          <input className="border px-2 py-1 w-full" maxLength={200} placeholder="Vos valeurs" value={values} onChange={(e) => setValues(e.target.value)} />

          <button className="bg-blue-500 text-white py-2 px-4 rounded w-full" onClick={handleJoin}>
            {t.enter}
          </button>

          {cooldown && (
            <p className="text-red-500 text-sm">
              {t.alreadySubmitted} {Math.ceil(cooldown / 3600000)}{t.hours}.
            </p>
          )}
        </div>
      </div>

      <div className="border rounded-lg shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">{t.leaderboard}</h2>
          {network.slice(0, 5).map((person, idx) => (
            <div key={idx} className="border-b py-2">
              <strong>{person.name}</strong> – {person.votes || 0} votes
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg shadow-md">
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">{t.networkTitle}</h2>
          {network.length === 0 ? (
            <p className="text-gray-500">{t.networkEmpty}</p>
          ) : (
            network.map((person, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <h3 className="text-lg font-bold">{person.name}</h3>
                <p><strong>Forces :</strong> {formatArray(person.strengths)}</p>
                <p><strong>Aspirations :</strong> {formatArray(person.aspirations)}</p>
                <p><strong>Valeurs :</strong> {formatArray(person.values)}</p>
                <p><strong>Votes :</strong> {person.votes || 0}</p>
                <button className="mt-2 px-3 py-1 bg-green-500 text-white rounded" onClick={() => handleVote(person.id)}>
                  {t.vote}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border rounded-lg shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Visualisation du réseau</h2>
          <div ref={graphRef} style={{ height: "500px", border: "1px solid #ccc" }} />
        </div>
      </div>
    </div>
  );
}
