import { useState, useEffect } from "react";
import "./TransactionDetails.css";

export default function TransactionDetails({ transaction, onClose }) {
  const [starting, setStarting] = useState(0n);
  const [ending, setEnding] = useState(0n);
  const [total, setTotal] = useState(0);
  const [akhrajatList, setAkhrajatList] = useState([]);
  const [newAkhrajat, setNewAkhrajat] = useState({ description: "", amount: 0 });

  useEffect(() => {
    const trolly = transaction.trollies?.[0];
    if (trolly) {
      setStarting(BigInt(trolly.StartingNum || 0));
      setEnding(BigInt(trolly.EndingNum || 0));
      setTotal(trolly.total || 0);
    }

    setAkhrajatList(transaction.akhrajat || []);
  }, [transaction]);

  const handleSaveTrolly = async () => {
    await window.api.trollies.update({
      id: transaction.trollies[0]?.id,
      startNumber: starting,
      endNumber: ending,
      total,
    });

    onClose(); // optionally close the modal

    // Reload the page after 10 seconds
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleAkhrajatUpdate = async (index, updated) => {
    const item = akhrajatList[index];
    const updatedItem = await window.api.akhrajat.update({
      id: item.id,
      ...updated,
    });

    const updatedList = [...akhrajatList];
    updatedList[index] = updatedItem;
    setAkhrajatList(updatedList);
  };

  const handleAkhrajatDelete = async (id) => {
    await window.api.akhrajat.delete(id);
    setAkhrajatList(akhrajatList.filter((item) => item.id !== id));
  };

  const handleNewAkhrajatAdd = async () => {
    if (!newAkhrajat.description.trim()) return alert("تفصیل درج کریں");
    const created = await window.api.akhrajat.create({
      ...newAkhrajat,
      transactionId: transaction.id,
    });
    setAkhrajatList([...akhrajatList, created]);
    setNewAkhrajat({ description: "", amount: 0 });
  };

  return (
    <div className="transaction-details">
      <div className="akhrajat-section">
        <h4>اخراجات</h4>
        {akhrajatList.map((item, index) => (
          <div key={item.id} className="akhrajat-item">
            <input
              type="text"
              defaultValue={item.description}
              onBlur={(e) =>
                handleAkhrajatUpdate(index, { description: e.target.value })
              }
            />
            <input
              type="number"
              defaultValue={item.amount}
              onBlur={(e) =>
                handleAkhrajatUpdate(index, { amount: Number(e.target.value) })
              }
            />
            <button onClick={() => handleAkhrajatDelete(item.id)}>❌</button>
          </div>
        ))}
        <div className="new-akhrajat-form">
          <input
            type="text"
            placeholder="نیا خرچ"
            value={newAkhrajat.description}
            onChange={(e) =>
              setNewAkhrajat({ ...newAkhrajat, description: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="رقم"
            value={newAkhrajat.amount}
            onChange={(e) =>
              setNewAkhrajat({ ...newAkhrajat, amount: Number(e.target.value) })
            }
          />
          <button onClick={handleNewAkhrajatAdd}>➕ شامل کریں</button>
        </div>
      </div>

      <div className="trolly-section">
        <h4>ٹرولیاں</h4>
        <div className="trolly-form">
          <div className="trolly-field">
            <label>ابتدائی نمبر:</label>
            <input
              type="number"
              value={starting.toString()}
              onChange={(e) => setStarting(BigInt(e.target.value))}
            />
          </div>
          <div className="trolly-field">
            <label>اختتامی نمبر:</label>
            <input
              type="number"
              value={ending.toString()}
              onChange={(e) => setEnding(BigInt(e.target.value))}
            />
          </div>
          <div className="trolly-field">
            <label>کل ٹرالیاں:</label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
            />
          </div>
        </div>
        <button
          onClick={handleSaveTrolly}
          className="save-trolly-btn"
        >
          محفوظ کریں (صفحہ 1 سیکنڈ بعد ریفریش ہوگا)
        </button>
      </div>

      <button onClick={onClose} className="close-btn">
        بند کریں
      </button>
    </div>
  );
}