import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Sistema de Gestão - Teste</h1>
      <nav style={{ marginTop: '2rem' }}>
        <Link to="/dashboard" style={{ marginRight: '1rem', padding: '0.5rem 1rem', backgroundColor: '#2d3748', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
          Dashboard
        </Link>
        <Link to="/reports" style={{ padding: '0.5rem 1rem', backgroundColor: '#3182ce', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
          Relatórios
        </Link>
      </nav>
    </div>
  );
}

function SimpleDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Simples</h1>
      <p>Dashboard funcionando!</p>
      <Link to="/" style={{ padding: '0.5rem 1rem', backgroundColor: '#4a5568', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
        Voltar
      </Link>
    </div>
  );
}

function SimpleReports() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Relatórios Simples</h1>
      <p>Relatórios funcionando!</p>
      <Link to="/" style={{ padding: '0.5rem 1rem', backgroundColor: '#4a5568', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
        Voltar
      </Link>
    </div>
  );
}

function SimpleApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<SimpleDashboard />} />
        <Route path="/reports" element={<SimpleReports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default SimpleApp;