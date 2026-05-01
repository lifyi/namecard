import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ContactList from './pages/ContactList.jsx'
import AddContact from './pages/AddContact.jsx'
import ContactDetail from './pages/ContactDetail.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ContactList />} />
        <Route path="/add" element={<AddContact />} />
        <Route path="/contact/:id" element={<ContactDetail />} />
        <Route path="/contact/:id/edit" element={<AddContact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
