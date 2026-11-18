import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminHome from './pages/Admin/AdminHome'
import PatientLogin from './pages/Patient/PatientLogin'
import PatientHome from './pages/Patient/PatientHome'
import Quiz from './pages/Patient/Quiz'
import Register from './pages/Register/Register'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<PatientHome />} />
        <Route path="/questions" element={<PatientHome />} />
        <Route path="/questions/:code" element={<Quiz />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
