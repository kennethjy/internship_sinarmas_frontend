import { useState, useRef } from 'react'
import './App.css'
import { PiFolderPlus, PiListBulletsBold, PiMagnifyingGlassBold, PiTrashBold, PiArrowCircleRightBold } from "react-icons/pi";

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pdf, setPdf] = useState([]);
  const [flowchart, setFlowchart] = useState([]);
  const [pdfPopup, setPdfPopup] = useState(false);
  const [flowchartPopup, setFlowchartPopup] = useState(false);
  const [queryMode, setqueryMode] = useState("normal");
  const apiUrl = import.meta.env.VITE_API_URL;

  
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, 
      { sender: "user", text: formatText(input) },
      { sender: "bot", text: "Generating..." }];
    setMessages(newMessages);
    const inputCopy = input.replace(/\?/g, "%3F");
    setInput("");
    if (queryMode == "normal") {
      var requestURL = apiUrl + "/query-qwen/with_files/" + inputCopy
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
      var requestURL = apiUrl + "/query-qwen/comparison/" + inputCopy
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
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(apiUrl + '/uploadFile', {
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
      const response = await fetch(apiUrl + "/get-file/" + url);
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
  
  const optimizeFilename = (filename) => {
    var filenameArr = filename.split("\\")
    return filenameArr[filenameArr.length - 1]
  };

  const pdfScrollRefs = useRef([]);
  const flowchartScrollRefs = useRef([]);

  const handleScroll = (event, index, refs) => {
    if (refs.current[index]) {
      refs.current[index].scrollLeft += event.deltaY; // Convert vertical scroll to horizontal
    }
  };

  return (
    <>
      <div className='header'>
      </div>
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

        <div className={'popup' + (!pdfPopup ? ' hidden' : '')} onClick={() => setPdfPopup(false)}>
          <div className='popup-content' onClick={(e) => e.stopPropagation()}>
            <div className='popup-header'>
              <h3>Supporting PDFs</h3>
              <div className='smallbtn exit' onClick={() => setPdfPopup(false)}>
                <PiArrowCircleRightBold size={30}/>
              </div>
            </div>
            <div className='files-container'>
              {pdf.map((filename, i) => (
                <div className='file-container' key={i}>
                  <p 
                  ref={(el) => (pdfScrollRefs.current[i] = el)}
                  onWheel={(event) => handleScroll(event, i, pdfScrollRefs)}>
                    {optimizeFilename(filename)}
                  </p>
                  <div className='file-buttons'>
                    <div className='inspect-button' onClick={() => {fetchFile(filename)}}>
                      <PiMagnifyingGlassBold size={30}/>
                    </div>
                    <div className='delete-button' onClick={() => {setPdf(pdf.filter((_, index) => index !== i))}}>
                      <PiTrashBold size={30} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={'popup' + (!flowchartPopup ? ' hidden' : '')}onClick={() => setFlowchartPopup(false)}>
          <div className='popup-content' onClick={(e) => e.stopPropagation()}>
            <div className='popup-header'>
              <h3>Flowchart Files</h3>
              <div className='smallbtn exit' onClick={() => setFlowchartPopup(false)}>
                <PiArrowCircleRightBold size={30}/>
              </div>
            </div>
            <div className='files-container'>
              {flowchart.map((filename, i) => (
                <div className='file-container' key={i}>
                  <p 
                  ref={(el) => (flowchartScrollRefs.current[i] = el)}
                  onWheel={(event) => handleScroll(event, i, flowchartScrollRefs)}>
                    {optimizeFilename(filename)}
                  </p>
                  <div className='file-buttons'>
                    <div className='inspect-button' onClick={() => {fetchFile(filename)}}>
                      <PiMagnifyingGlassBold size={30}/>
                    </div>
                    <div className='delete-button' onClick={() => {setFlowchart(flowchart.filter((_, index) => index !== i))}}>
                      <PiTrashBold size={30} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
