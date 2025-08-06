import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getDocs, addDoc, query, where } from "firebase/firestore";
import { numbersCollection } from "../services/firebase";

export default function QRVisitorPage() {
  const [number, setNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numberRange, setNumberRange] = useState(100);
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get range from URL parameters
    const rangeParam = searchParams.get('range');
    if (rangeParam) {
      setNumberRange(parseInt(rangeParam));
    }
  }, [searchParams]);

  const generateUniqueNumber = async () => {
    try {
      // First, get all existing numbers for this event
      const q = query(numbersCollection, where("eventId", "==", eventId || "default"));
      const snapshot = await getDocs(q);
      const existingNumbers = new Set(snapshot.docs.map(doc => parseInt(doc.data().number)));
      
      // Check if all numbers in range are taken
      if (existingNumbers.size >= numberRange) {
        setError(`جميع الأرقام في النطاق (1-${numberRange}) قد تم توزيعها`);
        return null;
      }
      
      // Find the first available number in sequence
      let newNumber = null;
      for (let i = 1; i <= numberRange; i++) {
        if (!existingNumbers.has(i)) {
          newNumber = i.toString();
          break;
        }
      }
      
      if (newNumber) {
        // Double-check by querying the database again to prevent race conditions
        const doubleCheckQuery = query(
          numbersCollection, 
          where("number", "==", newNumber), 
          where("eventId", "==", eventId || "default")
        );
        const doubleCheckSnapshot = await getDocs(doubleCheckQuery);
        
        if (doubleCheckSnapshot.empty) {
          // Add the number to database
          await addDoc(numbersCollection, {
            number: newNumber,
            timestamp: new Date(),
            eventId: eventId || "default",
            range: numberRange,
          });
          return newNumber;
        } else {
          // If number was taken in the meantime, try again
          return await generateUniqueNumber();
        }
      }
      
      setError(`لا توجد أرقام متاحة في النطاق (1-${numberRange})`);
      return null;
    } catch (err) {
      console.error("Error generating number:", err);
      setError("حدث خطأ في توليد الرقم");
      return null;
    }
  };

  useEffect(() => {
    if (numberRange) {
      const saved = localStorage.getItem(`raffle_number_${eventId || 'default'}`);
      if (saved) {
        setNumber(saved);
        setLoading(false);
      } else {
        const assignNumber = async () => {
          const result = await generateUniqueNumber();
          if (result) {
            setNumber(result);
            localStorage.setItem(`raffle_number_${eventId || 'default'}`, result);
          }
          setLoading(false);
        };
        assignNumber();
      }
    }
  }, [eventId, numberRange]);

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
            <h2>جاري توليد رقمك...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", color: "#e53e3e" }}>❌</div>
            <h2 style={{ color: "#e53e3e" }}>{error}</h2>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
              style={{ marginTop: "2rem" }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "2rem" }}></div>
          <h1 style={{ 
            fontSize: "2rem", 
            marginBottom: "2rem", 
            color: "#2d3748",
            fontWeight: "600"
          }}>
            رقمك هو
          </h1>
          <div style={{
            fontSize: "4rem",
            fontWeight: "bold",
            color: "#667eea",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "2rem",
            textShadow: "none"
          }}>
            {number}
          </div>
          <p style={{ 
            color: "#718096", 
            fontSize: "1.1rem",
            lineHeight: "1.6"
          }}>
            احتفظ بهذا الرقم للمشاركة في السحب
          </p>
          <div style={{
            marginTop: "3rem",
            padding: "1rem",
            background: "#f7fafc",
            borderRadius: "12px",
            border: "2px solid #e2e8f0"
          }}>
            <p style={{ 
              margin: 0, 
              color: "#4a5568",
              fontSize: "0.9rem"
            }}>
              تم تسجيل رقمك بنجاح في النظام
            </p>
            <p style={{ 
              margin: "0.5rem 0 0 0", 
              color: "#718096",
              fontSize: "0.8rem"
            }}>
              النطاق: 1 - {numberRange}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
