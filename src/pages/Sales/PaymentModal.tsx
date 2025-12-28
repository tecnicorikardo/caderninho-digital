import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Sale } from '../../types/sale';
import { saleService } from '../../services/saleService';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  sale: Sale;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentModal({ sale, onSuccess, onCancel }: PaymentModalProps) {
  const [amount, setAmount] = useState<number>(sale.remainingAmount);
  const [method, setMethod] = useState<'dinheiro' | 'pix'>('dinheiro');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0 || amount > sale.remainingAmount) {
      toast.error('Valor inválido');
      return;
    }

    try {
      setLoading(true);
      await saleService.addPayment(sale.id, amount, method, notes);
      
      // Atualizar o valor pago na venda
      const newPaidAmount = sale.paidAmount + amount;
      await saleService.updateSalePayment(sale.id, newPaidAmount);
      
      toast.success('Pagamento adicionado com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao adicionar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px'
      }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Adicionar Pagamento</h3>
        
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px' 
        }}>
          <div>Venda: #{sale.id.slice(-6)}</div>
          <div>Total: R$ {sale.total.toFixed(2)}</div>
          <div>Já pago: R$ {sale.paidAmount.toFixed(2)}</div>
          <div style={{ fontWeight: 'bold', color: '#dc3545' }}>
            Restante: R$ {sale.remainingAmount.toFixed(2)}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Valor do Pagamento (R$)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                setAmount(value === '' ? 0 : Math.max(0, parseFloat(value) || 0));
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  setAmount(0.01);
                }
              }}
              placeholder="0.00"
              min="0.01"
              max={sale.remainingAmount}
              step="0.01"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Forma de Pagamento
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as 'dinheiro' | 'pix')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="dinheiro">💵 Dinheiro</option>
              <option value="pix">📱 PIX</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Salvando...' : 'Adicionar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}