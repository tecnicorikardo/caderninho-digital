import type { Client } from '../../types/client';

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onShare: (client: Client) => void;
}

export function ClientList({ clients, onEdit, onDelete, onShare }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#666'
      }}>
        <h3>Nenhum cliente cadastrado</h3>
        <p>Clique em "Novo Cliente" para começar</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gap: '1rem',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
    }}>
      {clients.map((client) => (
        <div
          key={client.id}
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e1e5e9'
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
              {client.name}
            </h3>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
              Cadastrado em {client.createdAt.toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>📧 Email:</strong> {client.email}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>📱 Telefone:</strong> {client.phone}
            </div>
            <div>
              <strong>📍 Endereço:</strong><br />
              {client.address.street}<br />
              {client.address.city} - {client.address.state}<br />
              CEP: {client.address.zipCode}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => onEdit(client)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ✏️ Editar
            </button>
            
            <button
              onClick={() => onShare(client)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#25d366',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              📱 WhatsApp
            </button>
            
            <button
              onClick={() => onDelete(client.id)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🗑️ Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}