import { useState, useEffect, FormEvent } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import { useAuth } from "@clerk/clerk-react";
import { Loader2, FileText, History } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import DownloadButton from "./UIverse/DownloadButton";
import { FaDownload } from "react-icons/fa6";
import ClickSpark from "./Effects/ClickSpark";

function DocScanner() {
  const [docFile, setDocFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const { getToken } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setDocFile(e.target.files[0]);
  };

  const fetchHistory = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        "https://bbmc1pnnkd.execute-api.us-east-1.amazonaws.com/dev/scan/history",
        {
          headers: { Authorization: `Bearer ${token}` },
          mode: "cors",
        }
      );
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleScan = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setScanResult("");

    try {
      const token = await getToken();
      const formData = new FormData();
      if (docFile) formData.append("document", docFile);

      const res = await fetch(
        "https://bbmc1pnnkd.execute-api.us-east-1.amazonaws.com/dev/scan",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          mode: "cors",
        },
      );

      if (!res.ok) throw new Error("Scan failed");

      const data = await res.json();
      setScanResult(data.result || data.summary || "No summary returned.");
      fetchHistory();
    } catch (err) {
      console.error("Error during scan", err);
      setScanResult("Error: Could not process document.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `https://bbmc1pnnkd.execute-api.us-east-1.amazonaws.com/dev/documents/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          mode: "cors",
        },
      );

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Force .md extension
      const name = filename.endsWith(".md")
        ? filename
        : `${filename}_summary.md`;
      link.download = name;

      link.click();
      URL.revokeObjectURL(url); // Clean up the blob URL
    } catch (err) {
      console.error("Download error", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <ClickSpark
      sparkColor="#000000"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="min-h-screen min-w-screen w-full bg-blue-50 py-20 px-4 pt-29 mt-0 md:px-10">
        <div className="mx-40 rounded-lg">
          <div className="flex flex-row items-center justify-center mb-4">
            <h1 className="mb-2">📃</h1>
            <h2 className="text-5xl font-extrabold text-center bg-sky-900 bg-clip-text text-transparent h-14">
              Doc Scanner
            </h2>
          </div>
          <h2 className="text-center text-lg  text-gray-700 mb-4">
            Doc Scanner instantly reads your uploaded document, understands the
            content, and gives you a smart, concise summary. It's like having an
            AI that reads and explains your files in seconds.
          </h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Scanner Panel */}
          <Card className="flex-1 shadow-lg border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <FileText className="w-5 h-5 text-blue-500" />
                Upload & Summarize
              </CardTitle>
              <CardDescription>
                Upload PDF, DOCX, or TXT files for instant summarization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="space-y-4">
                <div>
                  <Label htmlFor="docFile">Choose a document</Label>
                  <Input
                    id="docFile"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                {/* <DownloadButton 
                type="submit"
                className="bg-blue-500 text-black border-1  hover:bg-gradient-to-br from-blue-500 to-blue-100"
                disabled={loading}
                variant='elegant'
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Summarizing...
                  </>
                ) : (
                  "Scan Document"
                )}
              </DownloadButton> */}
                {!loading ? (
                  <DownloadButton
                    type="submit"
                    className="bg-blue-500 text-black border-1  hover:bg-gradient-to-br from-blue-500 to-blue-100"
                  ></DownloadButton>
                ) : (
                  <Button
                    disabled
                    className="bg-gray-900 h-10 text-white cursor-not-allowed rounded-2xl"
                  >
                    <Loader2 className="animate-spin w-4 h-8 mr-2" />
                    Summarizing...
                  </Button>
                )}
              </form>

              {scanResult && (
                <div className="mt-6">
                  <Label>Summary Result</Label>
                  <div className="min-h-[100px] p-3 mt-1 bg-gray-100 rounded-2xl border text-sm">
                    {scanResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Panel */}
          <Card className="lg:w-1/3 shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <History className="w-5 h-5 text-gray-700" />
                Your Summaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No history yet.
                  </p>
                ) : (
                  history.map((entry, idx) => (
                    <div key={idx} className="mb-4">
                      <p className="text-sm font-medium">{entry.filename}</p>
                      {/* <p className="text-xs text-muted-foreground truncate break-words whitespace-normal">
                      {entry.summary}
                    </p> */}
                      <Button
                        onClick={() => handleDownload(entry.id, entry.filename)}
                        className="mt-2 font-extrabold text-sm"
                        variant="elegant"
                      >
                        <FaDownload className="mr-2" />
                        Download
                      </Button>

                      <Separator className="my-2" />
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClickSpark>
  );
}

export default DocScanner;
