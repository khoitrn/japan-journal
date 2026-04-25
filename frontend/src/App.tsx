import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Feed from './pages/Feed'
import DayView from './pages/DayView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/day/:dayNum" element={<DayView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
