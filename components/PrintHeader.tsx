import React from 'react';
import { useAppContext } from '../context/AppContext';

const PrintHeader: React.FC = () => {
  const { companyInfo } = useAppContext();
  const printDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="print-only print-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {companyInfo.logo && <img src={companyInfo.logo} alt="شعار الشركة" style={{ height: '50px', marginLeft: '15px', objectFit: 'contain' }} />}
          <h1 style={{ fontSize: '16pt', fontWeight: 'bold' }}>{companyInfo.name}</h1>
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ margin: 0 }}>تاريخ الطباعة</p>
          <p style={{ margin: 0 }}>{printDate}</p>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
