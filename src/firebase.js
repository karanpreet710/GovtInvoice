import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBfcph_jxNgvLItTe1vrDMMQiwMn_4bjCA",
  authDomain: "govtinvoiceionicreact.firebaseapp.com",
  projectId: "govtinvoiceionicreact",
  storageBucket: "govtinvoiceionicreact.appspot.com",
  messagingSenderId: "84196482208",
  appId: "1:84196482208:web:c2257cb677633104997dc5",
  measurementId: "G-C17R0GTNN3"
};

const app = initializeApp(firebaseConfig);

export default app;