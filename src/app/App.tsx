import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Package,
  AlertTriangle,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Check,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  fetchProducts,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  checkHealthApi,
  ApiError,
  Product as ApiProduct,
} from "./services/api";

type Category = "Eletrônicos" | "Vestuário" | "Alimentos" | "Ferramentas" | "Cosméticos";

interface Product {
  id: string | number;
  _id?: string;
  name: string;
  sku: string;
  category: Category;
  quantity: number;
  price: number;
  minStock: number;
}

const CATEGORIES: Category[] = ["Eletrônicos", "Vestuário", "Alimentos", "Ferramentas", "Cosméticos"];

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "Fone de Ouvido Bluetooth", sku: "ELE-001", category: "Eletrônicos", quantity: 34, price: 189.9, minStock: 10 },
  { id: "2", name: "Camiseta Algodão Premium", sku: "VES-002", category: "Vestuário", quantity: 5, price: 59.9, minStock: 15 },
  { id: "3", name: "Azeite Extra Virgem 500ml", sku: "ALI-003", category: "Alimentos", quantity: 120, price: 24.5, minStock: 30 },
  { id: "4", name: "Chave de Fenda 6 peças", sku: "FER-004", category: "Ferramentas", quantity: 18, price: 45.0, minStock: 8 },
  { id: "5", name: "Hidratante Facial FPS30", sku: "COS-005", category: "Cosméticos", quantity: 3, price: 79.9, minStock: 20 },
  { id: "6", name: "Cabo USB-C 2m", sku: "ELE-006", category: "Eletrônicos", quantity: 67, price: 29.9, minStock: 20 },
  { id: "7", name: "Calça Jeans Slim", sku: "VES-007", category: "Vestuário", quantity: 22, price: 129.9, minStock: 10 },
  { id: "8", name: "Café Torrado 500g", sku: "ALI-008", category: "Alimentos", quantity: 88, price: 18.9, minStock: 25 },
];

const CATEGORY_COLORS: Record<Category, string> = {
  Eletrônicos: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Vestuário: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Alimentos: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Ferramentas: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Cosméticos: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type SortField = "name" | "quantity" | "price" | "category";
type SortDir = "asc" | "desc";

type ModalState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; product: Product }
  | { type: "delete"; product: Product };

interface FormData {
  name: string;
  sku: string;
  category: Category;
  quantity: string;
  price: string;
  minStock: string;
}

const emptyForm = (): FormData => ({
  name: "",
  sku: "",
  category: "Eletrônicos",
  quantity: "",
  price: "",
  minStock: "",
});

