import { useState, useRef } from 'react'
import './App.css'
import { PiFolderPlus, PiListBulletsBold, PiMagnifyingGlassBold, PiTrashBold } from "react-icons/pi";

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pdf, setPdf] = useState([]);
  const [flowchart, setFlowchart] = useState([]);
  const [pdfPopup, setPdfPopup] = useState(false);
  const [flowchartPopup, setFlowchartPopup] = useState(false);
  const [queryMode, setqueryMode] = useState("normal");

  
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, 
      { sender: "user", text: formatText(input) },
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
  
  const fetchFile = async(url) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/get-file/" + url);
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      window.open(URL.createObjectURL(blob)); // Convert Blob to a URL
    } catch (error) {
      console.error("Image fetch error:", error);
    }
  }
  
  const pdfRef = useRef(null); // Create a ref for the file input
  
  const handlePdfClick = () => {
    pdfRef.current.click(); // Trigger file input click event
  };

  const flowchartRef = useRef(null); // Create a ref for the file input
  
  const handleFlowcartClick = () => {
    flowchartRef.current.click(); // Trigger file input click event
  };
  

  return (
    <div className='app-container'>
      <div className='message-container'>
        <div className='messages'>
          {messages.map((m) => (
            <div className= {'message ' + m.sender}>
              <div className='messageBody'>{m.text}</div>
            </div>
          ))}
        </div>
        <div className='message-input'>
          <textarea value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder='Enter your prompt here...'
          rows="1"></textarea>
        </div>
      </div>

      <div className='footer'>
        <div className='upload-container'>
          <h3>{"Insert Flowchart File(s)"}</h3>
          <div className='upload-buttons'>
            <div className='smallbtn upload' onClick={()=>{setFlowchartPopup(true)}}>
              <PiListBulletsBold size={30}/>
            </div>
            <div className='smallbtn' onClick={() => {handleFlowcartClick()}}>
              <PiFolderPlus
              size={30} />
              <input 
              type='file' 
              accept='image/*' 
              onChange={(e) => {
                uploadFile(e.target.files[0], flowchart, setFlowchart);
                if (flowchartRef.current) {
                  flowchartRef.current.value = null; // ✅ Reset input
                }
              }} 
              ref={flowchartRef}
              />
            </div>
          </div>
          <p>{flowchart.length} Files Uploaded</p>
        </div>
        <div className='upload-container'>
          <h3>{"Insert Supporting PDF(s)"}</h3>
          <div className='upload-buttons'>
            <div className='smallbtn upload' onClick={()=>{setPdfPopup(true)}}>
              <PiListBulletsBold size={30}/>
            </div>
            <div className='smallbtn' onClick={() => {handlePdfClick()}}>
              <PiFolderPlus
              size={30} />
              <input 
              type='file' 
              accept='application/pdf' 
              onChange={(e) => {
                uploadFile(e.target.files[0], pdf, setPdf);
                pdfRef.current.value = "";
              }} 
              ref={pdfRef}
              />
            </div>
          </div>
          <p>{pdf.length} Files Uploaded</p>
        </div>
        <div className='mode-select'>
          <div className='mode-option' onClick={() => {setqueryMode('normal')}}>
            <div className='mode-outline'> <div className={queryMode == 'normal' ? 'mode-fill active' : 'mode-fill'}></div> </div>
            <h3>Normal Mode</h3>
          </div>
          <div className='mode-option' onClick={() => {setqueryMode('comparison')}}>
            <div className='mode-outline'> <div className={queryMode == 'comparison' ? 'mode-fill active' : 'mode-fill'}></div></div>
            <h3>Comparison Mode</h3>
          </div>
        </div>
        <div className='sendbtn' onClick={handleSend}>
          <h2>Submit</h2>
        </div>
      </div>

      <div className={'popup' + (!pdfPopup ? ' hidden' : '')}>
        <div className='popup-content'>
          <h3>Upload PDF</h3>
          <p>PDFs:</p>
            {pdf.map((filename, i) => (
              <div className='file-container'>
                <p>{i+1}. {filename}</p>
                <div className='inspect-button' onClick={() => {fetchFile(filename)}}>
                  <PiMagnifyingGlassBold size={30}/>
                </div>
                <div className='delete-button' onClick={() => {setPdf(pdf.filter((_, index) => index !== i))}}>
                  <PiTrashBold size={30} />
                </div>
              </div>
            ))}
          <button onClick={() => setPdfPopup(false)}>Close</button>
        </div>
      </div>

      <div className={'popup' + (!flowchartPopup ? ' hidden' : '')}>
        <div className='popup-content'>
          <h3>Upload Flowchart</h3>
          <p>Flowcharts:</p>
          <ol>
            {flowchart.map((filename, i) => (
              <div className='file-container'>
                <p>{i+1}. {filename}</p>
                <div className='inspect-button' onClick={() => {fetchFile(filename)}}>
                  <PiMagnifyingGlassBold size={30}/>
                </div>
                <div className='delete-button' onClick={() => {setFlowchart(flowchart.filter((_, index) => index !== i))}}>
                  <PiTrashBold size={30} />
                </div>
              </div>
            ))}
          </ol>
          <button onClick={() => setFlowchartPopup(false)}>Close</button>
        </div>
      </div>

    </div>
  )
}

export default App
