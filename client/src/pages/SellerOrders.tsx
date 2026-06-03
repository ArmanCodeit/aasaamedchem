import { useState, useEffect } from "react";
import styles from "./SellerOrders.module.css";

interface OrderItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productBaseUnit: string;
  orderedQuantity: string;
  orderedUnit: string;
  pricePerUnit: string;
  totalPrice: string;
  baseQuantity: string;
}

interface OrderProp {
  id: string;
  orderNumber: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<OrderProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          setOrders(data.orders);
        } else {
          setError(data.error || "Failed to fetch orders.");
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError("Could not connect to the backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <h3>Loading your quotations...</h3>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h2>My Quotations & Orders</h2>
        <p>Monitor status, review calculations, and track stock deductions of your requests.</p>
      </div>

      {error && (
        <div className="badge badge-rejected" style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className={styles.noOrders}>
          <p>You have not placed any quotations yet.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const statusClass = `badge-${order.status.toLowerCase()}`;
            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderNumber}>{order.orderNumber}</span>
                    <span>Placed on: <strong>{formatDate(order.createdAt)}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span className={styles.totalAmount}>
                      Total: {Number(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR
                    </span>
                    <span className={`badge ${statusClass}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Product SKU & Name</th>
                        <th>Ordered Qty & Unit</th>
                        <th>Unit Price Rate</th>
                        <th>Subtotal Price</th>
                        <th>Converted Base Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => {
                        const qtyNum = Number(item.orderedQuantity);
                        const rateNum = Number(item.pricePerUnit);
                        const subtotalNum = Number(item.totalPrice);
                        const baseQtyNum = Number(item.baseQuantity);

                        return (
                          <tr key={item.id}>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600 }}>{item.productName}</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.productSku}</span>
                              </div>
                            </td>
                            <td>
                              {qtyNum.toFixed(4)} {item.orderedUnit}
                            </td>
                            <td>
                              {rateNum.toFixed(4)} INR/{item.orderedUnit}
                            </td>
                            <td style={{ fontWeight: 600, color: "var(--primary-dark)" }}>
                              {subtotalNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR
                            </td>
                            <td style={{ color: "var(--text-secondary)" }}>
                              {item.orderedUnit === item.productBaseUnit ? (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>— (Same as base)</span>
                              ) : (
                                <span>
                                  <strong>{baseQtyNum.toFixed(4)}</strong> {item.productBaseUnit}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
