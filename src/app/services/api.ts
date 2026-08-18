const API_URL = "http://localhost:3000/products";

export interface Product {
  id: string | number;
  name: string;
  sku: string;
  category: "Eletrônicos" | "Vestuário" | "Alimentos" | "Ferramentas" | "Cosméticos";
  quantity: number;
  price: number;
  minStock: number;
}

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Erro ao buscar produtos da API");
  }
  return response.json();
};

export const createProductApi = async (productData: Omit<Product, "id">): Promise<Product> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao cadastrar produto");
  }

  return response.json();
};

export const updateProductApi = async (id: string | number, productData: Omit<Product, "id">): Promise<Product> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao atualizar produto");
  }

  return response.json();
};

export const deleteProductApi = async (id: string | number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao excluir produto");
  }
};
