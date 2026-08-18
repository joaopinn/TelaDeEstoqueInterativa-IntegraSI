const BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const API_URL = `${BASE_URL.replace(/\/$/, "")}/products`;
const HEALTH_URL = `${BASE_URL.replace(/\/$/, "")}/health`;

export interface Product {
  id: string | number;
  _id?: string;
  name: string;
  sku: string;
  category: "Eletrônicos" | "Vestuário" | "Alimentos" | "Ferramentas" | "Cosméticos";
  quantity: number;
  price: number;
  minStock: number;
}

export class ApiError extends Error {
  status?: number;
  isNetworkError: boolean;

  constructor(message: string, status?: number, isNetworkError: boolean = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

function normalizeProduct(p: any): Product {
  return {
    ...p,
    id: p.id || p._id || String(Date.now()),
  };
}

export const checkHealthApi = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(HEALTH_URL, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || `Erro ${response.status} ao buscar produtos`, response.status);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(normalizeProduct);
    }
    return [];
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Não foi possível conectar à API", undefined, true);
  }
};

export const createProductApi = async (productData: Omit<Product, "id" | "_id">): Promise<Product> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || `Erro ${response.status} ao cadastrar produto`, response.status);
    }

    const created = await response.json();
    return normalizeProduct(created);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Erro de rede ao cadastrar produto", undefined, true);
  }
};

export const updateProductApi = async (id: string | number, productData: Omit<Product, "id" | "_id">): Promise<Product> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || `Erro ${response.status} ao atualizar produto`, response.status);
    }

    const updated = await response.json();
    return normalizeProduct(updated);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Erro de rede ao atualizar produto", undefined, true);
  }
};

export const deleteProductApi = async (id: string | number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || `Erro ${response.status} ao excluir produto`, response.status);
    }
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Erro de rede ao excluir produto", undefined, true);
  }
};
