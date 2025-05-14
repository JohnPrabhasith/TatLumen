import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import MDEditor from "@uiw/react-md-editor";
import Download from "./ChatComponents/Download";
import ClickSpark from "./Effects/ClickSpark";

export default function Culprit() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState("");
  const [error, setError] = useState("");

  const handleGenerateArticle = async () => {
    if (!topic) {
      setError("Please provide a topic.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://bbmc1pnnkd.execute-api.us-east-1.amazonaws.com/dev/culprit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        mode: "cors",
      });

      const data = await response.json();
      setArticle(data.article);
    } catch (error) {
      setArticle("❌ Error generating article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClickSpark
      sparkColor="#000000"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-gray-100 px-6 py-25 md:px-12">
        {/* Left Panel */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-start space-y-8 mb-8 md:mb-0">
          <div className="mx-0 rounded-lg">
            <div className="flex flex-row items-center justify-center mb-4 mt-5">
              <span className="text-8xl">🧠</span>
              <h2 className="text-5xl font-extrabold text-center bg-sky-900 bg-clip-text text-transparent">
                Culprit AI Writer
              </h2>
            </div>
            <h2 className="text-lg text-center text-gray-700 mb-0">
              Culprit AI is an intelligent article generator that uses multiple
              AI agents to research, verify, and write content on any topic you
              give. It turns your input into a well-structured, fact-checked
              article in seconds.
            </h2>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 text-center"></h1>

          <div className="w-full space-y-2">
            <Label
              htmlFor="topic"
              className="text-4xl font-extrabold text-gray-700"
            >
              Enter a Topic
            </Label>
            <Input
              id="topic"
              placeholder="e.g., Climate Change"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
            />

            <Button
              onClick={handleGenerateArticle}
              disabled={loading || !topic}
              className="w-full py-3 hover:scale-105 bg-gradient-to-r from-sky-900 to-lime-300 text-white hover:text-black text-lg rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Generating..." : "Generate Article"}
            </Button>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {article && (
              <div className="hover:scale-105 transition duration-300 ease-in-out">
                <Download content={article} />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-2/3 pl-0 md:pl-8">
          <Label className="text-lg font-extrabold text-gray-700">
            Markdown Editor
          </Label>
          <div
            className="mt-4 bg-white p-4 rounded-lg shadow-md"
            data-color-mode="light"
          >
            <MDEditor
              value={article}
              onChange={(value) => setArticle(value || "")}
              height={600}
            />
          </div>
        </div>
      </div>
    </ClickSpark>
  );
}
