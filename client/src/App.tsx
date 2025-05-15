import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const sendMessage = async () => {
    setStatus("Sending...");
    try {
      const response = await fetch("http://localhost:3000/receivemessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      console.log(response);
      if (response.ok) {
        setStatus("Message sent successfully!");
      } else {
        const data = await response.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setStatus("Failed to send message.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Send a Message</h1>
        <textarea
          className="w-full border border-gray-300 rounded p-2 mb-4 resize-none"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
        {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  );
}

export default App;
