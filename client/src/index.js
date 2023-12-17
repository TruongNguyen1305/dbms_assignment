import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'
import { store, persistor } from "./redux/store";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/lib/integration/react';
import { ToastContainer, toast } from 'react-toastify';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
    <ToastContainer 
      position="bottom-center"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </Provider>
);
