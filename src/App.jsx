import { useState } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pdf, setPdf] = useState([]);
  const [flowchart, setFlowchart] = useState([]);
  const [pdfPopup, setPdfPopup] = useState(false);
  const [queryMode, setqueryMode] = useState("regular");

  
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, 
      { sender: "user", text: input },
      { sender: "bot", text: "Generating..." }];
    setMessages(newMessages);
    const inputCopy = input.replace(/\?/g, "%3F");
    setInput("");
    if (queryMode == "regular") {
      var requestURL = "http://127.0.0.1:8000/query-qwen/with_files/" + inputCopy
      if (pdf) {
        requestURL += '?pdfPath=' + pdf
      }
      if (flowchart) {
        if (pdf) {
          requestURL += '&'
        } else {
          requestURL += '?'
        }
        requestURL += 'flowchartPath=' + flowchart;
      }
    } else {
      var requestURL = "http://127.0.0.1:8000/query-qwen/comparison/" + inputCopy
      if (pdf) {
        requestURL += '?pdfPaths=' + pdf
      }
      if (flowchart) {
        if (pdf) {
          requestURL += '&'
        } else {
          requestURL += '?'
        }
        requestURL += 'flowchartPaths=' + flowchart;
      }
    }
    
    const response = await fetch(requestURL);
    const result = await response.json();
    setMessages([


      ...(newMessages.slice(0, newMessages.length - 1)),
      {
        sender: "bot",
        text: formatText(result.response)
      },
    ]);
  };

  const uploadFile = async (file, fileArr, setFile) => {
    console.log(fileArr);
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/uploadFile', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setFile([...fileArr, result]);
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  const formatText = (text) => {
    if (typeof text !== 'string') return text;
    return text.split('\n').map((line, index) => {
      let Element = 'p'; // Default to paragraph
  
      if (line.startsWith('###')) {
        Element = 'h2';
        line = line.slice(3).trim(); // Remove ###
      }
  
      // Define formatting rules (easily extendable)
      const formatRules = [
        {
          regex: /\*\*(.*?)\*\*/g, // Bold (**text**)
          replace: (part, i) => <b key={i}>{part}</b>,
        },
        {
          regex: /\*(.*?)\*/g, // Italic (*text*)
          replace: (part, i) => <i key={i}>{part}</i>,
        },
        {
          regex: /__(.*?)__/g, // Underline (__text__)
          replace: (part, i) => <u key={i}>{part}</u>,
        },
      ];
  
      // Apply formatting rules
      let formattedContent = [line];
      formatRules.forEach(({ regex, replace }) => {
        formattedContent = formattedContent.flatMap((segment) =>
          typeof segment === 'string'
            ? segment.split(regex).map((part, i) => (i % 2 ? replace(part, i) : part))
            : segment
        );
      });
  
      return <Element>{formattedContent}</Element>;
    });
  };
  
  

  return (
    <div className='app-container'>
      <div className='message-container'>
        <div className='messages'>
          {messages.map((m, index) => (
            <div className= {'message ' + m.sender}>
            <h2>{m.sender}</h2>
              <div className='messageBody'>{m.text}</div>
            </div>
          ))}
        </div>
        <div className='message-input'>
          <input type='text' value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}>
          </input>
        </div>
        
      </div>
      <div className='footer'>
        <div className='uploadbtn' onClick={() => {queryMode == "regular" ? setqueryMode("comparison") : setqueryMode("regular")}}>MODE</div>
        <div className='uploadbtn pdf' onClick={()=>{setPdfPopup(true)}}>Files</div>
        <div className='sendbtn' onClick={handleSend}>SEND</div>
      </div>

      <div className={'popup' + (!pdfPopup ? ' hidden' : '')}>
        <div className='popup-content'>
          <h3>Upload PDF</h3>
          <input type='file' accept='application/pdf' onChange={(e) => uploadFile(e.target.files[0], pdf, setPdf)} />
          <p>PDFs:</p>
          <ol>
            {pdf.map((filename, i) => (
              <li>{filename}</li>
            ))}
          </ol>
          <br />
          <h3>Upload Flowchart</h3>
          <input type='file' accept='image/*' onChange={(e) => uploadFile(e.target.files[0], flowchart, setFlowchart)} />
          <p>Flowcharts:</p>
          <ol>
            {flowchart.map((filename, i) => (
              <li>{filename}</li>
            ))}
          </ol>
          <button onClick={() => setPdfPopup(false)}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default App
