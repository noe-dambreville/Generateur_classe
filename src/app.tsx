import { createRoot } from 'react-dom/client';
import './index.css';
import EditeurClasse from './pages/editeur_classe/editeur_classe';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<EditeurClasse />);
}
