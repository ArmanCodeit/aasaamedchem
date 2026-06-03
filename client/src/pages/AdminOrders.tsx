import { useState, useEffect } from "react";
import styles from "./AdminOrders.module.css";

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

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionError, setActionError] = useState<{ orderId: string; message: string } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<{ orderId: string; message: string } | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders", {
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          setOrders(data.orders);
        } else {
          setErrorMsg(data.error || "Failed to load orders.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to connect to backend server.");
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

  const handleUpdateStatus = async (orderId: string, status: "APPROVED" | "REJECTED") => {
    setActionError(null);
    setActionSuccess(null);
    setLoadingOrderId(orderId);

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionError({ orderId, message: data.error || `Failed to update status to ${status}.` });
        setLoadingOrderId(null);
        return;
      }

      // Update local state
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
      setActionSuccess({ orderId, message: `Quotation was successfully ${status.toLowerCase()}!` });
    } catch (err) {
      console.error(err);
      setActionError({ orderId, message: "An unexpected error occurred." });
    } finally {
      setLoadingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <h3>Loading incoming quotations...</h3>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h2>Order & Quotation Manager</h2>
        <p>Review incoming seller quotations, audit precision conversions, and approve stock allocations.</p>
      </div>

      {errorMsg && (
        <div className="badge badge-rejected" style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem" }}>
          {errorMsg}
        </div>
      )}

      {orders.length === 0 ? (
        <div className={styles.noOrders}>
          <p>No incoming quotations or orders have been submitted yet.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const statusClass = `badge-${order.status.toLowerCase()}`;
            const isPending = order.status === "PENDING";
            const isLoading = loadingOrderId === order.id;

            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span className={styles.orderNumber}>{order.orderNumber}</span>
                    <span className={styles.sellerDetails}>
                      Seller: <strong>{order.sellerName}</strong> ({order.sellerEmail})
                    </span>
                  </div>
                  <div className={styles.headerRight}>
                    <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                    <span className={`badge ${statusClass}`}>{order.status}</span>
                  </div>
                </div>

                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Product SKU & Name</th>
                        <th>Ordered Qty & Unit</th>
                        <th>Rate in Order Unit</th>
                        <th>Converted Base Qty</th>
                        <th>Subtotal (INR)</th>
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
                            <td>
                              {item.orderedUnit === item.productBaseUnit ? (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>— (Same as base)</span>
                              ) : (
                                <span>
                                  <strong>{baseQtyNum.toFixed(4)}</strong> {item.productBaseUnit}
                                </span>
                              )}
                            </td>
                            <td style={{ fontWeight: 600, color: "var(--primary-dark)" }}>
                              {subtotalNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.totalSection}>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>Quotation Total:</span>
                    <span className={styles.totalAmount}>
                      {Number(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR
                    </span>
                  </div>

                  {isPending && (
                    <div className={styles.actions}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleUpdateStatus(order.id, "REJECTED")}
                        disabled={isLoading}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleUpdateStatus(order.id, "APPROVED")}
                        disabled={isLoading}
                      >
                        Approve & Deduct Stock
                      </button>
                    </div>
                  )}
                </div>

                {/* Display status updates feedback */}
                {actionError && actionError.orderId === order.id && (
                  <div className={`${styles.feedback} badge badge-rejected`} style={{ padding: "0.625rem", width: "100%", textAlign: "center" }}>
                    ❌ Error: {actionError.message}
                  </div>
                )}
                {actionSuccess && actionSuccess.orderId === order.id && (
                  <div className={`${styles.feedback} badge badge-approved`} style={{ padding: "0.625rem", width: "100%", textAlign: "center" }}>
                    ✅ Success: {actionSuccess.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
