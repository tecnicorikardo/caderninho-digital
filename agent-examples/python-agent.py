#!/usr/bin/env python3
"""
Exemplo de agente Python para comunicação com a API de gestão
"""

import requests
import json
from typing import Dict, List, Optional

class GestaoAgent:
    def __init__(self, user_id: str, auth_token: Optional[str] = None):
        self.user_id = user_id
        self.auth_token = auth_token
        self.base_url = "https://us-central1-web-gestao-37a85.cloudfunctions.net"
    
    def make_request(self, action: str, data: Optional[Dict] = None) -> Dict:
        """Fazer requisição para a API"""
        payload = {
            "userId": self.user_id,
            "action": action,
            "data": data,
            "token": self.auth_token
        }
        
        response = requests.post(
            f"{self.base_url}/agentAPI",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        return response.json()
    
    def get_sales(self) -> Dict:
        """Buscar todas as vendas"""
        return self.make_request("get_sales")
    
    def create_sale(self, sale_data: Dict) -> Dict:
        """Criar nova venda"""
        return self.make_request("create_sale", sale_data)
    
    def get_clients(self) -> Dict:
        """Buscar clientes"""
        return self.make_request("get_clients")
    
    def get_dashboard(self) -> Dict:
        """Buscar dados do dashboard"""
        return self.make_request("get_dashboard")
    
    def analyze_sales_performance(self) -> Dict:
        """Analisar performance de vendas usando IA"""
        sales_data = self.get_sales()
        
        if not sales_data.get("success"):
            return {"error": "Não foi possível buscar dados de vendas"}
        
        sales = sales_data.get("data", [])
        
        # Análise simples
        total_sales = len(sales)
        total_revenue = sum(sale.get("total", 0) for sale in sales)
        avg_sale_value = total_revenue / total_sales if total_sales > 0 else 0
        
        # Produtos mais vendidos
        product_sales = {}
        for sale in sales:
            products = sale.get("products", [])
            for product in products:
                name = product.get("name", "Produto sem nome")
                quantity = product.get("quantity", 0)
                product_sales[name] = product_sales.get(name, 0) + quantity
        
        top_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "total_sales": total_sales,
            "total_revenue": total_revenue,
            "average_sale_value": avg_sale_value,
            "top_products": top_products,
            "analysis": {
                "performance": "boa" if avg_sale_value > 50 else "regular",
                "recommendation": "Foque nos produtos mais vendidos" if top_products else "Diversifique o catálogo"
            }
        }

def exemplo_uso():
    """Exemplo de como usar o agente"""
    agent = GestaoAgent("USER_ID_AQUI")
    
    try:
        # Buscar vendas
        print("=== VENDAS ===")
        sales = agent.get_sales()
        print(json.dumps(sales, indent=2, ensure_ascii=False))
        
        # Criar nova venda
        print("\n=== CRIAR VENDA ===")
        nova_venda = agent.create_sale({
            "clientName": "Cliente Python",
            "products": [
                {"name": "Produto Python", "price": 25.99, "quantity": 1}
            ],
            "total": 25.99,
            "paymentMethod": "pix"
        })
        print(json.dumps(nova_venda, indent=2, ensure_ascii=False))
        
        # Análise de performance
        print("\n=== ANÁLISE DE PERFORMANCE ===")
        analysis = agent.analyze_sales_performance()
        print(json.dumps(analysis, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    exemplo_uso()