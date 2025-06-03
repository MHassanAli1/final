import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import CreateTransactionForm from './components/CreateTransactionForm.jsx';
import TransactionDashboard from './components/TransactionDashboard.jsx';
import Report from './components/report.jsx'; // Make sure this path is correct

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TransactionDashboard />} />
        <Route path="/CreateTransactionForm" element={<CreateTransactionForm />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </Router>
  );
}

export default App;
