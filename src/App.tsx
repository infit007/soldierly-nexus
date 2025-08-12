import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Index from './pages/Index'
import PersonalDetails from './pages/PersonalDetails'
import Education from './pages/Education'
import Family from './pages/Family'
import Leave from './pages/Leave'
import Medical from './pages/Medical'
import Salary from './pages/Salary'
import Others from './pages/Others'
import NotFound from './pages/NotFound'
import { Toaster } from './components/ui/toaster'
import './App.css'

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/personal-details" element={<PersonalDetails />} />
          <Route path="/education" element={<Education />} />
          <Route path="/family" element={<Family />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/medical" element={<Medical />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/others" element={<Others />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster />
    </>
  )
}

export default App
