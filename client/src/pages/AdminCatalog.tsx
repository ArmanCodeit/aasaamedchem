import { useState, useEffect } from "react";
import styles from "./AdminCatalog.module.css";

interface ProductProp {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  baseUnit: string;
  basePrice: string;
  stockQuantity: string;
}

export default function AdminCatalog() {
  const [products, setProducts] = useState<ProductProp[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductProp | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [baseUnit, setBaseUnit] = useState("g");
  const [basePrice, setBasePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products", {
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          setProducts(data.products);
        } else {
          setErrorMsg(data.error || "Failed to load products.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to connect to backend server.");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setError("");
    setEditingProduct(null);
    setSku("");
    setName("");
    setDescription("");
    setCategory("");
    setBaseUnit("g");
    setBasePrice("");
    setStockQuantity("");
    setModalOpen(true);
  };

  const openEditModal = (p: ProductProp) => {
    setError("");
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setDescription(p.description || "");
    setCategory(p.category);
    setBaseUnit(p.baseUnit);
    setBasePrice(Number(p.basePrice).toString()); // Clean string for input
    setStockQuantity(Number(p.stockQuantity).toString());
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !category || !baseUnit || !basePrice || !stockQuantity) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setLoading(true);

    const payload = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      description: description ? description.trim() : undefined,
      category: category.trim(),
      baseUnit,
      basePrice: Number(basePrice).toFixed(8),
      stockQuantity: Number(stockQuantity).toFixed(8),
    };

    try {
      const url = editingProduct
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : "http://localhost:5000/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Save operation failed.");
        setLoading(false);
        return;
      }

      // Refresh list
      if (editingProduct) {
        setProducts(products.map((p) => (p.id === editingProduct.id ? data.product : p)));
      } else {
        setProducts([data.product, ...products]);
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Delete failed.");
        return;
      }

      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("An error occurred during deletion.");
    }
  };

  // KPI Calculations
  const totalProducts = products.length;

  const totalValuation = products.reduce((sum, p) => {
    const qty = Number(p.stockQuantity) || 0;
    const price = Number(p.basePrice) || 0;
    return sum + qty * price;
  }, 0);

  const lowStockCount = products.filter((p) => {
    const qty = Number(p.stockQuantity);
    const limit = p.baseUnit === "g" || p.baseUnit === "mL" ? 10000 : 10;
    return qty < limit;
  }).length;

  if (fetchLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <h3>Loading Product Catalog Manager...</h3>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <h2>Catalog Manager</h2>
          <p>Create, update, and manage medical components, base rates, and inventory units.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Product
        </button>
      </div>

      {errorMsg && (
        <div className="badge badge-rejected" style={{ width: "100%", padding: "0.75rem" }}>
          {errorMsg}
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Components</span>
          <span className={styles.statValue}>{totalProducts}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Stock Valuation</span>
          <span className={styles.statValue}>
            {totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Low Stock Alerts</span>
          <span className={styles.statValue} style={{ color: lowStockCount > 0 ? "var(--error)" : "var(--success-dark)" }}>
            {lowStockCount}
          </span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Filter by SKU or Name..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.filter((c) => c !== "all").map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Component Name</th>
                <th>Category</th>
                <th>Base Unit</th>
                <th>Base Rate (INR)</th>
                <th>Stock Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    No products found in the catalog.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "var(--primary-dark)" }}>{p.sku}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        {p.description && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        {p.category}
                      </span>
                    </td>
                    <td>{p.baseUnit}</td>
                    <td style={{ fontWeight: 600 }}>
                      {Number(p.basePrice).toLocaleString("en-IN", { minimumFractionDigits: 4 })} INR
                    </td>
                    <td style={{ fontWeight: 600, color: Number(p.stockQuantity) <= 0 ? "var(--error)" : "var(--text-primary)" }}>
                      {Number(p.stockQuantity).toFixed(4)} {p.baseUnit}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                          onClick={() => openEditModal(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>

            {error && <div className="badge badge-rejected" style={{ width: "100%", textAlign: "center", padding: "0.5rem" }}>{error}</div>}

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGrid}>
                <div className={styles.formSpan2}>
                  <label htmlFor="sku">SKU Code (Unique)*</label>
                  <input
                    id="sku"
                    type="text"
                    placeholder="e.g. PROD-ASA-002"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    disabled={!!editingProduct}
                  />
                </div>

                <div className={styles.formSpan2}>
                  <label htmlFor="name">Product/Component Name*</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Acetylsalicylic acid"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formSpan2}>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Provide chemical specs or detail notes..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: "100%", resize: "none" }}
                  />
                </div>

                <div>
                  <label htmlFor="category">Category*</label>
                  <input
                    id="category"
                    type="text"
                    placeholder="e.g. APIs, Solvents"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="baseUnit">Base Unit*</label>
                  <select
                    id="baseUnit"
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    required
                    disabled={!!editingProduct}
                  >
                    <option value="g">grams (g)</option>
                    <option value="kg">kilograms (kg)</option>
                    <option value="mL">milliliters (mL)</option>
                    <option value="L">liters (L)</option>
                    <option value="items">items (pcs)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="basePrice">Base Price Rate (INR)*</label>
                  <input
                    id="basePrice"
                    type="number"
                    step="any"
                    placeholder="Price per base unit"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="stockQuantity">Stock Quantity*</label>
                  <input
                    id="stockQuantity"
                    type="number"
                    step="any"
                    placeholder="Inventory level in base unit"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