function productToForm(p: Product): FormData {
  return {
    name: p.name,
    sku: p.sku,
    category: p.category,
    quantity: String(p.quantity),
    price: String(p.price),
    minStock: String(p.minStock),
  };
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [form, setForm] = useState<FormData>(emptyForm());
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "Todas">("Todas");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "name", dir: "asc" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProductsFromApi();
  }, []);

  async function loadProductsFromApi() {
    setIsRefreshing(true);
    // Testa primeiro se a API/Express está no ar via /health
    const isHealthy = await checkHealthApi();
    if (isHealthy) {
      setApiStatus("online");
      try {
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          showToast("Conectado! Produtos carregados do MongoDB", "success");
        } else {
          showToast("API Online! (Rota /products pronta)", "success");
        }
      } catch (_err) {
        showToast("API Conectada! (Aguardando implementação de /products)", "success");
      }
    } else {
      setApiStatus("offline");
    }
    setIsRefreshing(false);
  }

  async function handleCheckConnection() {
    await loadProductsFromApi();
  }

  const lowStockCount = products.filter((p) => p.quantity <= p.minStock).length;
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const totalItems = products.reduce((s, p) => s + p.quantity, 0);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (filterCategory !== "Todas") {
      list = list.filter((p) => p.category === filterCategory);
    }
    list.sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      if (sort.field === "name") return mul * a.name.localeCompare(b.name);
      if (sort.field === "category") return mul * a.category.localeCompare(b.category);
      if (sort.field === "quantity") return mul * (a.quantity - b.quantity);
      if (sort.field === "price") return mul * (a.price - b.price);
      return 0;
    });
    return list;
  }, [products, search, filterCategory, sort]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openAdd() {
    setForm(emptyForm());
    setErrors({});
    setModal({ type: "add" });
  }

  function openEdit(p: Product) {
    setForm(productToForm(p));
    setErrors({});
    setModal({ type: "edit", product: p });
  }

  function openDelete(p: Product) {
    setModal({ type: "delete", product: p });
  }

  function closeModal() {
    setModal({ type: "none" });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.sku.trim()) e.sku = "SKU obrigatório";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 0)
      e.quantity = "Quantidade inválida";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      e.price = "Preço inválido";
    if (!form.minStock || isNaN(Number(form.minStock)) || Number(form.minStock) < 0)
      e.minStock = "Estoque mínimo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const data: Omit<Product, "id" | "_id"> = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category,
      quantity: Number(form.quantity),
      price: Number(form.price),
      minStock: Number(form.minStock),
    };

    try {
      if (modal.type === "add") {
        const created = await createProductApi(data);
        setProducts((prev) => [...prev, created]);
        showToast("Produto cadastrado com sucesso via API!");
        closeModal();
      } else if (modal.type === "edit") {
        const targetId = modal.product.id || modal.product._id!;
        const updated = await updateProductApi(targetId, data);
        setProducts((prev) => prev.map((p) => (p.id === targetId || p._id === targetId ? updated : p)));
        showToast("Produto atualizado com sucesso via API!");
        closeModal();
      }
    } catch (err: any) {
      if (err instanceof ApiError && !err.isNetworkError) {
        // Erro retornado pela API (ex: 400 SKU duplicado ou validação no servidor)
        showToast(err.message, "error");
        return; // Não fecha o modal para o aluno corrigir o dado
      }

      // Se o servidor estiver offline, faz a alteração em modo simulação local
      showToast("API offline: alteração aplicada localmente", "error");
      if (modal.type === "add") {
        const localCreated: Product = { id: String(Date.now()), ...data };
        setProducts((prev) => [...prev, localCreated]);
      } else if (modal.type === "edit") {
        const targetId = modal.product.id || modal.product._id!;
        setProducts((prev) =>
          prev.map((p) => (p.id === targetId || p._id === targetId ? { ...p, ...data } : p))
        );
      }
      closeModal();
    }
  }

  async function handleDelete() {
    if (modal.type !== "delete") return;
    const targetId = modal.product.id || modal.product._id!;
    try {
      await deleteProductApi(targetId);
      setProducts((prev) => prev.filter((p) => p.id !== targetId && p._id !== targetId));
      showToast("Produto removido com sucesso via API!", "success");
    } catch (err: any) {
      if (err instanceof ApiError && !err.isNetworkError) {
        showToast(err.message, "error");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== targetId && p._id !== targetId));
      showToast("API offline: removido em modo local", "error");
    }
    closeModal();
  }

  function toggleSort(field: SortField) {
    setSort((prev) =>
      prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" }
    );
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sort.field !== field) return <ChevronUp className="opacity-20" size={13} />;
    return sort.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  }

  const isModalOpen = modal.type !== "none";

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium shadow-lg transition-all border ${
            toast.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-800"
              : "bg-rose-950 text-rose-100 border-rose-800"
          }`}
        >
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Package size={24} />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">Gestão de Estoque</h1>
              <p className="text-xs text-muted-foreground">Oficina API - IntegraSI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge da API */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                apiStatus === "online"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : apiStatus === "checking"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
              }`}
            >
              {apiStatus === "online" ? (
                <>
                  <Wifi size={13} className="text-emerald-500" />
                  <span>API Online (http://localhost:3000)</span>
                </>
              ) : apiStatus === "checking" ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-amber-500" />
                  <span>Testando conexão...</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} className="text-rose-500" />
                  <span>API Offline (Modo Local)</span>
                </>
              )}
            </div>

            <button
              onClick={handleCheckConnection}
              disabled={isRefreshing}
              className="p-2 border border-border rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Testar Conexão com API"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={15} />
              Novo Produto
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Produtos cadastrados", value: String(products.length), icon: Package, color: "text-foreground" },
            { label: "Itens em estoque", value: totalItems.toLocaleString("pt-BR"), icon: TrendingUp, color: "text-foreground" },
            { label: "Valor total", value: fmt(totalValue), icon: TrendingUp, color: "text-primary font-semibold" },
            { label: "Estoque baixo", value: String(lowStockCount), icon: AlertTriangle, color: lowStockCount > 0 ? "text-destructive font-semibold" : "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-md p-4">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["Todas", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterCategory(c as typeof filterCategory)}
                className={`px-3 py-2 rounded-md text-sm font-medium border transition-all ${
                  filterCategory === c
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Package size={32} className="opacity-30" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {[
                      { label: "Produto", field: "name" as SortField },
                      { label: "SKU", field: null },
                      { label: "Categoria", field: "category" as SortField },
                      { label: "Qtd.", field: "quantity" as SortField },
                      { label: "Preço unit.", field: "price" as SortField },
                      { label: "Valor total", field: null },
                      { label: "Status", field: null },
                      { label: "", field: null },
                    ].map((col) => (
                      <th
                        key={col.label}
                        onClick={() => col.field && toggleSort(col.field)}
                        className={`px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-muted-foreground ${
                          col.field ? "cursor-pointer select-none hover:text-foreground" : ""
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {col.field && <SortIcon field={col.field} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => {
                    const isLow = p.quantity <= p.minStock;
                    const pKey = p.id || p._id || p.sku;
                    return (
                      <tr key={pKey} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[p.category]}`}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono font-medium ${isLow ? "text-destructive font-bold" : ""}`}>
                            {p.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{fmt(p.price)}</td>
                        <td className="px-4 py-3 font-mono font-medium">{fmt(p.price * p.quantity)}</td>
                        <td className="px-4 py-3">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive font-semibold bg-destructive/10 px-2 py-0.5 rounded">
                              <AlertTriangle size={12} />
                              Baixo
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">OK</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => openDelete(p)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
          <p>
            {filtered.length} produto{filtered.length !== 1 ? "s" : ""} exibido{filtered.length !== 1 ? "s" : ""}
          </p>
          <p>API Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded">http://localhost:3000/products</code></p>
        </div>
      </main>

      {/* Modal overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          {/* Add / Edit Form */}
          {(modal.type === "add" || modal.type === "edit") && (
            <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold">
                  {modal.type === "add" ? "Novo Produto" : "Editar Produto"}
                </h2>
                <button onClick={closeModal} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <Field label="Nome do produto" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Fone de Ouvido Bluetooth"
                    className={inputCls(!!errors.name)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="SKU" error={errors.sku}>
                    <input
                      value={form.sku}
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                      placeholder="ELE-001"
                      className={inputCls(!!errors.sku) + " font-mono"}
                    />
                  </Field>
                  <Field label="Categoria">
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                      className={inputCls(false)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Quantidade" error={errors.quantity}>
                    <input
                      type="number"
                      min={0}
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                      placeholder="0"
                      className={inputCls(!!errors.quantity) + " font-mono"}
                    />
                  </Field>
                  <Field label="Preço (R$)" error={errors.price}>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="0,00"
                      className={inputCls(!!errors.price) + " font-mono"}
                    />
                  </Field>
                  <Field label="Estoque min." error={errors.minStock}>
                    <input
                      type="number"
                      min={0}
                      value={form.minStock}
                      onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                      placeholder="0"
                      className={inputCls(!!errors.minStock) + " font-mono"}
                    />
                  </Field>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  {modal.type === "add" ? "Adicionar" : "Salvar alterações"}
                </button>
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {modal.type === "delete" && (
            <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-sm">
              <div className="px-6 pt-6 pb-4 text-center space-y-3">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={20} className="text-destructive" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Excluir produto</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tem certeza que deseja excluir{" "}
                    <span className="font-medium text-foreground">{modal.product.name}</span>?
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-md text-sm bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full bg-input-background border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 transition-all ${
    hasError
      ? "border-destructive focus:ring-destructive/20"
      : "border-border focus:ring-ring/30 focus:border-primary"
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-mono">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
