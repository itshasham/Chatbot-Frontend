import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import vicAvatar from '../../assets/vic-avatar.png';
import minimizedIcon from '../../assets/chat-icon-minimized.png'; 
import Modal from '../Modal/Modal';
import chatIcon from '../../assets/chat.png';
import userIconImg from '../../assets/user.png';
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasConversationStarted, setHasConversationStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [productNames, setProductNames] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const chatboxRef = useRef(null);

  const supportEmail = 'victor@victorferia.com';
  const fallbackEmailCue = 'refer to the following email';

  const appendSupportEmail = (answer) => {
    if (!answer) return answer;
    const hasEmail = /@/.test(answer);
    if (hasEmail) return answer;
    return answer.toLowerCase().includes(fallbackEmailCue) ? `${answer}: ${supportEmail}` : answer;
  };

  const commonQuestions = [
    'I want to buy products',
    'How long it will take to deliver in my location',
    'Can can call you directly?'
  ];

  // Fetch products on mount
  useEffect(() => {
  console.log("🔄 Fetching products from backend...");
  
  fetch("https://hasistic-vic-chatbot-backend.hf.space/get_products")
    .then(res => {
      console.log("✅ Response received, status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("📦 API Data received:", data);
      
      // Handle different response formats
      let products = [];
      
      if (data.success && data.products) {
        // Expected format: { success: true, products: [...] }
        products = data.products;
      } else if (Array.isArray(data.products)) {
        // Backup: If products exists but success doesn't
        products = data.products;
      } else if (Array.isArray(data)) {
        // Backup: If response is just an array
        products = data;
      }
      
      if (products.length > 0) {
        setProductNames(products);
        console.log("✅ Products set in state:", products.length, "products");
      } else {
        console.error("❌ No products found in response");
      }
    })
    .catch(err => {
      console.error("❌ Error fetching product names:", err);
      console.error("Error message:", err.message);
    });
}, []);

  // Monitor productNames state changes
  useEffect(() => {
    console.log("📋 productNames state updated:", productNames);
    console.log("📊 Total products loaded:", productNames.length);
  }, [productNames]);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleChat = () => setIsOpen(!isOpen);

  const doesQueryContainProduct = (query, products) => {
    console.log("🔍 === Product Match Check ===");
    console.log("🔍 Query:", query);
    console.log("🔍 Products array:", products);
    console.log("🔍 Products count:", products.length);
    
    if (!products || products.length === 0) {
      console.warn("⚠️ No products available to match against!");
      return false;
    }

    const lowerCaseQuery = query.toLowerCase();

    const found = products.some(product => {
      const lowerCaseProduct = product.toLowerCase();
      
      // Check if full product name is in query
      if (lowerCaseQuery.includes(lowerCaseProduct)) {
        console.log("✅ FULL MATCH found:", product);
        return true;
      }
      
      // Check if query is in product name
      if (lowerCaseProduct.includes(lowerCaseQuery)) {
        console.log("✅ PARTIAL MATCH found:", product);
        return true;
      }
      
      // Check individual words (3+ chars)
      const productWords = lowerCaseProduct
        .split(/\s+/)
        .filter(word => word.length >= 3);
      
      const wordMatch = productWords.some(word => 
        lowerCaseQuery.includes(word)
      );
      
      if (wordMatch) {
        console.log("✅ WORD MATCH found:", product);
        return true;
      }
      
      return false;
    });

    console.log("🎯 Final match result:", found);
    console.log("🔍 === End Product Match Check ===");
    return found;
  };

  const handleUserMessage = async (text) => {
    if (!hasConversationStarted) {
      setHasConversationStarted(true);
    }

    const newUserMessage = { sender: 'user', text };
    setMessages(prev => [...prev, newUserMessage]);

    const normalizedText = text.trim().toLowerCase();

    const greetingResponses = ["hi", "hello", "hey", "greetings"];
    const aboutResponses = [
      "who are you", 
      "what can you do", 
      "tell me about yourself", 
      "what do you do"
    ];

    if (greetingResponses.includes(normalizedText)) {
      const botResponse = {
        sender: 'bot',
        text: "Hi, I'm here to help! If you have any product-related questions or need assistance, feel free to ask.",
        showInterestButton: false
      };
      setMessages(prev => [...prev, botResponse]);
      return;
    }

    if (aboutResponses.includes(normalizedText)) {
      const botResponse = {
        sender: 'bot',
        text: "I am Vic your AI live assistant, you can ask me anything. How can I help you today?",
        showInterestButton: false
      };
      setMessages(prev => [...prev, botResponse]);
      return;
    }
    
    setIsTyping(true);

    try {
      const response = await fetch('https://hasistic-vic-chatbot-backend.hf.space/get_answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: text })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      console.log("📝 Checking for product match...");
      console.log("📝 Current productNames in state:", productNames);
      console.log("📝 User query:", text);
      
      const showInterest = doesQueryContainProduct(text, productNames);
      
      console.log("🎯 showInterestButton will be:", showInterest);

      const botResponse = {
        sender: 'bot',
        text: appendSupportEmail(data.answer) || 'Thank you for your question! We will assist you shortly.',
        showInterestButton: showInterest
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error fetching response:', error);

      const botResponse = {
        sender: 'bot',
        text: 'Sorry, I encountered an error while processing your request. Please try again later.',
        showInterestButton: false
      };

      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false); 
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      handleUserMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleCommonQuestionClick = (question) => {
    handleUserMessage(question);
  };

  const handleClose = () => {
    if (messages.length > 0) {
      setShowClearModal(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleConfirmClear = () => {
    setMessages([]);
    setShowClearModal(false);
    setIsOpen(false);
    setHasConversationStarted(false);
    setShowInterestForm(false);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const handleInterestClick = () => {
    setShowInterestForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingForm(true);

    try {
      const response = await fetch('https://hasistic-vic-chatbot-backend.hf.space/save_lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const successMessage = {
        sender: 'bot',
        text: 'Thank you for your interest! Our team will contact you soon.',
        showInterestButton: false
      };
      
      setMessages(prev => [...prev, successMessage]);
      setShowInterestForm(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
      
    } catch (error) {
      console.error('Error submitting form:', error);
      
      const errorMessage = {
        sender: 'bot',
        text: 'Sorry, there was an error submitting your information. Please try again.',
        showInterestButton: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleFormCancel = () => {
    setShowInterestForm(false);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  if (!isOpen) {
    return hasConversationStarted ? (
      <button className="chatbot-minimized-icon" onClick={toggleChat}>
        <img src={minimizedIcon} alt="Open Chat" className="minimized-icon-img" />
        <span className="notification-dot"></span>
      </button>
    ) : (
      <button className="chatbot-cta" onClick={toggleChat}>
        <img src={vicAvatar} alt="Vic Avatar" />
        <span className="cta-text">
            <img src={chatIcon} alt="chat icon" className="cta-icon" />
            <span>Start a conversation</span>
        </span>
      </button>
    );
  }

  const chatWindowClass = `chatbot-window ${isOpen ? 'open' : ''} ${messages.length === 0 ? 'initial' : 'expanded'}`;
  
  return (
    <div className={chatWindowClass}>
      <div className="chatbot-header">
        <div className="header-info">
          <div className="avatar-container">
            <img src={vicAvatar} alt="Vic Avatar" />
            <span className="online-dot"></span>
          </div>
          <span>Vic</span>
        </div>
        <div className="header-actions">
          <button className="header-icon-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          </button>
          <button onClick={toggleChat}>−</button>
          <button onClick={handleClose}>×</button>
        </div>
      </div>

      <div className="chatbot-body" ref={chatboxRef}>
        <div className="message bot">
          <div className="message-bubble">
            <img src={vicAvatar} alt="Vic Avatar" />
            <div className="message-text-content">
              Hi, I am Vic your AI live assistant, you can ask me anything. <br/>How can I help you today?
            </div>
          </div>
        </div>
        
        {messages.length === 0 && (
          <div className="common-questions">
            <p>Common questions are:</p>
            {commonQuestions.map((q, i) => (
              <button key={i} onClick={() => handleCommonQuestionClick(q)}>{q}</button>
            ))}
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.sender === 'bot' && (
              <div className="message-bubble">
                <img src={vicAvatar} alt="Vic Avatar" />
                <div className="message-content">
                  <div className="message-text-content"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                  {msg.showInterestButton && !showInterestForm && (
                    <button className="interest-button" onClick={handleInterestClick}>
                      I'm interested in this product
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {msg.sender === 'user' && (
                <>
                    <div className="user-icon">
                        <img src={userIconImg} alt="user icon" />
                    </div>
                    <div className="message-text"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                </>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="message bot">
            <div className="message-bubble">
              <img src={vicAvatar} alt="Vic Avatar" />
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        {showInterestForm && (
          <div className="interest-form-container">
            <h4>Please provide your details</h4>
            <form onSubmit={handleFormSubmit} className="interest-form">
              <input
                type="text"
                name="name"
                placeholder="Your Name *"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="form-input"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email *"
                value={formData.email}
                onChange={handleFormChange}
                required
                className="form-input"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Your Phone Number *"
                value={formData.phone}
                onChange={handleFormChange}
                required
                className="form-input"
              />
              <textarea
                name="message"
                placeholder="Additional Message (Optional)"
                value={formData.message}
                onChange={handleFormChange}
                rows="3"
                className="form-input form-textarea"
              />
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handleFormCancel}
                  className="form-button form-button-cancel"
                  disabled={isSubmittingForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="form-button form-button-submit"
                  disabled={isSubmittingForm}
                >
                  {isSubmittingForm ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      <div className="chatbot-footer">
          <label htmlFor="chat-input" className={`input-container ${inputValue ? 'active' : ''}`}>
              <input
                  id="chat-input"
                  type="text"
                  placeholder="Tell us how can we help..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={showInterestForm}
              />
              <button onClick={handleSendMessage} disabled={showInterestForm}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"/>
                  </svg>
              </button>
          </label>
      </div>
       <div className="ai-disclaimer">AI can sometimes be inaccurate.</div>
      
      {showClearModal && <Modal onConfirm={handleConfirmClear} onCancel={() => setShowClearModal(false)} />}
    </div>
  );
};

export default Chatbot;