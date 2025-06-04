import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TransactionDashboard.css";
import TransactionDetails from "./TransactionDetails";
import { urduZones } from "./UrduZones";
import UrduKeyboard from "./UrduKeyboard"; // Import UrduKeyboard component
import { LogoutButton } from "./logout";
import SyncButton from "./syncButton";

function TransactionDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editRows, setEditRows] = useState({});
  const [editConfirmId, setEditConfirmId] = useState(null);
  const [filterZone, setFilterZone] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const navigate = useNavigate();

  // Keyboard state
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  // References for text input fields
  const inputRefs = useRef({});

  useEffect(() => {
    window.api.transactions.getAll().then(setTransactions);
  }, []);

  // Handle keyboard input
  const handleKeyPress = (char) => {
    if (!activeInput) return;

    // For editing cells
    if (activeInput.startsWith('edit-')) {
      const [_, txnId, field] = activeInput.split('-');

      if (char === 'backspace') {
        setEditRows(prev => {
          const currentValue = prev[txnId][field] || '';
          return {
            ...prev,
            [txnId]: {
              ...prev[txnId],
              [field]: currentValue.slice(0, -1)
            }
          };
        });
      } else {
        setEditRows(prev => ({
          ...prev,
          [txnId]: {
            ...prev[txnId],
            [field]: (prev[txnId][field] || '') + char
          }
        }));
      }
    }
  };

  // Handle input focus
  const handleInputFocus = (inputId) => {
    setActiveInput(inputId);
    setShowKeyboard(true);
  };

  // Close keyboard
  const closeKeyboard = () => {
    setShowKeyboard(false);
    setActiveInput(null);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleNavigation = (route) => {
    navigate(route);
  };

  // Filter transactions first
  const filteredTransactions = transactions.filter((txn) => {
    const matchesZone =
      !filterZone ||
      txn.ZoneName.toLowerCase().includes(filterZone.toLowerCase());

    // Improved date filtering logic
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const txnDate = txn.date ? new Date(txn.date) : null;

      if (txnDate) {
        // Set time to start of day for consistent comparison
        const txnDateOnly = new Date(txnDate.getFullYear(), txnDate.getMonth(), txnDate.getDate());

        if (filterStartDate) {
          const startDate = new Date(filterStartDate);
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (txnDateOnly < startDateOnly) {
            matchesDate = false;
          }
        }

        if (filterEndDate && matchesDate) {
          const endDate = new Date(filterEndDate);
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          if (txnDateOnly > endDateOnly) {
            matchesDate = false;
          }
        }
      } else {
        // If transaction has no date and date filters are applied, exclude it
        matchesDate = false;
      }
    }

    return matchesZone && matchesDate;
  });

  // Calculate totals based on FILTERED transactions only
  const totalByZone = filteredTransactions.reduce((acc, t) => {
    acc[t.ZoneName] = acc[t.ZoneName] || {
      KulAmdan: 0n,
      KulAkhrajat: 0n,
      SaafiAmdan: 0n,
      Exercise: 0n,
      KulMaizan: 0n,
    };
    acc[t.ZoneName].KulAmdan += BigInt(t.KulAmdan);
    acc[t.ZoneName].KulAkhrajat += BigInt(t.KulAkhrajat);
    acc[t.ZoneName].SaafiAmdan += BigInt(t.SaafiAmdan);
    acc[t.ZoneName].Exercise += BigInt(t.Exercise || 0);
    acc[t.ZoneName].KulMaizan += BigInt(t.KulMaizan || 0);
    return acc;
  }, {});

  return (
    <div className="transaction-dashboard">
      <div className="navigation-header">
        <button
          className="nav-button form-button"
          onClick={() => handleNavigation('/CreateTransactionForm')}
        >
          📝 فارم
        </button>
        <h2>ٹرانزیکشن ڈیش بورڈ</h2>
        <button
          className="nav-button report-button"
          onClick={() => handleNavigation('/report')}
        >
          📊 اعداد و شمار
        </button>
      </div>

      <div className="filters">
        <label>
          زون منتخب کریں:
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="filter-select"
          >
            <option value="">-- تمام زون --</option>
            {urduZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>

        <label>
          شروع تاریخ:
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </label>

        <label>
          آخری تاریخ:
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </label>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>زون</th>
              <th>کھدہ</th>
              <th>کل آمدن</th>
              <th>کل اخراجات</th>
              <th>صافی آمدن</th>
              <th>ایکسایز</th>
              <th>کل میزان</th>
              <th>تفصیل / حذف</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn) => {
              const isEditing = editRows[txn.id];
              const edited = editRows[txn.id] || {};

              return (
                <tr key={txn.id} className={isEditing ? 'editing-row' : ''}>
                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        className="edit-input"
                        value={
                          edited.date
                            ? typeof edited.date === "string"
                              ? edited.date
                              : new Date(edited.date).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, date: e.target.value },
                          }))
                        }
                      />
                    ) : txn.date ? (
                      typeof txn.date === "string" ? (
                        txn.date
                      ) : (
                        new Date(txn.date).toLocaleDateString()
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className={`edit-input ${activeInput === `edit-${txn.id}-ZoneName` ? 'active-input' : ''}`}
                        value={edited.ZoneName || txn.ZoneName}
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, ZoneName: e.target.value },
                          }))
                        }
                        onFocus={() => handleInputFocus(`edit-${txn.id}-ZoneName`)}
                        ref={(el) => (inputRefs.current[`edit-${txn.id}-ZoneName`] = el)}
                      />
                    ) : (
                      txn.ZoneName
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className={`edit-input ${activeInput === `edit-${txn.id}-KhdaName` ? 'active-input' : ''}`}
                        value={edited.KhdaName || txn.KhdaName}
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, KhdaName: e.target.value },
                          }))
                        }
                        onFocus={() => handleInputFocus(`edit-${txn.id}-KhdaName`)}
                        ref={(el) => (inputRefs.current[`edit-${txn.id}-KhdaName`] = el)}
                      />
                    ) : (
                      txn.KhdaName
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="edit-input"
                        value={edited.KulAmdan || txn.KulAmdan}
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, KulAmdan: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      txn.KulAmdan.toString()
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="edit-input"
                        value={edited.KulAkhrajat || txn.KulAkhrajat}
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, KulAkhrajat: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      txn.KulAkhrajat.toString()
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="edit-input"
                        value={edited.SaafiAmdan || txn.SaafiAmdan}
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, SaafiAmdan: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      txn.SaafiAmdan.toString()
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="edit-input"
                        value={edited.Exercise || txn.Exercise || 0}
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, Exercise: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      txn.Exercise?.toString() || "0"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="edit-input"
                        value={edited.KulMaizan || txn.KulMaizan || 0}
                        onChange={(e) =>
                          setEditRows((prev) => ({
                            ...prev,
                            [txn.id]: { ...edited, KulMaizan: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      txn.KulMaizan?.toString() || "0"
                    )}
                  </td>

                  <td>
                    <div className="action-buttons">
                      {isEditing ? (
                        <>
                          <button
                            className="save-button"
                            onClick={() => setEditConfirmId(txn.id)}
                          >
                            ✅ محفوظ کریں
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() =>
                              setEditRows((prev) => {
                                const updated = { ...prev };
                                delete updated[txn.id];
                                return updated;
                              })
                            }
                          >
                            ❌ منسوخ کریں
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="edit-button"
                            onClick={() =>
                              setEditRows((prev) => ({
                                ...prev,
                                [txn.id]: { ...txn },
                              }))
                            }
                          >
                             ترمیم
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => setPendingDelete(txn.id)}
                          >
                             حذف
                          </button>
                          <button
                            className="details-button"
                            onClick={() => toggleExpand(txn.id)}
                          >
                            {expandedId === txn.id ? "🔼 بند کریں" : "🔽 مزید دیکھیں"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {expandedId && (
        <TransactionDetails
          transaction={transactions.find((t) => t.id === expandedId)}
          onClose={() => setExpandedId(null)}
        />
      )}

      <hr />
      <div className="zone-summary">
        <h3>📈 زون کا خلاصہ</h3>
        {Object.keys(totalByZone).length > 0 ? (
          <div className="summary-grid">
            {Object.entries(totalByZone).map(([zone, totals]) => (
              <div key={zone} className="zone-card">
                <div className="zone-header">
                  <strong> {zone}</strong>
                </div>
                <div className="zone-stats">
                  <div className="stat-item">
                    <span className="stat-label"> آمدن:</span>
                    <span className="stat-value">{totals.KulAmdan.toString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">اخراجات:</span>
                    <span className="stat-value">{totals.KulAkhrajat.toString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label"> صافی آمدن:</span>
                    <span className="stat-value profit">{totals.SaafiAmdan.toString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label"> ایکسایز:</span>
                    <span className="stat-value">{totals.Exercise.toString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label"> میزان:</span>
                    <span className="stat-value">{totals.KulMaizan.toString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data-message">
            <p>فلٹر کے معیار کے مطابق کوئی ڈیٹا نہیں ملا</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {pendingDelete !== null && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-icon">🗑️</div>
            <h3>حذف کی تصدیق</h3>
            <p>کیا آپ واقعی اس ٹرانزیکشن کو حذف کرنا چاہتے ہیں؟</p>
            <div className="modal-buttons">
              <button
                className="confirm-delete-button"
                onClick={async () => {
                  await window.api.transactions.delete(pendingDelete);
                  setPendingDelete(null);
                  setExpandedId(null);
                  setTransactions(await window.api.transactions.getAll());
                }}
              >
                ✅ تصدیق کریں
              </button>
              <button
                className="cancel-modal-button"
                onClick={() => setPendingDelete(null)}
              >
                ❌ منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {editConfirmId !== null && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-icon">💾</div>
            <h3>تبدیلی کی تصدیق</h3>
            <p>کیا آپ اس ترمیم کو محفوظ کرنا چاہتے ہیں؟</p>
            <div className="modal-buttons">
              <button
                className="confirm-save-button"
                onClick={async () => {
                  const updatedData = editRows[editConfirmId];
                  await window.api.transactions.update({
                    id: editConfirmId,
                    ...updatedData,
                  });
                  setEditConfirmId(null);
                  setEditRows((prev) => {
                    const updated = { ...prev };
                    delete updated[editConfirmId];
                    return updated;
                  });
                  setTransactions(await window.api.transactions.getAll());
                }}
              >
                ✅ ہاں، محفوظ کریں
              </button>
              <button
                className="cancel-modal-button"
                onClick={() => setEditConfirmId(null)}
              >
                ❌ نہیں، منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Keyboard toggle button */}
      <button
        type="button"
        className="circle-btn primary keyboard-toggle"
        onClick={() => setShowKeyboard(!showKeyboard)}
        aria-label="Toggle Urdu Keyboard"
      >
        ⌨️
      </button>

      {/* Urdu Keyboard */}
      {showKeyboard && (
        <UrduKeyboard
          onKeyPress={handleKeyPress}
          onClose={closeKeyboard}
        />
      )}
      <LogoutButton />
      <SyncButton />
    </div>
  );
}

export default TransactionDashboard;
