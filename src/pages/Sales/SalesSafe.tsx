import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
// import { clientService } from "../../services/clientService"; // Não utilizado
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Sale {
  id: string;
  clientName?: string;
  products: Product[];
  total: number;
  paymentMethod: string;
  createdAt: Date;
  userId: string;
}

// interface Client {
//   id: string;
//   name: string;
//   email: string;
// }

export function Sales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    productName: "",
    price: 0,
    quantity: 1,
    paymentMethod: "dinheiro",
  });

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      console.log("Carregando dados...");

      // Carregar vendas
      const q = query(collection(db, "sales"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const salesData: Sale[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        salesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Sale);
      });

      setSales(
        salesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );

      // Carregar clientes (comentado pois não está sendo usado)
      // try {
      //   const firebaseClients = await clientService.getClients(user.uid);
      //   setClients(firebaseClients);
      // } catch (error) {
      //   console.log("Erro ao carregar clientes:", error);
      //   setClients([]);
      // }

      console.log(`${salesData.length} vendas carregadas`);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }

    const price = Number(formData.price) || 0;
    if (!formData.productName || price < 0.01) {
      toast.error("Preencha todos os campos corretamente. Preço mínimo: R$ 0,01");
      return;
    }

    try {
      const price = Number(formData.price) || 0;
      const total = price * formData.quantity;

      const saleData = {
        clientName: formData.clientName || undefined,
        products: [
          {
            id: "1",
            name: formData.productName,
            price: price, // usar o price já convertido
            quantity: formData.quantity,
          },
        ],
        total,
        paymentMethod: formData.paymentMethod,
        userId: user.uid,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "sales"), saleData);

      toast.success("Venda criada com sucesso!");

      // Reset form
      setFormData({
        clientName: "",
        productName: "",
        price: 0,
        quantity: 1,
        paymentMethod: "dinheiro",
      });

      setShowForm(false);
      await loadData();
    } catch (error: any) {
      console.error("Erro ao criar venda:", error);
      toast.error("Erro ao criar venda: " + error.message);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          fontSize: "1.2rem",
        }}
      >
        Carregando vendas...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            padding: "1.5rem 2rem",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                background: "linear-gradient(135deg, #34C759 0%, #30D158 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              💰
            </div>
            <div>
              <h1
                style={{
                  margin: "0 0 0.25rem 0",
                  fontSize: "1.8rem",
                  background:
                    "linear-gradient(135deg, #34C759 0%, #30D158 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: "bold",
                }}
              >
                Vendas
              </h1>
              <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                {sales.length} vendas registradas
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.9rem",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(142, 142, 147, 0.3)",
              }}
            >
              ← Dashboard
            </button>

            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "1rem 2rem",
                background: "linear-gradient(135deg, #34C759 0%, #30D158 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(52, 199, 89, 0.3)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(52, 199, 89, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(52, 199, 89, 0.3)";
              }}
            >
              + Nova Venda
            </button>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            padding: "2rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3
            style={{
              margin: "0 0 1.5rem 0",
              fontSize: "1.4rem",
              fontWeight: "bold",
              color: "#1a1a1a",
            }}
          >
            Vendas Recentes
          </h3>

          {sales.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#666",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛍️</div>
              <h3 style={{ color: "#1a1a1a", marginBottom: "0.5rem" }}>
                Nenhuma venda registrada
              </h3>
              <p style={{ fontSize: "1rem", opacity: 0.7 }}>
                Clique em "Nova Venda" para começar
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  style={{
                    padding: "1.5rem",
                    background: "rgba(248, 249, 250, 0.8)",
                    borderRadius: "16px",
                    border: "1px solid rgba(225, 229, 233, 0.5)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 25px rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          color: "#1a1a1a",
                        }}
                      >
                        {sale.clientName || "Venda Avulsa"}
                      </h4>
                      <div
                        style={{
                          color: "#666",
                          fontSize: "1rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {sale.products
                          .map((p) => `${p.name} (${p.quantity}x)`)
                          .join(", ")}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          color: "#888",
                          fontSize: "0.9rem",
                        }}
                      >
                        <span>
                          📅 {sale.createdAt.toLocaleDateString("pt-BR")}
                        </span>
                        <span>•</span>
                        <span>
                          {sale.paymentMethod === "dinheiro" && "💵"}
                          {sale.paymentMethod === "pix" && "📱"}
                          {sale.paymentMethod === "fiado" && "📝"}
                          {" " + sale.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "1.6rem",
                          fontWeight: "bold",
                          background:
                            "linear-gradient(135deg, #34C759 0%, #30D158 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        R$ {sale.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Venda */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              padding: "2rem",
              borderRadius: "20px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background:
                      "linear-gradient(135deg, #34C759 0%, #30D158 100%)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  💰
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    color: "#1a1a1a",
                  }}
                >
                  Nova Venda
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "rgba(142, 142, 147, 0.2)",
                  border: "none",
                  borderRadius: "10px",
                  width: "40px",
                  height: "40px",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(142, 142, 147, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(142, 142, 147, 0.2)";
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Cliente */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientName: e.target.value,
                    }))
                  }
                  placeholder="Nome do cliente"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "2px solid rgba(225, 229, 233, 0.5)",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    background: "rgba(248, 249, 250, 0.5)",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#34C759";
                    e.currentTarget.style.background = "white";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(225, 229, 233, 0.5)";
                    e.currentTarget.style.background =
                      "rgba(248, 249, 250, 0.5)";
                  }}
                />
              </div>

              {/* Produto */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Produto *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      productName: e.target.value,
                    }))
                  }
                  placeholder="Nome do produto"
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "2px solid rgba(225, 229, 233, 0.5)",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    background: "rgba(248, 249, 250, 0.5)",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#34C759";
                    e.currentTarget.style.background = "white";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(225, 229, 233, 0.5)";
                    e.currentTarget.style.background =
                      "rgba(248, 249, 250, 0.5)";
                  }}
                />
              </div>

              {/* Preço e Quantidade */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        price: value,
                      }));
                    }}
                    onBlur={(e) => {
                      // Validação só ao sair do campo
                      const numValue = Number(e.target.value);
                      if (isNaN(numValue) || numValue < 0.01) {
                        setFormData(prev => ({ ...prev, price: 0.01 }));
                      } else if (numValue > 9999) {
                        setFormData(prev => ({ ...prev, price: 9999 }));
                      }
                      // Restaurar estilo
                      e.currentTarget.style.borderColor = "rgba(225, 229, 233, 0.5)";
                      e.currentTarget.style.background = "rgba(248, 249, 250, 0.5)";
                    }}
                    placeholder="Digite o preço"
                    step="0.01"
                    required
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "2px solid rgba(225, 229, 233, 0.5)",
                      borderRadius: "12px",
                      fontSize: "1rem",
                      background: "rgba(248, 249, 250, 0.5)",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#34C759";
                      e.currentTarget.style.background = "white";
                    }}
                  />
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666', 
                    marginTop: '0.25rem' 
                  }}>
                    💡 Valores permitidos: R$ 0,01 até R$ 9.999,00
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    Quantidade *
                  </label>
                  <input
                    type="text"
                    value={formData.quantity || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permite apenas números
                      if (value === "" || /^\d+$/.test(value)) {
                        const numValue = value === "" ? 0 : parseInt(value);
                        setFormData((prev) => ({ ...prev, quantity: numValue }));
                      }
                    }}
                    onBlur={(e) => {
                      // Se o campo estiver vazio ao perder o foco, define como 1
                      if (e.target.value === "" || formData.quantity === 0) {
                        setFormData((prev) => ({ ...prev, quantity: 1 }));
                      }
                      e.currentTarget.style.borderColor = "rgba(225, 229, 233, 0.5)";
                      e.currentTarget.style.background = "rgba(248, 249, 250, 0.5)";
                    }}
                    placeholder="Digite a quantidade"
                    required
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "2px solid rgba(225, 229, 233, 0.5)",
                      borderRadius: "12px",
                      fontSize: "1rem",
                      background: "rgba(248, 249, 250, 0.5)",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#34C759";
                      e.currentTarget.style.background = "white";
                    }}
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Forma de Pagamento
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "2px solid rgba(225, 229, 233, 0.5)",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    background: "rgba(248, 249, 250, 0.5)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#34C759";
                    e.currentTarget.style.background = "white";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(225, 229, 233, 0.5)";
                    e.currentTarget.style.background =
                      "rgba(248, 249, 250, 0.5)";
                  }}
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="pix">📱 PIX</option>
                  <option value="fiado">📝 Fiado</option>
                </select>
              </div>

              {/* Total */}
              <div
                style={{
                  padding: "1.5rem",
                  background:
                    "linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(48, 209, 88, 0.1) 100%)",
                  borderRadius: "16px",
                  marginBottom: "2rem",
                  textAlign: "center",
                  border: "1px solid rgba(52, 199, 89, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "1rem",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  Total da Venda
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    background:
                      "linear-gradient(135deg, #34C759 0%, #30D158 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  R$ {((Number(formData.price) || 0) * formData.quantity).toFixed(2)}
                </div>
              </div>

              {/* Botões */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background:
                      "linear-gradient(135deg, #8E8E93 0%, #AEAEB2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "1rem",
                    background:
                      "linear-gradient(135deg, #34C759 0%, #30D158 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(52, 199, 89, 0.3)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(52, 199, 89, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 15px rgba(52, 199, 89, 0.3)";
                  }}
                >
                  Criar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
