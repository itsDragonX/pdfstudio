import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';
import './core/pdfjs-init';
import { ThemeProvider } from './app/store/ThemeContext';
import { DocumentProvider } from './app/store/DocumentContext';
import { EditProvider } from './features/edit/context/EditContext';
import { StampProvider } from './features/stamp/context/StampContext';
import { ConvertProvider } from './features/convert/context/ConvertContext';
import { FinishProvider } from './features/finish/context/FinishContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <DocumentProvider>
        <EditProvider>
          <StampProvider>
            <ConvertProvider>
              <FinishProvider>
                <App />
              </FinishProvider>
            </ConvertProvider>
          </StampProvider>
        </EditProvider>
      </DocumentProvider>
    </ThemeProvider>
  </React.StrictMode>
);
