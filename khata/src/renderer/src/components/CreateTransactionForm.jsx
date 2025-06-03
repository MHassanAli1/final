import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urduZones } from './UrduZones';
import './CreateTransactionForm.css';
import UrduKeyboard from './UrduKeyboard';

export default function CreateTransactionForm() {
  const navigate = useNavigate();
  const [zone, setZone] = useState('');
  const [khda, setKhda] = useState('');
  const [starting, setStarting] = useState('');
  const [ending, setEnding] = useState('');
  const [total, setTotal] = useState('');
  const [kulAmdan, setKulAmdan] = useState('');
  const [kulAkhrajat, setKulAkhrajat] = useState('');
  const [saafiAmdan, setSaafiAmdan] = useState('');
  const [exercise, setExercise] = useState('');
  const [kulMaizan, setKulMaizan] = useState('');
  const [date, setDate] = useState('');
  const [akhrajat, setAkhrajat] = useState([]);
  const [lastEnding, setLastEnding] = useState(0);
  
  // Keyboard state
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [inputRefs, setInputRefs] = useState({});
  
  // Create refs for text inputs
  const khdaRef = useRef(null);
  const akhrajatRefs = useRef({});
  
  useEffect(() => {
    window.api.transactions.getLastEndingNumber().then(setLastEnding);
    
    // Initialize refs
    setInputRefs({
      khda: khdaRef,
    });
  }, []);
  
  // Update refs when akhrajat changes
  useEffect(() => {
    // Make sure akhrajatRefs object has a ref for each expense item
    akhrajat.forEach((_, index) => {
      if (!akhrajatRefs.current[`desc-${index}`]) {
        akhrajatRefs.current[`desc-${index}`] = React.createRef();
      }
    });
    
    // Update inputRefs with current akhrajat refs
    const akhrajatInputRefs = {};
    Object.keys(akhrajatRefs.current).forEach(key => {
      if (key.startsWith('desc-')) {
        const index = parseInt(key.replace('desc-', ''), 10);
        if (index < akhrajat.length) { // Only include refs for existing items
          akhrajatInputRefs[`akhrajat-${key}`] = akhrajatRefs.current[key];
        }
      }
    });
    
    setInputRefs(prev => ({
      ...prev,
      ...akhrajatInputRefs
    }));
  }, [akhrajat]);

  // Handle keyboard input
  const handleKeyPress = (char) => {
    if (!activeInput) return;
    
    const inputRef = inputRefs[activeInput];
    if (!inputRef || !inputRef.current) return;
    
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    if (char === 'backspace') {
      if (start === end && start > 0) {
        // Delete character before cursor
        const newValue = input.value.substring(0, start - 1) + input.value.substring(end);
        updateInputValue(activeInput, newValue);
        
        // Update cursor position
        setTimeout(() => {
          input.selectionStart = start - 1;
          input.selectionEnd = start - 1;
        }, 0);
      } else if (start !== end) {
        // Delete selected text
        const newValue = input.value.substring(0, start) + input.value.substring(end);
        updateInputValue(activeInput, newValue);
        
        // Update cursor position
        setTimeout(() => {
          input.selectionStart = start;
          input.selectionEnd = start;
        }, 0);
      }
    } else {
      // Insert character at cursor position
      const newValue = input.value.substring(0, start) + char + input.value.substring(end);
      updateInputValue(activeInput, newValue);
      
      // Update cursor position
      setTimeout(() => {
        input.selectionStart = start + char.length;
        input.selectionEnd = start + char.length;
      }, 0);
    }
  };
  
  // Update input value based on active input
  const updateInputValue = (inputName, value) => {
    if (inputName === 'khda') {
      setKhda(value);
    } else if (inputName.startsWith('akhrajat-desc-')) {
      const index = parseInt(inputName.replace('akhrajat-desc-', ''), 10);
      if (!isNaN(index) && index >= 0 && index < akhrajat.length) {
        updateAkhrajat(index, 'description', value);
      }
    }
  };
  
  // Handle input focus
  const handleInputFocus = (inputName) => {
    setActiveInput(inputName);
    setShowKeyboard(true);
  };
  
  // Close keyboard
  const closeKeyboard = () => {
    setShowKeyboard(false);
    setActiveInput(null);
  };

  const addAkhrajat = () => {
    setAkhrajat([...akhrajat, { description: '', amount: '' }]);
  };

  const updateAkhrajat = (index, field, value) => {
    setAkhrajat((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeAkhrajat = (index) => {
    setAkhrajat((prev) => prev.filter((_, i) => i !== index));
    
    // Clean up refs for removed items
    const newAkhrajatRefs = { ...akhrajatRefs.current };
    delete newAkhrajatRefs[`desc-${index}`];
    
    // Reassign indices for refs after the removed item
    for (let i = index + 1; i < akhrajat.length; i++) {
      if (newAkhrajatRefs[`desc-${i}`]) {
        newAkhrajatRefs[`desc-${i-1}`] = newAkhrajatRefs[`desc-${i}`];
        delete newAkhrajatRefs[`desc-${i}`];
      }
    }
    
    akhrajatRefs.current = newAkhrajatRefs;
  };

  const handleReturn = () => {
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await window.api.auth.getSession();
    try {
      console.log("Creating transaction for user ID:", user?.id);
      if (!user?.id) {
        alert("User not found. Please log in again.");
        return;
      }      
      const result = await window.api.transactions.create({
        userID: user.id,
        ZoneName: zone,
        KhdaName: khda,
        StartingNum: starting,
        EndingNum: ending,
        total,
        KulAmdan: BigInt(kulAmdan || 0),
        KulAkhrajat: BigInt(kulAkhrajat || 0),
        SaafiAmdan: BigInt(saafiAmdan || 0),
        Exercise: BigInt(exercise || 0),
        KulMaizan: BigInt(kulMaizan || 0),
        date,
        akhrajat,
      });
      alert("معاملہ کامیابی سے محفوظ ہو گیا!");
      // Reset form if needed
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <button 
          type="button" 
          className="return-btn"
          onClick={handleReturn}
        >
          ⬅️ واپس جائیں
        </button>
        <h2>نیا ٹرانزیکشن شامل کریں</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="last-ending-display">
          آخری اختتامی نمبر: <strong>{lastEnding.toString()}</strong>
        </div>

        <div className="form-section">
          <label htmlFor="date">تاریخ منتخب کریں:</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
          />

          <label htmlFor="zone">زون منتخب کریں:</label>
          <select 
            id="zone"
            value={zone} 
            onChange={(e) => setZone(e.target.value)}
            className="form-select"
          >
            <option value="">-- منتخب کریں --</option>
            {urduZones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>

          <label htmlFor="khda">کھدہ کا نام:</label>
          <input 
            id="khda"
            className="form-input"
            placeholder="کھدہ کا نام" 
            value={khda} 
            onChange={(e) => setKhda(e.target.value)}
            onFocus={() => handleInputFocus('khda')}
            ref={khdaRef}
          />

          <label htmlFor="starting">ابتدائی نمبر:</label>
          <input 
            id="starting"
            className="form-input"
            placeholder="ابتدائی نمبر" 
            value={starting} 
            onChange={(e) => setStarting(e.target.value)} 
          />

          <label htmlFor="ending">اختتامی نمبر:</label>
          <input 
            id="ending"
            className="form-input"
            placeholder="اختتامی نمبر" 
            value={ending} 
            onChange={(e) => setEnding(e.target.value)} 
          />

          <label htmlFor="total">کل ٹرالیاں:</label>
          <input 
            id="total"
            className="form-input"
            placeholder="کل ٹرالیاں" 
            value={total} 
            onChange={(e) => setTotal(e.target.value)} 
          />
        </div>

        <hr className="section-divider" />

        <div className="form-section">
          <h4 className="section-title">مالی تفصیلات</h4>
          
          <label htmlFor="kulAmdan">کل آمدن:</label>
          <input 
            id="kulAmdan"
            className="form-input"
            type="number"
            placeholder="کل آمدن" 
            value={kulAmdan} 
            onChange={(e) => setKulAmdan(e.target.value)} 
          />

          <label htmlFor="kulAkhrajat">کل اخراجات:</label>
          <input 
            id="kulAkhrajat"
            className="form-input"
            type="number"
            placeholder="کل اخراجات" 
            value={kulAkhrajat} 
            onChange={(e) => setKulAkhrajat(e.target.value)} 
          />

          <label htmlFor="saafiAmdan">صافی آمدن:</label>
          <input 
            id="saafiAmdan"
            className="form-input"
            type="number"
            placeholder="صافی آمدن" 
            value={saafiAmdan} 
            onChange={(e) => setSaafiAmdan(e.target.value)} 
          />

          <label htmlFor="exercise">ایکسایز:</label>
          <input 
            id="exercise"
            className="form-input"
            type="number"
            placeholder="ایکسایز" 
            value={exercise} 
            onChange={(e) => setExercise(e.target.value)} 
          />

          <label htmlFor="kulMaizan">کل میزان:</label>
          <input 
            id="kulMaizan"
            className="form-input"
            type="number"
            placeholder="کل میزان" 
            value={kulMaizan} 
            onChange={(e) => setKulMaizan(e.target.value)} 
          />
        </div>

        <hr className="section-divider" />

        <div className="form-section">
          <h4 className="section-title">اخراجات کی تفصیل</h4>
          
          <div className="akhrajat-container">
            {akhrajat.map((item, index) => (
              <div key={index} className="akhrajat-item">
                <div className="akhrajat-inputs">
                  <input
                    className={`form-input akhrajat-description ${activeInput === `akhrajat-desc-${index}` ? 'active-input' : ''}`}
                    placeholder="تفصیل"
                    value={item.description}
                    onChange={(e) => updateAkhrajat(index, 'description', e.target.value)}
                    onFocus={() => handleInputFocus(`akhrajat-desc-${index}`)}
                    ref={(el) => {
                      akhrajatRefs.current[`desc-${index}`] = { current: el };
                    }}
                  />
                  <input
                    className="form-input akhrajat-amount"
                    placeholder="رقم"
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateAkhrajat(index, 'amount', e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  className="remove-btn"
                  onClick={() => removeAkhrajat(index)}
                  aria-label="Remove expense"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="add-btn"
            onClick={addAkhrajat}
          >
            ➕ اخراج شامل کریں
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            محفوظ کریں
          </button>
        </div>
      </form>
      
      {/* Add keyboard toggle button */}
      <button 
        type="button"
        className="keyboard-toggle"
        onClick={() => setShowKeyboard(!showKeyboard)}
        aria-label="Toggle Urdu Keyboard"
      >
        ⌨️
      </button>
      
      {/* Render the Urdu keyboard when needed */}
      {showKeyboard && (
        <UrduKeyboard 
          onKeyPress={handleKeyPress} 
          onClose={closeKeyboard} 
        />
      )}
    </div>
  );
}