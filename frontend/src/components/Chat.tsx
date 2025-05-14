import { useState, FormEvent, useEffect } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { CardContent } from "./ui/card";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";
import ClickSpark from "./Effects/ClickSpark";

interface Message {
  type: "user" | "bot";
  content: string;
}

interface QAHistoryItem {
  website_url: string;
  question: string;
  answer: string;
  session_id: string;
}

function Chat() {
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<QAHistoryItem[]>([]);
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    if (websiteUrl) {
      setSessionId(uuidv4());
    }
  }, [websiteUrl]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getToken();
        const res = await fetch("https://bbmc1pnnkd.execute-api.us-east-1.amazonaws.com/dev/history", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          mode: "cors",
        });
        const data: QAHistoryItem[] = await res.json();
        setQaHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, [getToken]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);

    setMessages((prev) => [...prev, { type: "user", content: question }]);
    setQuestion("");

    try {
      const token = await getToken();
      const response = await fetch("https://bbmc1pnnkd.execute-api.us-east-1.amazonaws.com/dev/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({ websiteUrl, question, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch answer");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { type: "bot", content: data.answer }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Error: Could not retrieve answer." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId: string) => {
    const token = await getToken();
    const res = await fetch(`https://bbmc1pnnkd.execute-api.us-east-1.amazonaws.com/dev/session/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      mode: "cors",
    });
    const data = await res.json();
    setMessages(
      data
        .map((item: { question: string; answer: string }) => [
          { type: "user", content: item.question },
          { type: "bot", content: item.answer },
        ])
        .flat()
    );
  };

  const handleHistoryClick = async (index: number) => {
    const item = qaHistory[index];
    setWebsiteUrl(item.website_url);
    fetchSessionMessages(item.session_id);
  };

  return (
    <ClickSpark
      sparkColor="#000000"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="pt-20 h-screen w-screen flex md:flex-row sm:flex-col bg-blue-50 overflow-hidden ">
        {/* History Sidebar */}
        <div className="w-[15%] md:w-[23%] h-full bg-slate-200 border-blue-200 flex flex-col rounded-xl top-18 xs:w-[100%] md:sticky">
          <div className="p-4 sticky top-0 bg-slate-300 z-10">
            <h2 className="text-3xl text-center font-extrabold text-blue-900">
              History
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <ul className="space-y-2">
              {qaHistory.map((item, index) => (
                <li
                  key={index}
                  className="bg-blue-100 p-2 rounded-md shadow-sm cursor-pointer hover:bg-blue-200 transition-all duration-200"
                  onClick={() => handleHistoryClick(index)}
                >
                  <p className="truncate">{item.question}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chat Section */}
        <div
          className={`w-[85%] md:w-[77%] h-full pt-2 flex flex-col items-center `}
        >
          {/* Header */}
          <div className="mx-30 rounded-lg">
            <div className="flex flex-row items-center justify-center mb-0">
              <h1 className="mb-2 h-10">
                <span className="text-2xl leading-none flex mt-1">🔗</span>
              </h1>
              <h2 className="text-3xl font-extrabold text-center bg-sky-900 bg-clip-text text-transparent h-14">
                LinkSage
              </h2>
            </div>
            <h2 className="text-center text-lg text-gray-700 mb-0 mt-0">
              Explore any website like never before. Paste a link, ask questions
              in natural language, and get intelligent, contextual answers. Let
              the web speak clearly.
            </h2>
          </div>

          {/* Chat Card */}
          <div className="flex flex-col bg-white rounded-xl mx-auto w-full max-w-3xl h-full shadow-xl mt-2 overflow-hidden">
            {/* URL Input */}
            <CardContent className="pt-5">
              <div className="space-y-1 font-semibold flex ">
                <Label htmlFor="websiteUrl" className="font-extrabold text-xl">
                  Website URL :
                </Label>
                <Input
                  type="text"
                  id="websiteUrl"
                  placeholder="Enter website URL"
                  className="w-[70%] p-3 ml-[5%] m-2 h-8 border border-gray-300 rounded-lg shadow-sm"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                />
              </div>
            </CardContent>

            {/* Scrollable Messages */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 max-w-2xl w-full mx-auto mb-4 flex flex-col">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[80%] ${
                      msg.type === "user" ? "bg-blue-100" : "bg-green-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Fixed Input at Bottom */}
            <form
              onSubmit={handleSubmit}
              className="border-t px-6 py-4 flex gap-2 items-start"
            >
              <Textarea
                id="question"
                placeholder="Ask a question about the website content"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                className="w-full border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="submit"
                variant="elegant"
                className="text-black font-semibold px-6"
                disabled={loading || !websiteUrl}
              >
                {loading ? "Loading..." : "Send"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </ClickSpark>
  );
}

export default Chat;
