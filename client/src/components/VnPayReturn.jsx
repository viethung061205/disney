import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import "./VnPayReturn.css";

const VnPayReturn = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState(null);

  const vnp_ResponseCode = query.get("vnp_ResponseCode");
  const vnp_TxnRef = query.get("vnp_TxnRef");

  const formatPayDate = (payDate) => {
    if (!payDate || payDate.length !== 14) return "N/A";

    const year = payDate.substring(0, 4);
    const month = payDate.substring(4, 6);
    const day = payDate.substring(6, 8);
    const hour = payDate.substring(8, 10);
    const minute = payDate.substring(10, 12);
    const second = payDate.substring(12, 14);

    const date = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`
    );

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  useEffect(() => {
    const verifyAndFetchData = async () => {
      try {
        const params = Object.fromEntries(query.entries());

        const res = await fetch(
          "http://localhost:3000/api/vnpay/thongtinthanhtoan",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vnp_Params: params }),
          }
        );

        const result = await res.json();

        if (result.success) {
          setDbData(result.orderDetail);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchData();
  }, [location.search]);

  const isSuccess = vnp_ResponseCode === "00";

  if (loading) {
    return (
      <div className="payment-loading">
        Processing payment...
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className={`payment-card ${isSuccess ? "success" : "error"}`}>
        
        {/* HEADER */}
        <div className="payment-header">
          <h1>
            {isSuccess ? "PAYMENT SUCCESSFUL 🎉" : "PAYMENT FAILED ❌"}
          </h1>
        </div>

        {/* BODY */}
        <div className="payment-body">
          {isSuccess ? (
            <>
              {/* Transaction */}
              <div className="section">
                <h3>
                  Transaction ID: {query.get("vnp_TransactionNo")}
                </h3>
                <p className="text-muted">
                  Thank you for using our service.
                </p>
              </div>

              {/* Customer + Bank */}
              <div className="info-grid">
                <div className="info-box">
                  <label>CUSTOMER</label>
                  <p>
                    {query.get("vnp_OrderInfo")?.split(":").pop() ||
                      "Customer"}
                  </p>
                </div>

                <div className="info-box">
                  <label>BANK</label>
                  <p>{query.get("vnp_BankCode")}</p>
                </div>
              </div>

              {/* Ticket */}
              <div className="ticket-detail">
                <label>PAYMENT DETAILS</label>

                <div className="row-payment">
                  <span>Order Reference</span>
                  <span>{vnp_TxnRef}</span>
                </div>

                <div className="row-payment">
                  <span>Payment Time</span>
                  <span className="success-text">
                    {formatPayDate(query.get("vnp_PayDate"))}
                  </span>
                </div>

                <div className="total-payment">
                  <span>Total Amount</span>
                  <span>
                    {(query.get("vnp_Amount") / 100).toLocaleString()} VND
                  </span>
                </div>
              </div>

              <div className="note">
                * Please keep this screen or check your email for your e-ticket.
              </div>
            </>
          ) : (
            <div className="error-content">
              <p>Your transaction was cancelled or failed.</p>
              <p>Error code: {vnp_ResponseCode}</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="payment-footer">
          <Link to="/" className="btn-home">
            BACK TO HOME
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VnPayReturn;