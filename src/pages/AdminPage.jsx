import { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getDocs, deleteDoc, query, where } from "firebase/firestore";
import { numbersCollection } from "../services/firebase";
import { useAuth } from "../contexts/SimpleAuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminPage.css";

export default function AdminPage() {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [numberRange, setNumberRange] = useState("100");
  const [campaignLink, setCampaignLink] = useState("");
  const [eventId, setEventId] = useState("");
  const [logo, setLogo] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const qrRef = useRef();
  
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Load saved project info from localStorage
  useEffect(() => {
    const savedEventId = localStorage.getItem("eventId");
    const savedProjectName = localStorage.getItem("projectName");
    const savedRange = localStorage.getItem("numberRange");
    const savedLink = localStorage.getItem("campaignLink");
    const savedStep = localStorage.getItem("adminStep");

    if (savedEventId) setEventId(savedEventId);
    if (savedProjectName) setProjectName(savedProjectName);
    if (savedRange) setNumberRange(savedRange);
    if (savedLink) setCampaignLink(savedLink);
    if (savedStep) setStep(parseInt(savedStep));
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (eventId) {
      localStorage.setItem("eventId", eventId);
      localStorage.setItem("projectName", projectName);
      localStorage.setItem("numberRange", numberRange);
      localStorage.setItem("campaignLink", campaignLink);
      localStorage.setItem("adminStep", step.toString());
    }
  }, [eventId, projectName, numberRange, campaignLink, step]);

  // Generate random event ID and link
  const generateCampaignLink = (name) => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanName = name.replace(/\s+/g, '-').toLowerCase();
    const generatedEventId = `${cleanName}-${randomId}`;
    
    // Use GitHub Pages URL for production or localhost for development
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://Osam7ko.github.io/raffle-app' 
      : window.location.origin;
    const fullLink = `${baseUrl}/visitor/${generatedEventId}?range=${numberRange}`;
    
    setEventId(generatedEventId);
    setCampaignLink(fullLink);
    return fullLink;
  };

  const handleNext = () => {
    if (step === 1 && projectName.trim()) {
      generateCampaignLink(projectName);
    }
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      alert("لم يتم العثور على رمز QR.");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code.png";
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(campaignLink);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 3000);
  };

  const fetchEntries = async () => {
    try {
      const snapshot = await getDocs(numbersCollection);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(entry => entry.eventId === eventId || (!entry.eventId && eventId === "default"));
      setEntries(data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  const clearDatabase = async () => {
    if (!window.confirm("هل أنت متأكد من حذف جميع الأرقام المسجلة؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }

    setIsClearing(true);
    try {
      const q = query(numbersCollection, where("eventId", "==", eventId));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setEntries([]);
      setSelectedNumber(null);
      alert("تم حذف جميع الأرقام بنجاح!");
    } catch (error) {
      console.error("Error clearing database:", error);
      alert("حدث خطأ أثناء حذف البيانات");
    } finally {
      setIsClearing(false);
    }
  };

  const drawWinner = () => {
    if (entries.length > 0) {
      const randomIndex = Math.floor(Math.random() * entries.length);
      setSelectedNumber(entries[randomIndex].number);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all stored data
      localStorage.removeItem("eventId");
      localStorage.removeItem("projectName");
      localStorage.removeItem("numberRange");
      localStorage.removeItem("campaignLink");
      localStorage.removeItem("adminStep");
      
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  useEffect(() => {
    if ((step === 4 || step === 5) && eventId) {
      fetchEntries();
    }
  }, [step, eventId]);

  const getStepStatus = (stepNumber) => {
    if (stepNumber < step) return "completed";
    if (stepNumber === step) return "active";
    return "inactive";
  };

  return (
    <div className="admin-container">
      {showCopySuccess && (
        <div className="copy-success">
          تم نسخ الرابط بنجاح! ✅
        </div>
      )}
      
      <div className="admin-card">
        <div className="admin-header">
          <div className="admin-top-bar">
            <div className="user-info">
              <span className="user-email">{currentUser?.email}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary btn-small">
              تسجيل الخروج
            </button>
          </div>
          
          <h1 className="admin-title">إعداد المسؤول</h1>
          
          <div className="step-indicator">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`step-circle ${getStepStatus(stepNumber)}`}
              >
                {stepNumber}
              </div>
            ))}
          </div>
        </div>

        <div className="step-content">
          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">
                  اسم المشروع أو الحدث:
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="مثال: سحب جوائز رمضان 2024"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  نطاق الأرقام:
                </label>
                <div className="range-options">
                  {["100", "200", "300"].map((range) => (
                    <label key={range} className="range-option">
                      <input
                        type="radio"
                        name="numberRange"
                        value={range}
                        checked={numberRange === range}
                        onChange={(e) => setNumberRange(e.target.value)}
                        className="range-radio"
                      />
                      <span className="range-label">1 - {range}</span>
                    </label>
                  ))}
                </div>
              </div>

              {projectName.trim() && (
                <div className="preview-info">
                  <p style={{ color: "#667eea", fontSize: "0.9rem" }}>
                    سيتم إنشاء رابط فريد لمشروعك تلقائياً
                  </p>
                  <p style={{ color: "#48bb78", fontSize: "0.9rem" }}>
                    نطاق الأرقام المختار: 1 - {numberRange}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>تم إنشاء الرابط بنجاح!</h3>
              <div className="project-info">
                <div className="info-item">
                  <strong>اسم المشروع:</strong> {projectName}
                </div>
                <div className="info-item">
                  <strong>معرف المشروع:</strong> {eventId}
                </div>
                <div className="info-item">
                  <strong>نطاق الأرقام:</strong> 1 - {numberRange}
                </div>
              </div>
              
              <div className="link-display">
                {campaignLink}
              </div>
              
              <div className="qr-container">
                <div ref={qrRef} className="qr-wrapper">
                  <QRCodeCanvas
                    value={campaignLink}
                    size={220}
                    level="M"
                    includeMargin={true}
                    imageSettings={logo ? {
                      src: URL.createObjectURL(logo),
                      height: 50,
                      width: 50,
                      excavate: true,
                    } : undefined}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">إضافة شعار (اختياري):</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogo(e.target.files[0])}
                    className="file-input"
                  />
                  {logo && (
                    <p style={{ color: "#48bb78", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                      ✅ تم رفع الشعار بنجاح
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>مشاركة المشروع</h3>
              <div className="share-options">
                <div className="share-item">
                  <h4>الرابط المباشر:</h4>
                  <div className="link-display">
                    {campaignLink}
                  </div>
                </div>
                
                <div className="share-item">
                  <h4>رمز QR:</h4>
                  <div className="qr-container">
                    <div className="qr-wrapper">
                      <QRCodeCanvas
                        value={campaignLink}
                        size={200}
                        level="M"
                        includeMargin={true}
                        imageSettings={logo ? {
                          src: URL.createObjectURL(logo),
                          height: 45,
                          width: 45,
                          excavate: true,
                        } : undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="button-group">
                <button onClick={handleCopyLink} className="btn btn-primary">
                  📋 نسخ الرابط
                </button>
                <button onClick={handleDownload} className="btn btn-secondary">
                  ⬇️ تحميل QR كصورة
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="entries-header">
                <h3>الأرقام المسجلة ({entries.length})</h3>
                {entries.length > 0 && (
                  <button 
                    onClick={clearDatabase}
                    disabled={isClearing}
                    className="btn btn-danger btn-small"
                  >
                    {isClearing ? "جاري الحذف..." : "🗑️ مسح جميع الأرقام"}
                  </button>
                )}
              </div>
              
              {entries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <p>لا توجد أرقام مسجلة حتى الآن.</p>
                  <p style={{ fontSize: "0.9rem", color: "#718096" }}>
                    النطاق المحدد: 1 - {numberRange}
                  </p>
                </div>
              ) : (
                <div className="entries-list">
                  {entries.map((entry, index) => (
                    <div key={entry.id || index} className="entry-item">
                      <div className="entry-number">{entry.number}</div>
                      <div className="entry-time">
                        {new Date(entry.timestamp?.seconds * 1000).toLocaleString("ar-EG")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <h3>صفحة السحب العشوائي</h3>
              <div className="button-group">
                <button 
                  onClick={drawWinner} 
                  className="btn btn-success btn-large"
                  disabled={entries.length === 0}
                >
                  🎯 اسحب رقم عشوائي
                </button>
              </div>
              
              {selectedNumber && (
                <div className="winner-display">
                  <h2>🎉 الفائز 🎉</h2>
                  <div className="winner-number">{selectedNumber}</div>
                </div>
              )}
              
              {entries.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🎲</div>
                  <p>لا يمكن إجراء السحب - لا توجد أرقام مسجلة</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="navigation-buttons">
          {step > 1 && (
            <button onClick={handleBack} className="btn btn-secondary">
              → رجوع
            </button>
          )}
          {step < 5 && (
            <button 
              onClick={handleNext} 
              className="btn btn-primary"
              disabled={step === 1 && !projectName.trim()}
            >
              التالي ←
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
