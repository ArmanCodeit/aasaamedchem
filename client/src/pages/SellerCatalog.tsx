import { useState, useEffect } from "react";
import styles from "./SellerCatalog.module.css";
import {
  calculateBaseQuantity,
  calculateOrderUnitPrice,
  getUnitDimension,
  DIMENSIONS,
} from "../lib/conversions";

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

interface CartItem {
  product: ProductProp;
  orderedQuantity: string;
  orderedUnit: string;
}

export default function SellerCatalog() {
  const [products, setProducts] = useState<ProductProp[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
          setFeedback({ type: "error", message: data.error || "Failed to load products." });
        }
      } catch (err) {
        console.error(err);
        setFeedback({ type: "error", message: "Failed to connect to backend server." });
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

  const renderRates = (product: ProductProp) => {
    const basePrice = Number(product.basePrice);
    const unit = product.baseUnit;
    const dimension = getUnitDimension(unit);

    if (dimension === "Weight") {
      const rateG = calculateOrderUnitPrice(basePrice, unit, "g");
      const rateKg = calculateOrderUnitPrice(basePrice, unit, "kg");
      return (
        <>
          <div className={styles.priceItem}>
            <span className={styles.priceLabel}>Rate (kg):</span>
            <span className={styles.priceVal}>{rateKg.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR/kg</span>
          </div>
          <div className={styles.priceItem}>
            <span className={styles.priceLabel}>Rate (g):</span>
            <span className={styles.priceVal}>{rateG.toLocaleString("en-IN", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} INR/g</span>
          </div>
        </>
      );
    } else if (dimension === "Volume") {
      const rateL = calculateOrderUnitPrice(basePrice, unit, "L");
      const rateMl = calculateOrderUnitPrice(basePrice, unit, "mL");
      return (
        <>
          <div className={styles.priceItem}>
            <span className={styles.priceLabel}>Rate (L):</span>
            <span className={styles.priceVal}>{rateL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR/L</span>
          </div>
          <div className={styles.priceItem}>
            <span className={styles.priceLabel}>Rate (mL):</span>
            <span className={styles.priceVal}>{rateMl.toLocaleString("en-IN", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} INR/mL</span>
          </div>
        </>
      );
    } else {
      return (
        <div className={styles.priceItem}>
          <span className={styles.priceLabel}>Rate (pcs):</span>
          <span className={styles.priceVal}>{basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR/pcs</span>
        </div>
      );
    }
  };

  const addToCart = (product: ProductProp) => {
    if (cart.some((item) => item.product.id === product.id)) {
      setFeedback({ type: "error", message: `${product.name} is already in the quotation cart.` });
      return;
    }

    setCart([...cart, { product, orderedQuantity: "1", orderedUnit: product.baseUnit }]);
    setFeedback({ type: "success", message: `Added ${product.name} to quotation cart.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const updateCartItemUnit = (index: number, newUnit: string) => {
    const updated = [...cart];
    updated[index].orderedUnit = newUnit;
    setCart(updated);
  };

  const updateCartItemQuantity = (index: number, val: string) => {
    const updated = [...cart];
    updated[index].orderedQuantity = val;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const getCartItemDetails = (item: CartItem) => {
    const qty = Number(item.orderedQuantity) || 0;
    const basePrice = Number(item.product.basePrice);
    const unitPriceInOrderUnit = calculateOrderUnitPrice(basePrice, item.product.baseUnit, item.orderedUnit);
    const subtotal = qty * unitPriceInOrderUnit;
    const baseQty = calculateBaseQuantity(qty, item.orderedUnit, item.product.baseUnit);

    return {
      unitPrice: unitPriceInOrderUnit,
      baseQuantity: baseQty,
      subtotal,
    };
  };

  const cartTotal = cart.reduce((sum, item) => {
    const { subtotal } = getCartItemDetails(item);
    return sum + subtotal;
  }, 0);

  const handleSubmitQuotation = async () => {
    if (cart.length === 0) return;

    setFeedback(null);
    setLoading(true);

    // Validate quantities and stock levels
    for (const item of cart) {
      const qty = Number(item.orderedQuantity);
      if (isNaN(qty) || qty <= 0) {
        setFeedback({ type: "error", message: `Please enter a valid quantity for ${item.product.name}.` });
        setLoading(false);
        return;
      }

      const { baseQuantity } = getCartItemDetails(item);
      const stock = Number(item.product.stockQuantity);
      if (baseQuantity > stock) {
        setFeedback({
          type: "error",
          message: `Insufficient stock for ${item.product.name}. Available: ${stock} ${item.product.baseUnit}, Requested: ${baseQuantity} ${item.product.baseUnit}`,
        });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cart.map((item) => {
            const { subtotal, baseQuantity, unitPrice } = getCartItemDetails(item);
            return {
              productId: item.product.id,
              orderedQuantity: item.orderedQuantity,
              orderedUnit: item.orderedUnit,
              pricePerUnit: unitPrice.toString(),
              totalPrice: subtotal.toString(),
              baseQuantity: baseQuantity.toString(),
            };
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({ type: "error", message: data.error || "Failed to submit quotation." });
        setLoading(false);
        return;
      }

      setCart([]);
      setFeedback({ type: "success", message: `Quotation ${data.order.orderNumber} placed successfully!` });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "An error occurred during submission." });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <h3>Loading Product Catalog...</h3>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.catalogSection}>
        <div className={styles.headerRow}>
          <div className={styles.titleSection}>
            <h2>Product Catalog</h2>
            <p>Browse laboratory chemicals and configure high-precision quotes.</p>
          </div>
        </div>

        {feedback && (
          <div
            className={`${styles.feedbackBanner} badge`}
            style={{
              backgroundColor: feedback.type === "success" ? "var(--success-light)" : "var(--error-light)",
              color: feedback.type === "success" ? "var(--success-dark)" : "var(--error-dark)",
              border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
              width: "100%",
            }}
          >
            {feedback.message}
          </div>
        )}

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

        <div className={styles.grid}>
          {filteredProducts.map((p) => {
            const isOutOfStock = Number(p.stockQuantity) <= 0;
            return (
              <div key={p.id} className={styles.productCard}>
                <span className={styles.categoryBadge}>{p.category}</span>
                <span className={styles.sku}>{p.sku}</span>
                <h3 className={styles.name}>{p.name}</h3>
                <p className={styles.description}>{p.description || "No description provided."}</p>

                <div className={styles.priceList}>
                  {renderRates(p)}
                </div>

                <div className={styles.stockRow}>
                  <span>Stock Available:</span>
                  <span className={`${styles.stockStatus} ${isOutOfStock ? styles.stockAlert : styles.stockOk}`}>
                    {Number(p.stockQuantity).toFixed(4)} {p.baseUnit}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Quotation"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.cartSection}>
        <div className={styles.cartHeader}>
          <h3>Quotation Cart</h3>
          <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className={styles.emptyCart}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>Your quotation is empty. Add products from the catalog to build a quotation.</p>
          </div>
        ) : (
          <>
            <div className={styles.cartItemsList}>
              {cart.map((item, index) => {
                const dimName = getUnitDimension(item.product.baseUnit);
                const dimension = DIMENSIONS.find((d) => d.name === dimName);
                const allowedUnits = dimension ? dimension.units : [item.product.baseUnit];
                
                const { unitPrice, baseQuantity, subtotal } = getCartItemDetails(item);
                const stockVal = Number(item.product.stockQuantity);
                const insStock = baseQuantity > stockVal;

                return (
                  <div key={item.product.id} className={styles.cartItem} style={{ borderLeft: insStock ? "4px solid var(--error)" : "1px solid var(--border)" }}>
                    <div className={styles.cartItemHeader}>
                      <span className={styles.cartItemName}>{item.product.name}</span>
                      <button className={styles.cartItemDelete} onClick={() => removeFromCart(index)}>
                        ×
                      </button>
                    </div>

                    <div className={styles.cartItemControls}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Quantity</label>
                        <input
                          type="number"
                          step="any"
                          value={item.orderedQuantity}
                          onChange={(e) => updateCartItemQuantity(index, e.target.value)}
                          style={{ padding: "0.35rem 0.5rem" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Unit</label>
                        <select
                          value={item.orderedUnit}
                          onChange={(e) => updateCartItemUnit(index, e.target.value)}
                          style={{ padding: "0.35rem 0.5rem" }}
                        >
                          {allowedUnits.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.cartItemCalculations}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Unit Rate:</span>
                        <span style={{ fontWeight: 500 }}>
                          {unitPrice.toFixed(8)} INR/{item.orderedUnit}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Base Qty:</span>
                        <span style={{ fontWeight: 500, color: insStock ? "var(--error-dark)" : "var(--text-secondary)" }}>
                          {baseQuantity.toFixed(8)} {item.product.baseUnit}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border)", paddingTop: "0.25rem", marginTop: "0.25rem" }}>
                        <span style={{ fontWeight: 600 }}>Subtotal:</span>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                          {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                        </span>
                      </div>
                    </div>

                    {insStock && (
                      <span style={{ fontSize: "0.7rem", color: "var(--error)", fontWeight: 600, marginTop: "0.25rem" }}>
                        ⚠️ Exceeds stock (max {stockVal.toFixed(4)} {item.product.baseUnit})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.cartSummary}>
              <div className={styles.cartTotalRow}>
                <span>Quotation Total:</span>
                <span style={{ color: "var(--primary-dark)" }}>
                  {cartTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                </span>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSubmitQuotation}
                disabled={loading || cart.some((item) => getCartItemDetails(item).baseQuantity > Number(item.product.stockQuantity))}
                style={{ width: "100%" }}
              >
                {loading ? "Placing Quotation..." : "Place Quotation / Order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
